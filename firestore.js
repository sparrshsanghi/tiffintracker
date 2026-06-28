// helpers/firestore.js
// Single source of truth for all Firestore collection refs and shared operations.
// Change BUSINESS_ID here if multi-tenant support is added later.

const admin = require("firebase-admin");

const BUSINESS_ID = "default";

// ─── Ref helpers ─────────────────────────────────────────────────────────────

function businessRef() {
  return admin.firestore().collection("businesses").doc(BUSINESS_ID);
}

function settingsRef() {
  return businessRef().collection("config").doc("settings");
}

function customersRef() {
  return businessRef().collection("customers");
}

function ordersRef() {
  return businessRef().collection("orders");
}

function paymentsRef() {
  return businessRef().collection("payments");
}

function menuRef() {
  return businessRef().collection("menu");
}

function notificationsRef() {
  return businessRef().collection("notifications");
}

// ─── Shared operations ────────────────────────────────────────────────────────

/**
 * Fetch a customer's phone number.
 * Returns null if customer doesn't exist or has no phone field.
 * @param {string} customerId
 * @returns {Promise<string|null>}
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
 */
async function writeNotification(phone, message, type = "general") {
  const ref = notificationsRef()
    .doc(phone)
    .collection("messages")
    .doc();

  await ref.set({
    message,
    type,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = {
  BUSINESS_ID,
  businessRef,
  settingsRef,
  customersRef,
  ordersRef,
  paymentsRef,
  menuRef,
  notificationsRef,
  getCustomerPhone,
  writeNotification,
};
