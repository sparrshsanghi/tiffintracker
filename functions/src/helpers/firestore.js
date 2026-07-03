// Single source of truth for Firestore collection refs and shared operations.
// Change BUSINESS_ID here if multi-tenant support is added later.

const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const BUSINESS_ID = "default";

// ─── Ref helpers ───────────────────────────────────────────────────────────

/**
 * Get business document reference.
 * @return {admin.firestore.DocumentReference}
 */
function businessRef() {
  return db.collection("businesses").doc(BUSINESS_ID);
}

/**
 * Get settings document reference.
 * @return {admin.firestore.DocumentReference}
 */
function settingsRef() {
  return businessRef().collection("config").doc("settings");
}

/**
 * Get customers collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function customersRef() {
  return businessRef().collection("customers");
}

/**
 * Get orders collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function ordersRef() {
  return businessRef().collection("orders");
}

/**
 * Get payments collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function paymentsRef() {
  return businessRef().collection("payments");
}

/**
 * Get menu collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function menuRef() {
  return businessRef().collection("menu");
}

/**
 * Get notifications collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function notificationsRef() {
  return businessRef().collection("notifications");
}

/**
 * Get onboarding sessions collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function onboardingSessionsRef() {
  return businessRef().collection("onboardingSessions");
}

/**
 * Get approvals collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function approvalsRef() {
  return businessRef().collection("approvals");
}

/**
 * Get audit logs collection reference.
 * @return {admin.firestore.CollectionReference}
 */
function auditLogsRef() {
  return businessRef().collection("auditLogs");
}

// ─── Shared operations ───────────────────────────────────────────────────────

/**
 * Fetch a customer's phone number.
 * Returns null if customer doesn't exist or has no phone field.
 * @param {string} customerId
 * @return {Promise<string|null>}
 */
async function getCustomerPhone(customerId) {
  const snap = await customersRef().doc(customerId).get();
  if (!snap.exists) return null;
  return snap.data().phone || null;
}

/**
 * Write a notification into a customer's notification feed.
 * Notifications are keyed by phone so the customer portal can
 * query by their own phone number.
 *
 * When WhatsApp/SMS is added later, extend this function only —
 * all callers stay unchanged.
 *
 * @param {string} phone
 * @param {string} message
 * @param {"payment"|"delivery"|"general"} type
 * @return {Promise<void>}
 */
async function writeNotification(phone, message, type = "general") {
  const ref = notificationsRef().doc(phone).collection("messages").doc();

  await ref.set({
    message,
    type,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

module.exports = {
  db,
  BUSINESS_ID,
  businessRef,
  settingsRef,
  customersRef,
  ordersRef,
  paymentsRef,
  menuRef,
  notificationsRef,
  onboardingSessionsRef,
  approvalsRef,
  auditLogsRef,
  getCustomerPhone,
  writeNotification,
};
