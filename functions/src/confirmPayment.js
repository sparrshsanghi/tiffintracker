// confirmPayment.js
// Records a payment for a customer for the current (or given) month.
// Requires manager PIN. Notifies the customer after recording.

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {verifyManagerPIN} = require("./helpers/auth");
const {
  paymentsRef,
  getCustomerPhone,
  writeNotification,
} = require("./helpers/firestore");
const {formatMonth, monthLabel} = require("./helpers/format");

const confirmPayment = onCall(async (request) => {
  const {pin, customerId, amount, date} = request.data;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!pin || !customerId || amount === undefined) {
    throw new HttpsError(
        "invalid-argument",
        "pin, customerId, and amount are required.",
    );
  }
  if (typeof amount !== "number" || amount <= 0) {
    throw new HttpsError(
        "invalid-argument",
        "amount must be a positive number.",
    );
  }

  // ── PIN verification ──────────────────────────────────────────────────────
  const isValid = await verifyManagerPIN(pin);
  if (!isValid) {
    throw new HttpsError("permission-denied", "Invalid PIN.");
  }

  // ── Payment document key: {customerId}_{YYYY-MM} ──────────────────────────
  const paymentDate = date ? new Date(date) : new Date();
  const monthKey = formatMonth(paymentDate);
  const docId = `${customerId}_${monthKey}`;
  const docRef = paymentsRef().doc(docId);

  // ── Record payment (merge so first payment of month creates the doc) ───────
  const recordId = admin.firestore().collection("dummy").doc().id;
  const dateLabel = paymentDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
  await docRef.set({
    customerId,
    month: monthKey,
    totalPaid: admin.firestore.FieldValue.increment(amount),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    records: admin.firestore.FieldValue.arrayUnion({
      id: recordId,
      amount,
      date: dateLabel,
      confirmed: true,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    }),
  }, {merge: true});

  // ── Fetch updated total to return to caller ───────────────────────────────
  const snap = await docRef.get();
  const totalPaid = snap.data().totalPaid;

  // ── Notify customer ───────────────────────────────────────────────────────
  const phone = await getCustomerPhone(customerId);
  if (phone) {
    const label = monthLabel(monthKey);
    await writeNotification(
        phone,
        `Payment of ₹${amount} recorded for ${label}. ` +
        `Total paid this month: ₹${totalPaid}.`,
        "payment",
    );
  }

  return {success: true, totalPaid};
});

module.exports = {confirmPayment};
