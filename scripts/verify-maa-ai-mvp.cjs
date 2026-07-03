const crypto = require("crypto");
const admin = require("../functions/node_modules/firebase-admin");
const scheduledTasks = require("../functions/src/scheduledTasks");

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || "maa-sharda-sns";
const businessId = "default";
const baseUrl = `http://127.0.0.1:5001/${projectId}/us-central1`;
const pin = "2468";
const runSuffix = String(Date.now()).slice(-9);
const phone = `9${runSuffix}`.slice(0, 10);
const customerId = phone;
const istOffsetMs = 5.5 * 60 * 60 * 1000;

function hashPIN(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function todayInIst() {
  return new Date(Date.now() + istOffsetMs).toISOString().slice(0, 10);
}

function addDays(dateString, count) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function nextWeekday(today, targetDayIndex) {
  const date = new Date(`${today}T00:00:00.000Z`);
  const current = date.getUTCDay();
  let diff = targetDayIndex - current;
  if (diff < 0) diff += 7;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

async function callFunction(name, data) {
  const response = await fetch(`${baseUrl}/${name}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({data}),
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(`${name} failed: ${JSON.stringify(body)}`);
  }
  return body.result;
}

async function runMonthlyPaymentInit() {
  await scheduledTasks.monthlyPaymentInit.run({
    scheduleTime: new Date().toISOString(),
  });
}

async function expectFunctionError(name, data, expectedStatus) {
  const response = await fetch(`${baseUrl}/${name}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({data}),
  });
  const body = await response.json();
  assert(body.error, `${name} should have failed`);
  if (expectedStatus) {
    assert(body.error.status === expectedStatus, `${name} expected ${expectedStatus}, got ${body.error.status}`);
  }
  return body.error;
}

async function findAuditLogs(business, approvalId) {
  const snap = await business.collection("auditLogs").get();
  return snap.docs
      .map((doc) => doc.data())
      .filter((item) => item.data && item.data.approvalId === approvalId);
}

async function assertAuditEvent(business, approvalId, eventType) {
  const auditLogs = await findAuditLogs(business, approvalId);
  assert(
      auditLogs.some((item) => item.eventType === eventType),
      `${eventType} audit log should exist for ${approvalId}`,
  );
}

async function assertAuditWhere(business, eventType, predicate, message) {
  const snap = await business.collection("auditLogs")
      .where("eventType", "==", eventType)
      .get();
  const found = snap.docs.map((doc) => doc.data()).some(predicate);
  assert(found, message || `${eventType} audit log should exist`);
}

async function notificationCount(business) {
  const snap = await business
      .collection("notifications")
      .doc(phone)
      .collection("messages")
      .get();
  return snap.size;
}

async function getTimeline(business, targetCustomerId = customerId) {
  const snap = await business
      .collection("customers")
      .doc(targetCustomerId)
      .collection("timeline")
      .orderBy("createdAt", "desc")
      .get();
  return snap.docs.map((doc) => Object.assign({id: doc.id}, doc.data()));
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
}

function assertNewestFirst(events) {
  for (let i = 1; i < events.length; i++) {
    assert(
        timestampMillis(events[i - 1].createdAt) >= timestampMillis(events[i].createdAt),
        "Timeline should be newest first",
    );
  }
}

function assertAppendOnly(before, after) {
  const afterIds = new Set(after.map((event) => event.id));
  before.forEach((event) => {
    assert(afterIds.has(event.id), `Timeline event ${event.id} should not be removed`);
  });
}

async function assertTimelineTypeCount(business, type, expected) {
  const events = await getTimeline(business);
  const count = events.filter((event) => event.type === type).length;
  assert(count === expected, `${type} timeline count expected ${expected}, got ${count}`);
  assertNewestFirst(events);
  assert(new Set(events.map((event) => event.id)).size === events.length, "Timeline should not contain duplicate event IDs");
  return events;
}

async function assertTimelineAddedOnce(business, before, type, title) {
  const after = await assertTimelineTypeCount(business, type, 1);
  assertAppendOnly(before, after);
  assert(after.length === before.length + 1, `${type} should append exactly one timeline event`);
  const event = after.find((item) => item.type === type);
  assert(event && event.title === title, `${type} should use title ${title}`);
  return after;
}

function currentMonthInIst() {
  return todayInIst().slice(0, 7);
}

async function countAiApprovals(business) {
  const snap = await business.collection("approvals")
      .where("type", "==", "maa_ai_customer_action")
      .get();
  return snap.size;
}

async function createAction(customerId, text) {
  const extracted = await callFunction("extractMaaAiIntent", {
    customerId,
    text,
  });
  assert(extracted.supported === true, `${text} should be supported`);
  assert(!extracted.needsClarification, `${text} should not need clarification`);
  assert(extracted.extraction.confidence >= 0.85, `${text} should meet confidence policy`);
  const pending = await callFunction("createMaaAiPendingAction", {
    customerId,
    text,
    extraction: extracted.extraction,
  });
  assert(pending.status === "pending", `${text} should create a pending approval`);
  assert(pending.approvalId, `${text} should return approvalId`);
  await assertAuditEvent(
      admin.firestore().collection("businesses").doc(businessId),
      pending.approvalId,
      "maa_ai_pending_action_created",
  );
  return {extracted, pending};
}

async function createOnboardedCustomer(business) {
  const draft = {
    name: "Maa AI Regression",
    phone,
    address: "Regression House",
    group: "Regression",
    plan: "monthly",
    food: "Veg thali",
    rate: 2500,
    notes: "Timeline regression",
  };
  const sessionRef = business.collection("onboardingSessions").doc();
  const approvalRef = business.collection("approvals").doc();
  await sessionRef.set({
    status: "pending_manager_approval",
    approvalStatus: "pending",
    approvalId: approvalRef.id,
    draft,
    missingFields: [],
    source: "chat",
    promptVersion: "onboarding.v1",
    createdAt: new Date(),
    updatedAt: new Date(),
    confirmedAt: new Date(),
  });
  await approvalRef.set({
    type: "customer_onboarding",
    sessionId: sessionRef.id,
    status: "pending",
    draft,
    source: "chat",
    promptVersion: "onboarding.v1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const approved = await callFunction("resolveOnboardingApproval", {
    pin,
    approvalId: approvalRef.id,
    action: "approve",
    managerNote: "Approved by Sprint 2.2 timeline regression",
  });
  assert(approved.status === "approved", "Onboarding should approve");
  assert(approved.customerId === customerId, "Onboarding should create the expected customer");
  const customerSnap = await business.collection("customers").doc(customerId).get();
  assert(customerSnap.exists, "Onboarding should create customer document");
  return {
    sessionId: sessionRef.id,
    approvalId: approvalRef.id,
  };
}

async function main() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Run with firebase emulators:exec --only firestore,functions.");
  }

  if (!admin.apps.length) {
    admin.initializeApp({projectId});
  }
  const db = admin.firestore();
  const business = db.collection("businesses").doc(businessId);
  const today = todayInIst();
  const sunday = nextWeekday(today, 0);
  const resumeAfterSunday = addDays(sunday, 1);

  await business.collection("config").doc("settings").set({
    mgrPinHash: hashPIN(pin),
    businessName: "Maa Sharda",
    geminiApiKey: "",
  }, {merge: true});

  const onboarding = await createOnboardedCustomer(business);
  let timeline = await assertTimelineTypeCount(business, "onboarding_approved", 1);
  assert(timeline.length === 1, "Onboarding should create exactly one timeline event");
  assert(timeline[0].title === "Customer Joined", "Onboarding timeline title should be Customer Joined");
  const timelineAfterOnboarding = timeline;
  const approvedAgain = await callFunction("resolveOnboardingApproval", {
    pin,
    approvalId: onboarding.approvalId,
    action: "approve",
    managerNote: "Idempotent timeline retry",
  });
  assert(approvedAgain.status === "approved", "Repeated onboarding approval should be idempotent");
  timeline = await getTimeline(business);
  assert(timeline.length === timelineAfterOnboarding.length, "Repeated onboarding approval must not duplicate timeline events");

  await business.collection("orders").doc(today).set({
    [customerId]: {
      status: "pending",
      updatedAt: new Date(),
      updatedBy: "regression_seed",
    },
  }, {merge: true});

  const startingApprovalCount = await countAiApprovals(business);

  const unsupported = await callFunction("extractMaaAiIntent", {
    customerId,
    text: "Can you explain my bill?",
  });
  assert(unsupported.supported === false, "Unsupported request should be rejected");
  assert(unsupported.message === "This request is not supported yet.", "Unsupported message should be exact");
  assert(await countAiApprovals(business) === startingApprovalCount, "Unsupported request must not create approvals");
  assert((await getTimeline(business)).length === 1, "Unsupported request must not create timeline events");

  const lowConfidence = await callFunction("extractMaaAiIntent", {
    customerId,
    text: "Please change my meal.",
  });
  assert(lowConfidence.supported === true, "Low-confidence meal change should be recognized as supported");
  assert(lowConfidence.needsClarification === true, "Low-confidence request should ask one clarification");
  assert(lowConfidence.clarificationQuestion, "Low-confidence request should include a clarification question");
  await expectFunctionError("createMaaAiPendingAction", {
    customerId,
    text: "Please change my meal.",
    extraction: lowConfidence.extraction,
  }, "FAILED_PRECONDITION");
  assert(await countAiApprovals(business) === startingApprovalCount, "Low-confidence request must not create approvals");
  assert((await getTimeline(business)).length === 1, "Low-confidence request must not create timeline events");

  const extracted = await callFunction("extractMaaAiIntent", {
    customerId,
    text: "I'm going home till Sunday.",
  });
  assert(extracted.supported === true, "Pause conversation should be supported");
  assert(!extracted.needsClarification, "Pause should not need clarification");
  assert(extracted.extraction.intent === "pause_meals", "Intent should be pause_meals");
  assert(extracted.extraction.startDate === today, "Pause should start today");
  assert(extracted.extraction.endDate === sunday, "Pause should end on Sunday");
  assert(extracted.extraction.confidence >= 0.85, "Pause confidence should pass policy");

  const pending = await callFunction("createMaaAiPendingAction", {
    customerId,
    text: "I'm going home till Sunday.",
    extraction: extracted.extraction,
  });
  assert(pending.status === "pending", "Pause request should be pending");
  assert(pending.approvalId, "Pause request should return approvalId");

  const listed = await callFunction("listMaaAiPendingActions", {pin});
  assert(
      listed.items.some((item) => item.id === pending.approvalId),
      "Manager AI Inbox should list the pending pause action",
  );
  const listedPause = listed.items.find((item) => item.id === pending.approvalId);
  assert(listedPause.currentValue === "Active", "Inbox should show current value");
  assert(listedPause.requestedValue.includes(today), "Inbox should show requested value");
  assert(listedPause.effectiveDate === today, "Inbox should show effective date");

  const approved = await callFunction("resolveMaaAiPendingAction", {
    pin,
    approvalId: pending.approvalId,
    action: "approve",
    managerNote: "Approved by Maa AI MVP regression",
  });
  assert(approved.status === "approved", "Pause action should approve");
  const timelineBeforePauseRetry = await assertTimelineAddedOnce(business, timelineAfterOnboarding, "pause", "Meals Paused");
  const pauseApprovedAgain = await callFunction("resolveMaaAiPendingAction", {
    pin,
    approvalId: pending.approvalId,
    action: "approve",
    managerNote: "Idempotent pause retry",
  });
  assert(pauseApprovedAgain.status === "approved", "Repeated pause approval should be idempotent");
  timeline = await getTimeline(business);
  assert(timeline.length === timelineBeforePauseRetry.length, "Repeated pause approval must not duplicate timeline events");

  let customerSnap = await business.collection("customers").doc(customerId).get();
  let customer = customerSnap.data();
  assert(customer.active === false, "Approved pause should deactivate current service");
  assert(customer.paused === true, "Approved pause should mark customer paused");
  assert(customer.pauseFrom === today, "Approved pause should write pauseFrom");
  assert(customer.pauseTo === sunday, "Approved pause should write pauseTo");
  assert(customer.resumeDate === resumeAfterSunday, "Approved pause should write resumeDate");

  let orderSnap = await business.collection("orders").doc(today).get();
  assert(!orderSnap.data()[customerId], "Approved current pause should remove today's order");

  assert(await notificationCount(business) > 0, "Customer should receive pause approval notification");
  await assertAuditEvent(business, pending.approvalId, "maa_ai_pending_action_created");
  await assertAuditEvent(business, pending.approvalId, "maa_ai_action_approved");

  const resumeExtracted = await callFunction("extractMaaAiIntent", {
    customerId,
    text: "I am back, resume meals today.",
  });
  assert(resumeExtracted.supported === true, "Resume conversation should be supported");
  assert(!resumeExtracted.needsClarification, "Resume should not need clarification");
  assert(resumeExtracted.extraction.intent === "resume_meals", "Intent should be resume_meals");
  assert(resumeExtracted.extraction.resumeDate === today, "Resume should be today");
  assert(resumeExtracted.extraction.confidence >= 0.85, "Resume confidence should pass policy");

  const resumePending = await callFunction("createMaaAiPendingAction", {
    customerId,
    text: "I am back, resume meals today.",
    extraction: resumeExtracted.extraction,
  });
  const resumeApproved = await callFunction("resolveMaaAiPendingAction", {
    pin,
    approvalId: resumePending.approvalId,
    action: "approve",
    managerNote: "Resume approved by Maa AI MVP regression",
  });
  assert(resumeApproved.status === "approved", "Resume action should approve");
  timeline = await assertTimelineAddedOnce(business, timelineBeforePauseRetry, "resume", "Meals Resumed");

  customerSnap = await business.collection("customers").doc(customerId).get();
  customer = customerSnap.data();
  assert(customer.active === true, "Approved resume should reactivate service");
  assert(customer.paused === false, "Approved resume should clear paused state");
  assert(!customer.pauseFrom, "Approved resume should clear pauseFrom");
  assert(!customer.pauseTo, "Approved resume should clear pauseTo");
  assert(!customer.resumeDate, "Approved resume should clear resumeDate");

  orderSnap = await business.collection("orders").doc(today).get();
  assert(orderSnap.data()[customerId], "Approved current resume should create today's order");

  await assertAuditEvent(business, resumePending.approvalId, "maa_ai_action_approved");

  const meal = await createAction(customerId, "Please change my meal to Jain thali from today.");
  assert(meal.extracted.extraction.intent === "meal_change", "Intent should be meal_change");
  assert(meal.extracted.extraction.mealPreference === "Jain thali", "Meal preference should be extracted");
  assert(meal.extracted.extraction.effectiveDate === today, "Meal change effective date should be today");
  const mealApproved = await callFunction("resolveMaaAiPendingAction", {
    pin,
    approvalId: meal.pending.approvalId,
    action: "approve",
    managerNote: "Meal change approved by regression test",
  });
  assert(mealApproved.status === "approved", "Meal change should approve");
  const timelineAfterResume = timeline;
  timeline = await assertTimelineAddedOnce(business, timelineAfterResume, "meal_change", "Meal Preference Updated");
  customerSnap = await business.collection("customers").doc(customerId).get();
  customer = customerSnap.data();
  assert(customer.food === "Jain thali", "Approved meal change should update customer food");
  await assertAuditEvent(business, meal.pending.approvalId, "maa_ai_action_approved");

  const address = await createAction(customerId, "Please change my address to Flat 9, Green Tower from today.");
  assert(address.extracted.extraction.intent === "address_change", "Intent should be address_change");
  assert(address.extracted.extraction.address === "Flat 9, Green Tower", "Address should be extracted");
  const addressApproved = await callFunction("resolveMaaAiPendingAction", {
    pin,
    approvalId: address.pending.approvalId,
    action: "approve",
    managerNote: "Address change approved by regression test",
  });
  assert(addressApproved.status === "approved", "Address change should approve");
  const timelineAfterMeal = timeline;
  timeline = await assertTimelineAddedOnce(business, timelineAfterMeal, "address_change", "Delivery Address Updated");
  customerSnap = await business.collection("customers").doc(customerId).get();
  customer = customerSnap.data();
  assert(customer.address === "Flat 9, Green Tower", "Approved address change should update customer address");
  await assertAuditEvent(business, address.pending.approvalId, "maa_ai_action_approved");

  const timelineAfterAddress = timeline;
  const monthKey = currentMonthInIst();
  await runMonthlyPaymentInit();
  timeline = await assertTimelineAddedOnce(business, timelineAfterAddress, "monthly_bill_generated", "Monthly Bill Generated");
  const paymentInitSnap = await business.collection("payments").doc(`${customerId}_${monthKey}`).get();
  assert(paymentInitSnap.exists, "Monthly billing should create payment document");
  const paymentInit = paymentInitSnap.data();
  assert(paymentInit.totalPaid === 0, "Monthly billing should preserve initial totalPaid");
  assert(Array.isArray(paymentInit.records) && paymentInit.records.length === 0,
      "Monthly billing should preserve empty records array");
  assert(!Object.prototype.hasOwnProperty.call(paymentInit, "month"),
      "Monthly billing should not add a month field");
  assert(!Object.prototype.hasOwnProperty.call(paymentInit, "customerId"),
      "Monthly billing should not add a customerId field");
  const timelineAfterMonthly = timeline;
  await runMonthlyPaymentInit();
  timeline = await getTimeline(business);
  assert(timeline.length === timelineAfterMonthly.length, "Repeated monthly billing must not duplicate timeline events");
  await assertTimelineTypeCount(business, "monthly_bill_generated", 1);

  const paymentBefore = timeline;
  const notificationsBeforePayment = await notificationCount(business);
  const payment = await callFunction("confirmPayment", {
    pin,
    customerId,
    amount: 500,
    date: `${today}T00:00:00.000Z`,
  });
  assert(payment.success === true, "Payment confirmation should succeed");
  assert(await notificationCount(business) > notificationsBeforePayment, "Payment should notify customer");
  await assertAuditWhere(
      business,
      "payment_received",
      (item) => item.data &&
        item.data.customerId === customerId &&
        item.data.amount === 500 &&
        item.data.month === monthKey,
      "Payment should write audit log",
  );
  timeline = await assertTimelineAddedOnce(business, paymentBefore, "payment_received", "Payment Received");

  const rejectedMeal = await createAction(customerId, "Please change my meal to Roti rice from today.");
  const beforeRejectedMeal = customer.food;
  const notificationsBeforeReject = await notificationCount(business);
  const timelineBeforeReject = await getTimeline(business);
  const rejected = await callFunction("resolveMaaAiPendingAction", {
    pin,
    approvalId: rejectedMeal.pending.approvalId,
    action: "reject",
    managerNote: "Rejected by regression test",
  });
  assert(rejected.status === "rejected", "Rejection should resolve");
  customerSnap = await business.collection("customers").doc(customerId).get();
  customer = customerSnap.data();
  assert(customer.food === beforeRejectedMeal, "Rejected meal change must not update customer food");
  assert(await notificationCount(business) > notificationsBeforeReject, "Rejection should notify customer");
  timeline = await getTimeline(business);
  assert(timeline.length === timelineBeforeReject.length, "Rejected action must not create timeline events");
  await assertAuditEvent(business, rejectedMeal.pending.approvalId, "maa_ai_action_rejected");

  const finalTimeline = await getTimeline(business);
  assert(finalTimeline.length === 7, `Expected 7 relationship timeline events, got ${finalTimeline.length}`);
  [
    ["onboarding_approved", 1],
    ["pause", 1],
    ["resume", 1],
    ["meal_change", 1],
    ["address_change", 1],
    ["monthly_bill_generated", 1],
    ["payment_received", 1],
  ].forEach(([type, expected]) => {
    const actual = finalTimeline.filter((event) => event.type === type).length;
    assert(actual === expected, `${type} final count expected ${expected}, got ${actual}`);
  });
  assertNewestFirst(finalTimeline);

  console.log(JSON.stringify({
    ok: true,
    customerId,
    phone,
    onboardingApprovalId: onboarding.approvalId,
    pauseApprovalId: pending.approvalId,
    resumeApprovalId: resumePending.approvalId,
    mealApprovalId: meal.pending.approvalId,
    addressApprovalId: address.pending.approvalId,
    rejectedApprovalId: rejectedMeal.pending.approvalId,
    today,
    pauseTo: sunday,
    resumeDate: resumeAfterSunday,
    notificationCount: await notificationCount(business),
    timelineCount: finalTimeline.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
