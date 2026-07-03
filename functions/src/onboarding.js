const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {FieldValue, Timestamp} = require("firebase-admin/firestore");
const {
  onboardingSessionsRef,
  approvalsRef,
  auditLogsRef,
  businessRef,
  BUSINESS_ID,
  settingsRef,
  customersRef,
  db,
} = require("./helpers/firestore");
const {verifyManagerPIN, getPINs} = require("./helpers/auth");
const {generateAuthUid} = require("./identityService");

const DEFAULT_PROMPT_VERSION = "onboarding.v1";
const SESSION_TTL_HOURS = 24;

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function structuredError(status, code, message, details) {
  throw new HttpsError(status, message, Object.assign({code}, details || {}));
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

function getMissingFields(draft) {
  return ["name", "phone", "address", "plan", "food", "rate"]
      .filter((key) => {
        if (key === "phone") return normalizePhone(draft.phone).length !== 10;
        if (key === "rate") return !(toNumber(draft.rate) > 0);
        return !draft[key];
      });
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return 0;
}

async function findExistingCustomerByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length !== 10) return null;

  const directSnap = await customersRef().doc(normalizedPhone).get();
  if (directSnap.exists) {
    return {id: directSnap.id, data: directSnap.data()};
  }

  const snap = await customersRef()
      .where("phone", "==", normalizedPhone)
      .limit(1)
      .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return {id: doc.id, data: doc.data()};
}

async function rejectExistingCustomerPhone(phone) {
  const existing = await findExistingCustomerByPhone(phone);
  if (!existing) return;
  structuredError("already-exists", "CUSTOMER_PHONE_EXISTS", "Customer already exists for this phone.", {
    phone: normalizePhone(phone),
    customerId: existing.id,
  });
}

async function findExistingCustomerByPhoneInTransaction(transaction, phone) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length !== 10) return null;

  const directRef = customersRef().doc(normalizedPhone);
  const directSnap = await transaction.get(directRef);
  if (directSnap.exists) {
    return {id: directSnap.id, data: directSnap.data()};
  }

  const querySnap = await transaction.get(
      customersRef().where("phone", "==", normalizedPhone).limit(1),
  );
  if (querySnap.empty) return null;
  const doc = querySnap.docs[0];
  return {id: doc.id, data: doc.data()};
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
    createdAt: FieldValue.serverTimestamp(),
  });
}

function hasManagerClaim(request) {
  const token = request.auth?.token || {};
  return token.manager === true ||
    (token.role === "manager" && token.businessId === BUSINESS_ID);
}

async function verifyManagerAccess(request, pin) {
  if (hasManagerClaim(request)) return true;
  if (!pin) return false;
  return verifyManagerPIN(pin);
}

async function createOrUpdateSession({sessionId, inputText, extracted, source}) {
  const ref = sessionId ? onboardingSessionsRef().doc(sessionId) : onboardingSessionsRef().doc();
  const now = FieldValue.serverTimestamp();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000),
  );
  const snapshot = await ref.get();
  const current = snapshot.exists ? snapshot.data() : {};
  const draft = Object.assign({}, current.draft || {}, extracted || {});
  if (draft.phone) {
    draft.phone = normalizePhone(draft.phone);
    await rejectExistingCustomerPhone(draft.phone);
  }
  const missingFields = getMissingFields(draft);
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
    await rejectExistingCustomerPhone(mergedDraft.phone);
  }
  if (mergedDraft.rate !== undefined) {
    mergedDraft.rate = toNumber(mergedDraft.rate);
  }
  const missingFields = getMissingFields(mergedDraft);
  const status = missingFields.length === 0 ? "ready_for_confirmation" : "collecting";

  await ref.set({
    draft: mergedDraft,
    missingFields,
    status,
    updatedAt: FieldValue.serverTimestamp(),
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

  const approvalRef = approvalsRef().doc();
  const result = await db.runTransaction(async (transaction) => {
    const ref = onboardingSessionsRef().doc(sessionId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      structuredError("not-found", "ONBOARDING_SESSION_NOT_FOUND", "Onboarding session not found.");
    }

    const current = snapshot.data();
    if (["approved", "rejected"].includes(current.status)) {
      structuredError("failed-precondition", "ONBOARDING_SESSION_RESOLVED", `Onboarding session is already ${current.status}.`, {
        sessionId,
        status: current.status,
      });
    }

    const existingApprovalsSnap = await transaction.get(
        approvalsRef().where("sessionId", "==", sessionId),
    );
    const pendingApprovals = existingApprovalsSnap.docs
        .map((doc) => Object.assign({id: doc.id}, doc.data()))
        .filter((item) => item.status === "pending");
    if (pendingApprovals.length > 1) {
      structuredError("failed-precondition", "DUPLICATE_PENDING_APPROVALS", "Multiple pending approvals exist for this onboarding session.", {
        sessionId,
        approvalIds: pendingApprovals.map((item) => item.id),
      });
    }
    if (pendingApprovals.length === 1) {
      const existing = pendingApprovals[0];
      return {
        created: false,
        sessionId,
        approvalId: existing.id,
        status: "pending_manager_approval",
        draft: existing.draft || current.draft || {},
      };
    }

    const mergedDraft = Object.assign({}, current.draft || {}, draft || {});
    mergedDraft.phone = normalizePhone(mergedDraft.phone);
    mergedDraft.rate = toNumber(mergedDraft.rate);

    const missingFields = getMissingFields(mergedDraft);
    if (missingFields.length > 0) {
      structuredError("failed-precondition", "ONBOARDING_MISSING_FIELDS", `Missing fields: ${missingFields.join(", ")}`, {
        sessionId,
        missingFields,
      });
    }

    const existingCustomer = await findExistingCustomerByPhoneInTransaction(transaction, mergedDraft.phone);
    if (existingCustomer) {
      structuredError("already-exists", "CUSTOMER_PHONE_EXISTS", "Customer already exists for this phone.", {
        phone: mergedDraft.phone,
        customerId: existingCustomer.id,
      });
    }

    transaction.set(ref, {
      status: "pending_manager_approval",
      approvalId: approvalRef.id,
      approvalStatus: "pending",
      draft: mergedDraft,
      missingFields: [],
      updatedAt: FieldValue.serverTimestamp(),
      confirmedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    transaction.set(approvalRef, {
      type: "customer_onboarding",
      sessionId,
      status: "pending",
      draft: mergedDraft,
      source: current.source || "chat",
      promptVersion: current.promptVersion || DEFAULT_PROMPT_VERSION,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      created: true,
      sessionId,
      approvalId: approvalRef.id,
      status: "pending_manager_approval",
      draft: mergedDraft,
    };
  });

  if (result.created) {
    await writeAudit("onboarding_confirmed", {
      sessionId,
      approvalId: result.approvalId,
    });
  }

  return {
    sessionId,
    approvalId: result.approvalId,
    status: result.status,
    summary: buildSummary(result.draft),
  };
});

const listOnboardingQueue = onCall(async (request) => {
  const {pin} = request.data || {};
  const valid = await verifyManagerAccess(request, pin);
  if (!valid) {
    throw new HttpsError("permission-denied", "Manager authorization is required.");
  }

  const approvals = await approvalsRef()
      .where("type", "==", "customer_onboarding")
      .where("status", "==", "pending")
      .get();

  const items = approvals.docs
      .map((doc) => Object.assign({id: doc.id}, doc.data()))
      .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
  return {items};
});

const resolveOnboardingApproval = onCall(async (request) => {
  const {pin, approvalId, action, managerNote} = request.data || {};
  if (!approvalId || !action) {
    throw new HttpsError("invalid-argument", "approvalId and action are required.");
  }
  const valid = await verifyManagerAccess(request, pin);
  if (!valid) {
    throw new HttpsError("permission-denied", "Manager authorization is required.");
  }

  if (!["approve", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "action must be approve or reject.");
  }

  const resolution = await db.runTransaction(async (transaction) => {
    const approvalRef = approvalsRef().doc(approvalId);
    const approvalSnap = await transaction.get(approvalRef);
    if (!approvalSnap.exists) {
      structuredError("not-found", "APPROVAL_NOT_FOUND", "Approval not found.");
    }

    const approval = approvalSnap.data();
    if (approval.status === "approved") {
      if (action === "approve") {
        return {changed: false, status: "approved", customerId: approval.customerId || ""};
      }
      structuredError("failed-precondition", "APPROVAL_ALREADY_APPROVED", "Approval is already approved.", {
        approvalId,
        customerId: approval.customerId || "",
      });
    }
    if (approval.status === "rejected") {
      if (action === "reject") {
        return {changed: false, status: "rejected"};
      }
      structuredError("failed-precondition", "APPROVAL_ALREADY_REJECTED", "Approval is already rejected.", {
        approvalId,
      });
    }
    if (approval.status !== "pending") {
      structuredError("failed-precondition", "APPROVAL_NOT_PENDING", `Approval is ${approval.status || "unknown"}.`, {
        approvalId,
        status: approval.status || "unknown",
      });
    }

    const sessionRef = onboardingSessionsRef().doc(approval.sessionId);
    const sessionSnap = await transaction.get(sessionRef);
    const sessionData = sessionSnap.exists ? sessionSnap.data() : {};

    if (action === "approve") {
      const draft = approval.draft || sessionData.draft || {};
      const normalizedPhone = normalizePhone(draft.phone);
      if (normalizedPhone.length !== 10) {
        structuredError("failed-precondition", "INVALID_CUSTOMER_PHONE", "Customer phone must be a normalized 10-digit number.", {
          approvalId,
          phone: normalizedPhone,
        });
      }
      const existingCustomer = await findExistingCustomerByPhoneInTransaction(transaction, normalizedPhone);
      if (existingCustomer) {
        structuredError("already-exists", "CUSTOMER_PHONE_EXISTS", "Customer already exists for this phone.", {
          phone: normalizedPhone,
          customerId: existingCustomer.id,
        });
      }
      const customerRef = customersRef().doc(normalizedPhone);
      transaction.set(customerRef, {
        customerId: customerRef.id,
        authUid: generateAuthUid("customer"),
        identityLevel: "phone_lookup",
        name: draft.name,
        phone: normalizedPhone,
        address: draft.address,
        group: draft.group || "",
        plan: draft.plan,
        food: draft.food,
        rate: toNumber(draft.rate) || 0,
        active: true,
        paused: false,
        onboardingSource: approval.source || "chat",
        onboardingSessionId: approval.sessionId,
        onboardingApprovalId: approvalId,
        onboardingApprovalStatus: "approved",
        onboardingPromptVersion: approval.promptVersion || DEFAULT_PROMPT_VERSION,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(approvalRef, {
        status: "approved",
        resolvedAt: FieldValue.serverTimestamp(),
        resolvedBy: "manager",
        managerNote: managerNote || "",
        customerId: customerRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
      transaction.set(sessionRef, {
        status: "approved",
        approvalStatus: "approved",
        approvalId,
        customerId: customerRef.id,
        managerNote: managerNote || "",
        resolvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      return {
        changed: true,
        status: "approved",
        sessionId: approval.sessionId,
        customerId: customerRef.id,
      };
    }

    transaction.set(approvalRef, {
      status: "rejected",
      resolvedAt: FieldValue.serverTimestamp(),
      resolvedBy: "manager",
      managerNote: managerNote || "",
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
    transaction.set(sessionRef, {
      status: "rejected",
      approvalStatus: "rejected",
      approvalId,
      managerNote: managerNote || "",
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
    return {
      changed: true,
      status: "rejected",
      sessionId: approval.sessionId,
    };
  });

  if (resolution.changed && resolution.status === "approved") {
    await writeAudit("onboarding_approved", {
      approvalId,
      sessionId: resolution.sessionId,
      customerId: resolution.customerId,
      managerNote: managerNote || "",
    }, "manager");
  } else if (resolution.changed && resolution.status === "rejected") {
    await writeAudit("onboarding_rejected", {
      approvalId,
      sessionId: resolution.sessionId,
      managerNote: managerNote || "",
    }, "manager");
  }

  return {
    success: true,
    status: resolution.status,
    customerId: resolution.customerId || null,
  };
});

module.exports = {
  startOnboarding,
  saveOnboardingDraft,
  confirmOnboarding,
  listOnboardingQueue,
  resolveOnboardingApproval,
};
