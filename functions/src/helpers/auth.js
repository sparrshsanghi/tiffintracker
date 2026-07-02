// helpers/auth.js
// All PIN-related logic lives here.
// Hashing is server-side: raw PIN arrives in request, is hashed here,
// then compared to the stored hash. Raw PIN never persisted anywhere.

const crypto = require("crypto");
const {settingsRef} = require("./firestore");

/**
 * SHA-256 hash a plain PIN string.
 * @param {string} pin
 * @return {string} hex digest
 */
function hashPIN(pin) {
  return crypto.createHash("sha256").update(String(pin)).digest("hex");
}

/**
 * Fetch stored PIN hashes from Firestore config.
 * Throws if the settings document is missing (misconfigured project).
 * @return {Promise<{mgrPinHash: string}>}
 */
async function getPINs() {
  const snap = await settingsRef().get();
  if (!snap.exists) {
    throw new Error("Settings document not found. Run initial setup.");
  }
  const {mgrPinHash, onboardingPromptVersion, geminiApiKey} = snap.data();
  return {mgrPinHash, onboardingPromptVersion, geminiApiKey};
}

/**
 * Verify a PIN against the stored manager hash.
 * @param {string} pin plain PIN from request
 * @return {Promise<boolean>}
 */
async function verifyManagerPIN(pin) {
  const {mgrPinHash} = await getPINs();
  return hashPIN(pin) === mgrPinHash;
}

module.exports = {hashPIN, getPINs, verifyManagerPIN};
