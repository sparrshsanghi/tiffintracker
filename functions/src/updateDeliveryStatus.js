// updateDeliveryStatus.js
// Advances a customer's order status: pending → out → delivered.
// Accepts either manager or delivery PIN.
// Uses the one-doc-per-day schema: orders/{YYYY-MM-DD}
// with each customer stored as a map field inside the document.

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {verifyEitherPIN} = require("./helpers/auth");
const {
  ordersRef,
  getCustomerPhone,
  writeNotification,
} = require("./helpers/firestore");
const {formatDateKey} = require("./helpers/format");

// Valid one-way transitions only
const STATUS_TRANSITIONS = {
  pending: "out",
  out: "delivered",
};

const NOTIFICATION_MESSAGES = {
  out: "Your tiffin is on the way! 🛵",
  delivered: "Your tiffin has been delivered. Enjoy your meal! 🍱",
};

const updateDeliveryStatus = onCall(async (request) => {
  const {pin, customerId, date} = request.data;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!pin || !customerId) {
    throw new HttpsError(
        "invalid-argument",
        "pin and customerId are required.",
    );
  }

  // ── PIN verification (manager or delivery) ────────────────────────────────
  const role = await verifyEitherPIN(pin);
  if (!role) {
    throw new HttpsError("permission-denied", "Invalid PIN.");
  }

  // ── Resolve date key ──────────────────────────────────────────────────────
  const dateKey = date ? formatDateKey(new Date(date)) : formatDateKey();
  const docRef = ordersRef().doc(dateKey);

  // ── Read today's order document ───────────────────────────────────────────
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", `No orders found for date: ${dateKey}.`);
  }

  const customerOrder = snap.data()[customerId];
  if (!customerOrder) {
    throw new HttpsError(
        "not-found",
        `No order found for customer: ${customerId}.`,
    );
  }

  // ── Validate transition ───────────────────────────────────────────────────
  const currentStatus = customerOrder.status;
  const nextStatus = STATUS_TRANSITIONS[currentStatus];

  if (!nextStatus) {
    throw new HttpsError(
        "failed-precondition",
        `Order is already delivered for customer: ${customerId}.`,
    );
  }

  // ── Update order in the single day document ───────────────────────────────
  await docRef.update({
    [`${customerId}.status`]: nextStatus,
    [`${customerId}.updatedBy`]: role,
    [`${customerId}.updatedAt`]: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── Notify customer ───────────────────────────────────────────────────────
  const phone = await getCustomerPhone(customerId);
  if (phone) {
    await writeNotification(
        phone,
        NOTIFICATION_MESSAGES[nextStatus],
        "delivery",
    );
  }

  return {success: true, updatedBy: role};
});

module.exports = {updateDeliveryStatus};
