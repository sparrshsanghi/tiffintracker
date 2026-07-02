const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {
  onboardingSessionsRef,
  approvalsRef,
  auditLogsRef,
  businessRef,
  settingsRef,
  customersRef,
  db,
} = require("./helpers/firestore");
const {verifyManagerPIN, getPINs} = require("./helpers/auth");

const DEFAULT_PROMPT_VERSION = "onboarding.v1";
const SESSION_TTL_HOURS = 24;

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildSummary(draft) {
  const parts = [];
  if (draft.name) parts.push(`Name: ${draft.name}`);
  if (draft.phone) parts.push(`Phone: ${draft.phone}`);
  if (draft.address) parts.push(`Address: ${draft.address}`);
  if (draft.group) parts.push(`Group: ${draft.group}`);
  if (draft.plan) parts.push(`Plan: ${draft.plan}`);
  if (draft.food) parts.push(`Food: ${draft.food}`);
  if (draft.rate) parts.push(`Rate: ₹${draft.rate}`);
  if (draft.notes) parts.push(`Notes: ${draft.notes}`);
  return parts.join("\n");
}

function buildSystemPrompt(version) {
  return [
    `You are Maa Sharda's onboarding extractor. Prompt version: ${version || DEFAULT_PROMPT_VERSION}.`,
    "Extract a structured customer profile from the user's message.",
    "Return JSON only with keys: name, phone, address, group, plan, food, rate, notes, intent, missingFields, confidence.",
    "Plan must be one of daily or monthly when present.",
    "Phone must be normalized to a 10-digit Indian mobile number when possible.",
    "Rate must be a number when mentioned.",
    "missingFields must list the fields still required to confirm onboarding.",
    "confidence must be a number from 0 to 1.",
  ].join(" ");
}

async function callGeminiExtract(text, promptVersion, apiKey) {
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {text: buildSystemPrompt(promptVersion)},
              {text: `User message: ${text}`},
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function writeAudit(eventType, data, actor) {
  await auditLogsRef().add({
    eventType,
    actor: actor || "system",
    data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function createOrUpdateSession({sessionId, inputText, extracted, source}) {
  const ref = sessionId ? onboardingSessionsRef().doc(sessionId) : onboardingSessionsRef().doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000),
  );
  const snapshot = await ref.get();
  const current = snapshot.exists ? snapshot.data() : {};
  const draft = Object.assign({}, current.draft || {}, extracted || {});
  const missingFields = ["name", "phone", "address", "plan", "food", "rate"]
      .filter((key) => !draft[key]);
  const status = missingFields.length === 0 ? "ready_for_confirmation" : "collecting";

  await ref.set({
    status,
    source: source || current.source || "chat",
    promptVersion: current.promptVersion || DEFAULT_PROMPT_VERSION,
    draft,
    missingFields,
    latestInput: inputText,
    latestExtraction: extracted || null,
    expiresAt,
    updatedAt: now,
    createdAt: current.createdAt || now,
  }, {merge: true});

  await writeAudit("onboarding_session_updated", {
    sessionId: ref.id,
    status,
    source: source || current.source || "chat",
    missingFields,
  });

  return {sessionId: ref.id, status, draft, missingFields};
}

const startOnboarding = onCall(async (request) => {
  const {text, sessionId, source} = request.data || {};
  if (!text || typeof text !== "string") {
    throw new HttpsError("invalid-argument", "text is required.");
  }

  const {onboardingPromptVersion, geminiApiKey} = await getPINs();
  const resolvedGeminiApiKey = process.env.GEMINI_API_KEY || geminiApiKey || "";
  let extracted = null;
  try {
    extracted = await callGeminiExtract(text, onboardingPromptVersion, resolvedGeminiApiKey);
  } catch (error) {
    extracted = null;
  }

  const normalized = extracted || {};
  if (normalized.phone) {
    normalized.phone = normalizePhone(normalized.phone);
  }
  if (normalized.rate !== undefined) {
    normalized.rate = toNumber(normalized.rate);
  }
  if (!normalized.plan && /monthly/i.test(text)) {
    normalized.plan = "monthly";
  } else if (!normalized.plan && /daily/i.test(text)) {
    normalized.plan = "daily";
  }

  return createOrUpdateSession({
    sessionId,
    inputText: text,
    extracted: normalized,
    source,
  });
});

const saveOnboardingDraft = onCall(async (request) => {
  const {sessionId, draft} = request.data || {};
  if (!sessionId || !draft) {
    throw new HttpsError("invalid-argument", "sessionId and draft are required.");
  }

  const ref = onboardingSessionsRef().doc(sessionId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "Onboarding session not found.");
  }

  const current = snapshot.data();
  const mergedDraft = Object.assign({}, current.draft || {}, draft);
  if (mergedDraft.phone) {
    mergedDraft.phone = normalizePhone(mergedDraft.phone);
  }
  if (mergedDraft.rate !== undefined) {
    mergedDraft.rate = toNumber(mergedDraft.rate);
  }
  const missingFields = ["name", "phone", "address", "plan", "food", "rate"]
      .filter((key) => !mergedDraft[key]);
  const status = missingFields.length === 0 ? "ready_for_confirmation" : "collecting";

  await ref.set({
    draft: mergedDraft,
    missingFields,
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  await writeAudit("onboarding_draft_saved", {
    sessionId,
    status,
    missingFields,
  });

  return {sessionId, status, draft: mergedDraft, missingFields};
});

const confirmOnboarding = onCall(async (request) => {
  const {sessionId, draft} = request.data || {};
  if (!sessionId) {
    throw new HttpsError("invalid-argument", "sessionId is required.");
  }

  const ref = onboardingSessionsRef().doc(sessionId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "Onboarding session not found.");
  }

  const current = snapshot.data();
  const mergedDraft = Object.assign({}, current.draft || {}, draft || {});
  mergedDraft.phone = normalizePhone(mergedDraft.phone);
  mergedDraft.rate = toNumber(mergedDraft.rate);

  const missingFields = ["name", "phone", "address", "plan", "food", "rate"]
      .filter((key) => !mergedDraft[key]);
  if (missingFields.length > 0) {
    throw new HttpsError("failed-precondition", `Missing fields: ${missingFields.join(", ")}`);
  }

  await ref.set({
    status: "pending_manager_approval",
    draft: mergedDraft,
    missingFields: [],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  const approvalRef = approvalsRef().doc();
  await approvalRef.set({
    type: "customer_onboarding",
    sessionId,
    status: "pending",
    draft: mergedDraft,
    source: current.source || "chat",
    promptVersion: current.promptVersion || DEFAULT_PROMPT_VERSION,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await writeAudit("onboarding_confirmed", {
    sessionId,
    approvalId: approvalRef.id,
  });

  return {
    sessionId,
    approvalId: approvalRef.id,
    status: "pending_manager_approval",
    summary: buildSummary(mergedDraft),
  };
});

const listOnboardingQueue = onCall(async (request) => {
  const {pin} = request.data || {};
  if (!pin) {
    throw new HttpsError("invalid-argument", "pin is required.");
  }
  const valid = await verifyManagerPIN(pin);
  if (!valid) {
    throw new HttpsError("permission-denied", "Invalid PIN.");
  }

  const approvals = await approvalsRef()
      .where("type", "==", "customer_onboarding")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

  const items = approvals.docs.map((doc) => Object.assign({id: doc.id}, doc.data()));
  return {items};
});

const resolveOnboardingApproval = onCall(async (request) => {
  const {pin, approvalId, action, managerNote} = request.data || {};
  if (!pin || !approvalId || !action) {
    throw new HttpsError("invalid-argument", "pin, approvalId, and action are required.");
  }
  const valid = await verifyManagerPIN(pin);
  if (!valid) {
    throw new HttpsError("permission-denied", "Invalid PIN.");
  }

  if (!["approve", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "action must be approve or reject.");
  }

  const approvalRef = approvalsRef().doc(approvalId);
  const approvalSnap = await approvalRef.get();
  if (!approvalSnap.exists) {
    throw new HttpsError("not-found", "Approval not found.");
  }

  const approval = approvalSnap.data();
  const sessionRef = onboardingSessionsRef().doc(approval.sessionId);
  const sessionSnap = await sessionRef.get();
  const sessionData = sessionSnap.exists ? sessionSnap.data() : {};

  if (action === "approve") {
    const draft = approval.draft || sessionData.draft || {};
    const customerRef = customersRef().doc();
    await db.runTransaction(async (transaction) => {
      transaction.set(customerRef, {
        name: draft.name,
        phone: normalizePhone(draft.phone),
        address: draft.address,
        group: draft.group || "",
        plan: draft.plan,
        food: draft.food,
        rate: toNumber(draft.rate) || 0,
        active: true,
        paused: false,
        onboardingSource: approval.source || "chat",
        onboardingSessionId: approval.sessionId,
        onboardingPromptVersion: approval.promptVersion || DEFAULT_PROMPT_VERSION,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.set(approvalRef, {
        status: "approved",
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        resolvedBy: "manager",
        managerNote: managerNote || "",
        customerId: customerRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      transaction.set(sessionRef, {
        status: "approved",
        customerId: customerRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    });

    await writeAudit("onboarding_approved", {
      approvalId,
      sessionId: approval.sessionId,
      customerId: customerRef.id,
      managerNote: managerNote || "",
    }, "manager");

    return {success: true, status: "approved", customerId: customerRef.id};
  }

  await approvalRef.set({
    status: "rejected",
    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    resolvedBy: "manager",
    managerNote: managerNote || "",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
  await sessionRef.set({
    status: "rejected",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
  await writeAudit("onboarding_rejected", {
    approvalId,
    sessionId: approval.sessionId,
    managerNote: managerNote || "",
  }, "manager");
  return {success: true, status: "rejected"};
});

module.exports = {
  startOnboarding,
  saveOnboardingDraft,
  confirmOnboarding,
  listOnboardingQueue,
  resolveOnboardingApproval,
};
