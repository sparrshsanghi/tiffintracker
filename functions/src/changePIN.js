// changePIN.js
// Changes the manager PIN.
// Always requires the current manager PIN to authorize.
// Rejects if the new PIN is the same as the current manager PIN.

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {hashPIN, getPINs, verifyManagerPIN} = require("./helpers/auth");
const {settingsRef} = require("./helpers/firestore");

const changePIN = onCall(async (request) => {
  const {currentPin, newPin, target} = request.data;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!currentPin || !newPin || !target) {
    throw new HttpsError(
        "invalid-argument",
        "currentPin, newPin, and target are required.",
    );
  }
  if (target !== "manager") {
    throw new HttpsError(
        "invalid-argument",
        "target must be 'manager'.",
    );
  }

  // ── Always verify manager PIN to authorize any change ─────────────────────
  const isValid = await verifyManagerPIN(currentPin);
  if (!isValid) {
    throw new HttpsError("permission-denied", "Invalid current PIN.");
  }

  // ── Reject if new PIN equals the current manager PIN ─────────────────────
  const {mgrPinHash} = await getPINs();
  const newHash = hashPIN(newPin);
  if (newHash === mgrPinHash) {
    throw new HttpsError(
        "invalid-argument",
        "New PIN must be different from the current manager PIN.",
    );
  }

  // ── Write new hash ────────────────────────────────────────────────────────
  await settingsRef().update({mgrPinHash: newHash});

  return {success: true};
});

module.exports = {changePIN};
