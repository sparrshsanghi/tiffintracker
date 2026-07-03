const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {FieldValue} = require("firebase-admin/firestore");
const {
  db,
  BUSINESS_ID,
  customersRef,
  approvalsRef,
  auditLogsRef,
  ordersRef,
  writeNotification,
} = require("./helpers/firestore");
const {getPINs, verifyManagerPIN} = require("./helpers/auth");
const {appendTimelineEvent} = require("./helpers/timeline");

const AI_APPROVAL_TYPE = "maa_ai_customer_action";
const GEMINI_MODEL = "gemini-1.5-flash";
const ALLOWED_INTENTS = [
  "pause_meals",
  "resume_meals",
  "meal_change",
  "address_change",
];
const CONFIDENCE_THRESHOLD = 0.85;
const UNSUPPORTED_MESSAGE = "This request is not supported yet.";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function todayInIst() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(dateString, count) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function nextWeekday(today, targetDayIndex) {
  const date = new Date(`${today}T00:00:00.000Z`);
  const current = date.getUTCDay();
  let diff = targetDayIndex - current;
  if (diff < 0) diff += 7;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function parseLooseDate(text, today) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("today")) return today;
  if (lower.includes("tomorrow")) return addDays(today, 1);

  const isoMatch = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch && isValidDateString(isoMatch[1])) return isoMatch[1];

  const dayNames = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const dayMatch = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (dayMatch) return nextWeekday(today, dayNames[dayMatch[1]]);

  return "";
}

function extractReason(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("home")) return "Going home";
  if (lower.includes("out of station")) return "Out of station";
  if (lower.includes("travel")) return "Travel";
  if (lower.includes("back")) return "Customer is back";
  if (lower.includes("shift") || lower.includes("moved")) return "Address changed";
  if (lower.includes("jain") || lower.includes("veg") || lower.includes("food")) return "Meal preference changed";
  return String(text || "").trim().slice(0, 140);
}

function countPotentialIntents(text) {
  const lower = String(text || "").toLowerCase();
  const hasPause = /\b(pause|stop|hold|skip|away|home|out of station|no tiffin|no meal)\b/.test(lower);
  const hasResume = /\b(resume|restart|start again|start meals|back)\b/.test(lower);
  const hasMealChange = /\b(change|switch|update|make|want|need|prefer)\b/.test(lower) &&
    /\b(meal|food|tiffin|thali|jain|veg|non veg|roti|rice|dal|sabzi)\b/.test(lower);
  const hasAddressChange = /\b(address|delivery address|deliver to|deliver at|shifted|moved|new place|new flat)\b/.test(lower);
  return [hasPause, hasResume, hasMealChange, hasAddressChange]
      .filter(Boolean).length;
}

function extractValue(text, patterns) {
  const source = String(text || "");
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match && match[1]) {
      return cleanText(match[1].replace(/\b(from|starting|effective)\b.*$/i, ""), 180);
    }
  }
  return "";
}

function extractEffectiveDate(text, today) {
  const source = String(text || "");
  const explicitDates = source.match(/\b20\d{2}-\d{2}-\d{2}\b/g) || [];
  if (explicitDates[0] && isValidDateString(explicitDates[0])) return explicitDates[0];
  const fromMatch = source.match(/\b(?:from|starting|effective)\s+([^,.]+)\b/i);
  if (fromMatch) {
    const parsed = parseLooseDate(fromMatch[1], today);
    if (parsed) return parsed;
  }
  return parseLooseDate(source, today);
}

function fallbackExtract(text, today) {
  const lower = String(text || "").toLowerCase();
  const hasPause = /\b(pause|stop|hold|skip|away|home|out of station|no tiffin|no meal)\b/.test(lower);
  const hasResume = /\b(resume|restart|start again|start meals|back)\b/.test(lower);
  const hasMealChange = /\b(change|switch|update|make|want|need|prefer)\b/.test(lower) &&
    /\b(meal|food|tiffin|thali|jain|veg|non veg|roti|rice|dal|sabzi)\b/.test(lower);
  const hasAddressChange = /\b(address|delivery address|deliver to|deliver at|shifted|moved|new place|new flat)\b/.test(lower);
  const matchedIntentCount = countPotentialIntents(text);

  if (matchedIntentCount > 1) {
    return {
      intent: "unsupported",
      customerMessage: cleanText(text, 500),
      confidence: 0.1,
    };
  }

  let intent = "unsupported";
  if (hasResume && !hasPause) {
    intent = "resume_meals";
  } else if (hasMealChange) {
    intent = "meal_change";
  } else if (hasAddressChange) {
    intent = "address_change";
  } else if (hasPause) {
    intent = "pause_meals";
  }

  const explicitDates = lower.match(/\b20\d{2}-\d{2}-\d{2}\b/g) || [];
  const fromMatch = lower.match(/\bfrom\s+([^,.]+?)(?:\s+(?:to|till|until|through)\s+|$)/);
  const untilMatch = lower.match(/\b(?:to|till|until|through)\s+([^,.]+)\b/);
  const daysMatch = lower.match(/\bfor\s+(\d{1,2})\s+days?\b/);

  if (intent === "pause_meals") {
    const startDate = explicitDates[0] && explicitDates.length > 1 ?
      explicitDates[0] :
      (fromMatch ? parseLooseDate(fromMatch[1], today) : today);
    let endDate = explicitDates.length > 1 ? explicitDates[1] : "";
    if (!endDate && explicitDates.length === 1) endDate = explicitDates[0];
    if (!endDate && untilMatch) endDate = parseLooseDate(untilMatch[1], today);
    if (!endDate && daysMatch) endDate = addDays(startDate || today, Number(daysMatch[1]) - 1);

    return {
      intent,
      startDate,
      endDate,
      resumeDate: endDate ? addDays(endDate, 1) : "",
      customerMessage: cleanText(text, 500),
      reason: extractReason(text),
      confidence: endDate ? 0.92 : 0.45,
    };
  }

  if (intent === "resume_meals") {
    const afterFrom = fromMatch ? parseLooseDate(fromMatch[1], today) : "";
    const resumeDate = explicitDates[0] || afterFrom || parseLooseDate(text, today) || today;
    return {
      intent,
      startDate: resumeDate,
      endDate: "",
      resumeDate,
      effectiveDate: resumeDate,
      customerMessage: cleanText(text, 500),
      reason: extractReason(text),
      confidence: 0.91,
    };
  }

  if (intent === "meal_change") {
    const mealPreference = extractValue(text, [
      /\b(?:change|switch|update)\s+(?:my\s+)?(?:meal|food|tiffin|thali)\s+(?:to|as)\s+(.+?)(?:[.?!]|$)/i,
      /\b(?:make|want|need|prefer)\s+(?:my\s+)?(?:meal|food|tiffin|thali)?\s*(?:to|as)?\s*(.+?)(?:[.?!]|$)/i,
    ]);
    const effectiveDate = extractEffectiveDate(text, today);
    return {
      intent,
      mealPreference,
      effectiveDate,
      customerMessage: cleanText(text, 500),
      reason: extractReason(text),
      confidence: mealPreference && effectiveDate ? 0.93 : 0.58,
    };
  }

  if (intent === "address_change") {
    const address = extractValue(text, [
      /\b(?:change|update)\s+(?:my\s+)?(?:address|delivery address)\s+(?:to|as)\s+(.+?)(?:[.?!]|$)/i,
      /\b(?:deliver|delivery)\s+(?:to|at)\s+(.+?)(?:[.?!]|$)/i,
      /\b(?:shifted|moved)\s+(?:to|at)\s+(.+?)(?:[.?!]|$)/i,
    ]);
    const effectiveDate = extractEffectiveDate(text, today);
    return {
      intent,
      address,
      effectiveDate,
      customerMessage: cleanText(text, 500),
      reason: extractReason(text),
      confidence: address && effectiveDate ? 0.93 : 0.58,
    };
  }

  return {
    intent: "unsupported",
    startDate: "",
    endDate: "",
    resumeDate: "",
    customerMessage: cleanText(text, 500),
    reason: "",
    confidence: 0.2,
  };
}

function buildGeminiPrompt(today) {
  return [
    "You are Maa Sharda's customer communication extractor.",
    `Today is ${today} in Asia/Kolkata.`,
    "Return JSON only.",
    "Allowed intents: pause_meals, resume_meals, meal_change, address_change, unsupported.",
    "Extract only these four intents. Anything else is unsupported.",
    "Required JSON keys: intent, confidence, customerMessage, mealPreference, address, effectiveDate, startDate, endDate, resumeDate, reason.",
    "Dates must be YYYY-MM-DD strings or empty strings.",
    "For pause_meals, set startDate and endDate; resumeDate is the day after endDate.",
    "For resume_meals, set resumeDate and startDate to the service restart date.",
    "For meal_change, set mealPreference and effectiveDate.",
    "For address_change, set address and effectiveDate.",
    "For phrases like till Sunday, startDate is today and endDate is the next Sunday.",
    "Do not parse multiple intents. Return unsupported if the message asks for more than one action.",
    "Reason should be short and based only on the customer's words.",
    "Confidence must be a number from 0 to 1.",
  ].join(" ");
}

async function callGeminiExtract(text, apiKey, today) {
  if (!apiKey) return null;

  const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {text: buildGeminiPrompt(today)},
                {text: `Customer message: ${text}`},
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload &&
    payload.candidates &&
    payload.candidates[0] &&
    payload.candidates[0].content &&
    payload.candidates[0].content.parts &&
    payload.candidates[0].content.parts[0] &&
    payload.candidates[0].content.parts[0].text;
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function normalizeIntent(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (["pause", "pause_meal", "pause_meals", "stop_meals"].includes(raw)) {
    return "pause_meals";
  }
  if (["resume", "resume_meal", "resume_meals", "restart_meals"].includes(raw)) {
    return "resume_meals";
  }
  if (["meal", "meal_change", "change_meal", "food_change", "change_food"].includes(raw)) {
    return "meal_change";
  }
  if (["address", "address_change", "change_address", "delivery_address_change"].includes(raw)) {
    return "address_change";
  }
  return "unsupported";
}

function clampConfidence(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
}

function cleanText(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function buildClarificationQuestion(intent) {
  if (intent === "pause_meals") {
    return "Please confirm the pause start and end date.";
  }
  if (intent === "resume_meals") {
    return "Please confirm the date you want meals to resume.";
  }
  if (intent === "meal_change") {
    return "Please confirm the meal preference and the date it should start.";
  }
  if (intent === "address_change") {
    return "Please confirm the new address and the date it should start.";
  }
  return UNSUPPORTED_MESSAGE;
}

function needsClarification(intent, confidence, extraction) {
  return {
    supported: true,
    needsClarification: true,
    clarificationQuestion: buildClarificationQuestion(intent),
    extraction: Object.assign({}, extraction || {}, {
      intent,
      confidence,
    }),
  };
}

function validateExtraction(raw, sourceText, today) {
  if (countPotentialIntents(sourceText) > 1) {
    return {
      supported: false,
      message: UNSUPPORTED_MESSAGE,
    };
  }
  const data = raw || {};
  const intent = normalizeIntent(data.intent);
  if (!ALLOWED_INTENTS.includes(intent)) {
    return {
      supported: false,
      message: UNSUPPORTED_MESSAGE,
    };
  }

  const confidence = clampConfidence(data.confidence);
  const reason = cleanText(data.reason || extractReason(sourceText), 160);
  const customerMessage = cleanText(data.customerMessage || sourceText, 500);

  if (intent === "pause_meals") {
    const startDate = data.startDate || data.pauseFrom || today;
    const endDate = data.endDate || data.pauseTo || "";
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      return needsClarification(intent, confidence, {
        startDate: isValidDateString(startDate) ? startDate : "",
        endDate: isValidDateString(endDate) ? endDate : "",
        reason,
        customerMessage,
      });
    }
    if (endDate < startDate) {
      return needsClarification(intent, confidence, {
        startDate,
        endDate,
        reason,
        customerMessage,
      });
    }
    if (endDate < today) {
      return needsClarification(intent, confidence, {
        startDate,
        endDate,
        reason,
        customerMessage,
      });
    }

    const resumeDate = isValidDateString(data.resumeDate) ?
      data.resumeDate :
      addDays(endDate, 1);
    const extraction = {
      intent,
      startDate,
      endDate,
      resumeDate,
      effectiveDate: startDate,
      reason,
      customerMessage,
      confidence,
    };
    if (confidence < CONFIDENCE_THRESHOLD) {
      return needsClarification(intent, confidence, extraction);
    }
    return {
      supported: true,
      extraction,
    };
  }

  if (intent === "resume_meals") {
    const resumeDate = data.resumeDate || data.startDate || data.effectiveDate || today;
    if (!isValidDateString(resumeDate)) {
      return needsClarification(intent, confidence, {
        resumeDate: "",
        reason,
        customerMessage,
      });
    }
    const extraction = {
      intent,
      startDate: resumeDate,
      endDate: "",
      resumeDate,
      effectiveDate: resumeDate,
      reason,
      customerMessage,
      confidence,
    };
    if (confidence < CONFIDENCE_THRESHOLD) {
      return needsClarification(intent, confidence, extraction);
    }
    return {
      supported: true,
      extraction,
    };
  }

  if (intent === "meal_change") {
    const mealPreference = cleanText(data.mealPreference || data.meal || data.food || data.requestedValue, 160);
    const effectiveDate = data.effectiveDate || data.startDate || "";
    const extraction = {
      intent,
      mealPreference,
      effectiveDate,
      reason,
      customerMessage,
      confidence,
    };
    if (!mealPreference || !isValidDateString(effectiveDate) || effectiveDate < today ||
        confidence < CONFIDENCE_THRESHOLD) {
      return needsClarification(intent, confidence, extraction);
    }
    return {
      supported: true,
      extraction,
    };
  }

  const address = cleanText(data.address || data.deliveryAddress || data.requestedValue, 220);
  const effectiveDate = data.effectiveDate || data.startDate || "";
  const extraction = {
    intent,
    address,
    effectiveDate,
    reason,
    customerMessage,
    confidence,
  };
  if (!address || !isValidDateString(effectiveDate) || effectiveDate < today ||
      confidence < CONFIDENCE_THRESHOLD) {
    return needsClarification(intent, confidence, extraction);
  }
  return {
    supported: true,
    extraction,
  };
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T00:00:00.000Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function buildConfirmationText(extraction) {
  if (extraction.intent === "pause_meals") {
    return `I understood: pause meals from ${formatDate(extraction.startDate)} to ${formatDate(extraction.endDate)}. Reason: ${extraction.reason || "not specified"}. Send this to the manager for approval?`;
  }
  if (extraction.intent === "resume_meals") {
    return `I understood: resume meals from ${formatDate(extraction.resumeDate)}. Reason: ${extraction.reason || "not specified"}. Send this to the manager for approval?`;
  }
  if (extraction.intent === "meal_change") {
    return `I understood: change your meal to "${extraction.mealPreference}" from ${formatDate(extraction.effectiveDate)}. Reason: ${extraction.reason || "not specified"}. Send this to the manager for approval?`;
  }
  return `I understood: change your address to "${extraction.address}" from ${formatDate(extraction.effectiveDate)}. Reason: ${extraction.reason || "not specified"}. Send this to the manager for approval?`;
}

function buildSummary(customer, extraction) {
  const customerName = customer.name || "Customer";
  if (extraction.intent === "pause_meals") {
    return `${customerName} requested meal pause from ${extraction.startDate} to ${extraction.endDate}.`;
  }
  if (extraction.intent === "resume_meals") {
    return `${customerName} requested meal resume from ${extraction.resumeDate}.`;
  }
  if (extraction.intent === "meal_change") {
    return `${customerName} requested meal change to ${extraction.mealPreference} from ${extraction.effectiveDate}.`;
  }
  return `${customerName} requested address change to ${extraction.address} from ${extraction.effectiveDate}.`;
}

function intentLabel(intent) {
  if (intent === "pause_meals") return "Pause Meals";
  if (intent === "resume_meals") return "Resume Meals";
  if (intent === "meal_change") return "Meal Change";
  if (intent === "address_change") return "Address Change";
  return "Unsupported";
}

function currentValueFor(customer, extraction) {
  if (extraction.intent === "pause_meals" || extraction.intent === "resume_meals") {
    if (customer.active === false || customer.paused === true) return "Paused";
    return "Active";
  }
  if (extraction.intent === "meal_change") return customer.food || "";
  if (extraction.intent === "address_change") return customer.address || "";
  return "";
}

function requestedValueFor(extraction) {
  if (extraction.intent === "pause_meals") {
    return `Pause from ${extraction.startDate} to ${extraction.endDate}`;
  }
  if (extraction.intent === "resume_meals") {
    return `Resume from ${extraction.resumeDate}`;
  }
  if (extraction.intent === "meal_change") return extraction.mealPreference || "";
  if (extraction.intent === "address_change") return extraction.address || "";
  return "";
}

function effectiveDateFor(extraction) {
  return extraction.effectiveDate ||
    extraction.startDate ||
    extraction.resumeDate ||
    "";
}

function hasManagerClaim(request) {
  const token = request.auth && request.auth.token ? request.auth.token : {};
  return token.manager === true ||
    (token.role === "manager" && token.businessId === BUSINESS_ID);
}

async function verifyManagerAccess(request, pin) {
  if (hasManagerClaim(request)) return true;
  if (!pin) return false;
  return verifyManagerPIN(pin);
}

function isLocalEmulator() {
  return process.env.FUNCTIONS_EMULATOR === "true" &&
    Boolean(process.env.FIRESTORE_EMULATOR_HOST);
}

function customerIdFromRequest(request) {
  const data = request.data || {};
  const token = request.auth && request.auth.token ? request.auth.token : {};
  if (token.role === "customer" &&
      token.businessId === BUSINESS_ID &&
      token.customerId) {
    return String(token.customerId);
  }
  if (isLocalEmulator() && data.customerId) {
    return String(data.customerId);
  }
  throw new HttpsError("permission-denied", "Customer authorization is required.");
}

async function getCustomerOrThrow(customerId) {
  const snap = await customersRef().doc(customerId).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Customer not found.");
  }
  return {id: snap.id, data: snap.data()};
}

async function writeAudit(eventType, data, actor) {
  await auditLogsRef().add({
    eventType,
    actor: actor || "system",
    data,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function extractStructuredAction(text) {
  const today = todayInIst();
  let raw = null;
  let source = "fallback";
  try {
    const pins = await getPINs();
    const apiKey = process.env.GEMINI_API_KEY || pins.geminiApiKey || "";
    raw = await callGeminiExtract(text, apiKey, today);
    if (raw) source = "gemini";
  } catch (error) {
    raw = null;
  }
  if (!raw) raw = fallbackExtract(text, today);
  const validated = validateExtraction(raw, text, today);
  return Object.assign({}, validated, {
    raw,
    source,
    today,
  });
}

const extractMaaAiIntent = onCall(async (request) => {
  const {text} = request.data || {};
  if (!text || typeof text !== "string") {
    throw new HttpsError("invalid-argument", "text is required.");
  }

  const customerId = customerIdFromRequest(request);
  await getCustomerOrThrow(customerId);

  const result = await extractStructuredAction(text);
  if (!result.supported) {
    return {
      supported: false,
      message: result.message,
      source: result.source,
    };
  }
  if (result.needsClarification) {
    return {
      supported: true,
      needsClarification: true,
      clarificationQuestion: result.clarificationQuestion,
      extraction: result.extraction,
      source: result.source,
    };
  }

  return {
    supported: true,
    extraction: result.extraction,
    confirmationText: buildConfirmationText(result.extraction),
    source: result.source,
  };
});

const createMaaAiPendingAction = onCall(async (request) => {
  const {text, extraction} = request.data || {};
  if (!text || typeof text !== "string") {
    throw new HttpsError("invalid-argument", "text is required.");
  }

  const customerId = customerIdFromRequest(request);
  const customer = await getCustomerOrThrow(customerId);
  const today = todayInIst();
  const validated = validateExtraction(extraction, text, today);
  if (!validated.supported) {
    throw new HttpsError("invalid-argument", validated.message);
  }
  if (validated.needsClarification ||
      clampConfidence(validated.extraction.confidence) < CONFIDENCE_THRESHOLD) {
    throw new HttpsError(
        "failed-precondition",
        "Clarification is required before creating an approval.",
    );
  }

  const action = validated.extraction;
  const existingSnap = await approvalsRef()
      .where("type", "==", AI_APPROVAL_TYPE)
      .where("status", "==", "pending")
      .get();
  const existing = existingSnap.docs
      .map((doc) => Object.assign({id: doc.id}, doc.data()))
      .find((item) => item.customerId === customerId &&
        item.intent === action.intent);

  if (existing) {
    return {
      approvalId: existing.id,
      status: "pending",
      customerMessage: "This request is already waiting for manager approval.",
    };
  }

  const approvalRef = approvalsRef().doc();
  const summary = buildSummary(customer.data, action);
  const currentValue = currentValueFor(customer.data, action);
  const requestedValue = requestedValueFor(action);
  const effectiveDate = effectiveDateFor(action);
  await approvalRef.set({
    type: AI_APPROVAL_TYPE,
    proposedActionType: action.intent,
    intent: action.intent,
    intentLabel: intentLabel(action.intent),
    status: "pending",
    requestedByType: "customer",
    requestedById: customerId,
    customerId,
    customerName: customer.data.name || "",
    customerPhone: customer.data.phone || "",
    source: "customer_chat",
    sourceMessage: action.customerMessage || cleanText(text, 500),
    summary,
    reason: action.reason || "",
    confidence: action.confidence,
    currentValue,
    requestedValue,
    effectiveDate,
    mealPreference: action.mealPreference || "",
    address: action.address || "",
    startDate: action.startDate || "",
    endDate: action.endDate || "",
    resumeDate: action.resumeDate || "",
    extraction: action,
    riskLevel: "medium",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAudit("maa_ai_pending_action_created", {
    approvalId: approvalRef.id,
    customerId,
    intent: action.intent,
    startDate: action.startDate || "",
    endDate: action.endDate || "",
    resumeDate: action.resumeDate || "",
    effectiveDate,
    currentValue,
    requestedValue,
  }, "maa_ai");

  return {
    approvalId: approvalRef.id,
    status: "pending",
    customerMessage: "Sent to the manager for approval. I will notify you after a decision.",
  };
});

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return 0;
}

const listMaaAiPendingActions = onCall(async (request) => {
  const {pin} = request.data || {};
  const valid = await verifyManagerAccess(request, pin);
  if (!valid) {
    throw new HttpsError("permission-denied", "Manager authorization is required.");
  }

  const approvals = await approvalsRef()
      .where("type", "==", AI_APPROVAL_TYPE)
      .where("status", "==", "pending")
      .get();

  const items = approvals.docs
      .map((doc) => Object.assign({id: doc.id}, doc.data()))
      .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
  return {items};
});

function isDateInRange(today, startDate, endDate) {
  if (!startDate || !endDate) return false;
  return startDate <= today && today <= endDate;
}

function buildDecisionMessage(approval, action) {
  if (approval.intent === "pause_meals") {
    if (action === "approve") {
      return `Your meal pause was approved from ${formatDate(approval.startDate)} to ${formatDate(approval.endDate)}. Meals resume on ${formatDate(approval.resumeDate)}.`;
    }
    return `Your meal pause request from ${formatDate(approval.startDate)} to ${formatDate(approval.endDate)} was not approved. Please contact the manager.`;
  }

  if (action === "approve") {
    if (approval.intent === "resume_meals") {
      return `Your meals will resume from ${formatDate(approval.resumeDate)}.`;
    }
    if (approval.intent === "meal_change") {
      return `Your meal change to "${approval.requestedValue || approval.mealPreference}" was approved from ${formatDate(approval.effectiveDate)}.`;
    }
    return `Your address change was approved from ${formatDate(approval.effectiveDate)}.`;
  }
  if (approval.intent === "resume_meals") {
    return `Your meal resume request for ${formatDate(approval.resumeDate)} was not approved. Please contact the manager.`;
  }
  if (approval.intent === "meal_change") {
    return `Your meal change request was not approved. Please contact the manager.`;
  }
  return `Your address change request was not approved. Please contact the manager.`;
}

function buildTimelineEvent(approval, beforeSummary, approvalId) {
  if (approval.intent === "pause_meals") {
    return {
      eventId: `maa_ai_${approvalId}`,
      type: "pause",
      title: "Meals Paused",
      description: `Meals paused from ${formatDate(approval.startDate)} to ${formatDate(approval.endDate)}.`,
      actor: "manager",
      source: "maa_ai",
      metadata: {
        approvalId,
        from: approval.startDate || "",
        to: approval.endDate || "",
        resumeDate: approval.resumeDate || "",
      },
    };
  }

  if (approval.intent === "resume_meals") {
    return {
      eventId: `maa_ai_${approvalId}`,
      type: "resume",
      title: "Meals Resumed",
      description: `Meals resumed from ${formatDate(approval.resumeDate)}.`,
      actor: "manager",
      source: "maa_ai",
      metadata: {
        approvalId,
        resumeDate: approval.resumeDate || "",
      },
    };
  }

  if (approval.intent === "meal_change") {
    const requested = approval.requestedValue || approval.mealPreference || "";
    return {
      eventId: `maa_ai_${approvalId}`,
      type: "meal_change",
      title: "Meal Preference Updated",
      description: `Meal preference updated from "${beforeSummary.food || "not set"}" to "${requested}".`,
      actor: "manager",
      source: "maa_ai",
      metadata: {
        approvalId,
        from: beforeSummary.food || "",
        to: requested,
        effectiveDate: approval.effectiveDate || "",
      },
    };
  }

  const requested = approval.requestedValue || approval.address || "";
  return {
    eventId: `maa_ai_${approvalId}`,
    type: "address_change",
    title: "Delivery Address Updated",
    description: `Delivery address updated from "${beforeSummary.address || "not set"}" to "${requested}".`,
    actor: "manager",
    source: "maa_ai",
    metadata: {
      approvalId,
      from: beforeSummary.address || "",
      to: requested,
      effectiveDate: approval.effectiveDate || "",
    },
  };
}

async function notifyCustomer(customerId, message) {
  const snap = await customersRef().doc(customerId).get();
  if (!snap.exists) return;
  const phone = snap.data().phone;
  if (phone) {
    await writeNotification(phone, message, "general");
  }
}

const resolveMaaAiPendingAction = onCall(async (request) => {
  const {pin, approvalId, action, managerNote} = request.data || {};
  if (!approvalId || !action) {
    throw new HttpsError("invalid-argument", "approvalId and action are required.");
  }
  if (!["approve", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "action must be approve or reject.");
  }

  const valid = await verifyManagerAccess(request, pin);
  if (!valid) {
    throw new HttpsError("permission-denied", "Manager authorization is required.");
  }

  const today = todayInIst();
  const resolution = await db.runTransaction(async (transaction) => {
    const approvalRef = approvalsRef().doc(approvalId);
    const approvalSnap = await transaction.get(approvalRef);
    if (!approvalSnap.exists) {
      throw new HttpsError("not-found", "Approval not found.");
    }

    const approval = approvalSnap.data();
    if (approval.type !== AI_APPROVAL_TYPE) {
      throw new HttpsError("failed-precondition", "Approval is not a Maa AI action.");
    }
    if (approval.status === "approved" && action === "approve") {
      return {changed: false, status: "approved", approval};
    }
    if (approval.status === "rejected" && action === "reject") {
      return {changed: false, status: "rejected", approval};
    }
    if (approval.status !== "pending") {
      throw new HttpsError("failed-precondition", `Approval is ${approval.status || "unknown"}.`);
    }

    const customerRef = customersRef().doc(approval.customerId);
    const customerSnap = await transaction.get(customerRef);
    if (!customerSnap.exists) {
      throw new HttpsError("not-found", "Customer not found.");
    }

    const before = customerSnap.data() || {};
    const approvalPatch = {
      status: action === "approve" ? "approved" : "rejected",
      resolvedAt: FieldValue.serverTimestamp(),
      resolvedBy: "manager",
      managerNote: managerNote || "",
      applicationStatus: action === "approve" ? "applied" : "not_applied",
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (action === "approve") {
      if (approval.intent === "pause_meals") {
        const activeNow = isDateInRange(today, approval.startDate, approval.endDate);
        transaction.set(customerRef, {
          active: activeNow ? false : before.active !== false,
          paused: true,
          pauseFrom: approval.startDate,
          pauseTo: approval.endDate,
          resumeDate: approval.resumeDate || addDays(approval.endDate, 1),
          lastAiApprovalId: approvalId,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        if (activeNow) {
          transaction.set(ordersRef().doc(today), {
            [approval.customerId]: FieldValue.delete(),
          }, {merge: true});
        }
      } else if (approval.intent === "resume_meals") {
        transaction.set(customerRef, {
          active: true,
          paused: false,
          pauseFrom: FieldValue.delete(),
          pauseTo: FieldValue.delete(),
          resumeDate: FieldValue.delete(),
          lastAiApprovalId: approvalId,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        if (approval.resumeDate <= today) {
          transaction.set(ordersRef().doc(today), {
            [approval.customerId]: {
              status: "pending",
              updatedAt: FieldValue.serverTimestamp(),
              updatedBy: "maa_ai_manager_approval",
            },
          }, {merge: true});
        }
      } else if (approval.intent === "meal_change") {
        const nextMeal = cleanText(approval.requestedValue || approval.mealPreference, 160);
        if (!nextMeal) {
          throw new HttpsError("failed-precondition", "Requested meal is missing.");
        }
        transaction.set(customerRef, {
          food: nextMeal,
          lastAiApprovalId: approvalId,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } else if (approval.intent === "address_change") {
        const nextAddress = cleanText(approval.requestedValue || approval.address, 220);
        if (!nextAddress) {
          throw new HttpsError("failed-precondition", "Requested address is missing.");
        }
        transaction.set(customerRef, {
          address: nextAddress,
          lastAiApprovalId: approvalId,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      }
    }

    transaction.set(approvalRef, approvalPatch, {merge: true});

    return {
      changed: true,
      status: approvalPatch.status,
      approval: Object.assign({}, approval, approvalPatch),
      beforeSummary: {
        active: before.active,
        paused: before.paused || false,
        pauseFrom: before.pauseFrom || "",
        pauseTo: before.pauseTo || "",
        resumeDate: before.resumeDate || "",
        food: before.food || "",
        address: before.address || "",
      },
    };
  });

  if (resolution.changed) {
    if (action === "approve") {
      await appendTimelineEvent(
          resolution.approval.customerId,
          buildTimelineEvent(resolution.approval, resolution.beforeSummary, approvalId),
      );
    }
    const message = buildDecisionMessage(resolution.approval, action);
    await notifyCustomer(resolution.approval.customerId, message);
    await writeAudit(
        action === "approve" ? "maa_ai_action_approved" : "maa_ai_action_rejected",
        {
          approvalId,
          customerId: resolution.approval.customerId,
          intent: resolution.approval.intent,
          managerNote: managerNote || "",
          beforeSummary: resolution.beforeSummary,
          outcome: resolution.status,
        },
        "manager",
    );
  }

  return {
    success: true,
    status: resolution.status,
  };
});

module.exports = {
  extractMaaAiIntent,
  createMaaAiPendingAction,
  listMaaAiPendingActions,
  resolveMaaAiPendingAction,
};
