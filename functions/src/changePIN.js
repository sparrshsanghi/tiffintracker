// changePIN.js
// Changes either the manager or delivery PIN.
// Always requires the current manager PIN to authorize.
// Rejects if the new PIN is the same as the current PIN for that target.

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
  if (!["manager", "delivery"].includes(target)) {
    throw new HttpsError(
        "invalid-argument",
        "target must be 'manager' or 'delivery'.",
    );
  }

  // ── Always verify manager PIN to authorize any change ─────────────────────
  const isValid = await verifyManagerPIN(currentPin);
  if (!isValid) {
    throw new HttpsError("permission-denied", "Invalid current PIN.");
  }

  // ── Reject if new PIN equals the current PIN for that target ──────────────
  const {mgrPinHash, delivPinHash} = await getPINs();
  const newHash = hashPIN(newPin);
  const currentTargetHash = target === "manager" ? mgrPinHash : delivPinHash;

  if (newHash === currentTargetHash) {
    throw new HttpsError(
        "invalid-argument",
        `New PIN must be different from the current ${target} PIN.`,
    );
  }

  // ── Write new hash ────────────────────────────────────────────────────────
  const field = target === "manager" ? "mgrPinHash" : "delivPinHash";
  await settingsRef().update({[field]: newHash});

  return {success: true};
});

module.exports = {changePIN};
