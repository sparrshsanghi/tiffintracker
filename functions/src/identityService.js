const crypto = require("crypto");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");
const {db, BUSINESS_ID, settingsRef, customersRef} = require("./helpers/firestore");
const {verifyManagerPIN} = require("./helpers/auth");

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function generateAuthUid(prefix) {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

function base64url(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function createEmulatorCustomToken(uid, claims) {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64url({alg: "none", typ: "JWT"}),
    base64url({
      iss: "firebase-auth-emulator@example.com",
      sub: "firebase-auth-emulator@example.com",
      aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: now,
      exp: now + 3600,
      uid,
      claims,
    }),
    "",
  ].join(".");
}

function isLocalEmulatorHost(value) {
  const host = String(value || "").replace(/^https?:\/\//, "").split(":")[0];
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]" || host === "::1";
}

function canUseUnsignedEmulatorToken() {
  return Boolean(process.env.FIREBASE_EMULATOR_HUB) &&
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) &&
    isLocalEmulatorHost(process.env.FIREBASE_EMULATOR_HUB) &&
    isLocalEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
}

function structuredError(status, code, message, details) {
  throw new HttpsError(status, message, Object.assign({code}, details || {}));
}

async function getManagerUid() {
  return db.runTransaction(async (transaction) => {
    const ref = settingsRef();
    const snap = await transaction.get(ref);
    if (!snap.exists) {
      structuredError("failed-precondition", "SETTINGS_NOT_FOUND", "Business settings are not configured.");
    }

    const data = snap.data() || {};
    if (data.managerAuthUid) {
      return data.managerAuthUid;
    }

    const uid = generateAuthUid("manager");
    transaction.set(ref, {
      managerAuthUid: uid,
      managerAuthUidCreatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
    return uid;
  });
}

async function findCustomerByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length !== 10) {
    structuredError("invalid-argument", "INVALID_PHONE", "A normalized 10-digit phone number is required.", {
      phone: normalizedPhone,
    });
  }

  const matches = new Map();
  const directSnap = await customersRef().doc(normalizedPhone).get();
  if (directSnap.exists) {
    matches.set(directSnap.id, {id: directSnap.id, data: directSnap.data()});
  }

  const querySnap = await customersRef()
      .where("phone", "==", normalizedPhone)
      .get();
  querySnap.docs.forEach((doc) => {
    matches.set(doc.id, {id: doc.id, data: doc.data()});
  });

  if (matches.size > 1) {
    structuredError("failed-precondition", "DUPLICATE_CUSTOMER_PHONE", "Multiple customers exist for this phone number.", {
      phone: normalizedPhone,
      customerIds: Array.from(matches.keys()),
    });
  }

  return matches.size === 1 ? Array.from(matches.values())[0] : null;
}

async function getCustomerIdentity(customer) {
  return db.runTransaction(async (transaction) => {
    const ref = customersRef().doc(customer.id);
    const snap = await transaction.get(ref);
    if (!snap.exists) {
      structuredError("not-found", "CUSTOMER_NOT_FOUND", "Customer no longer exists.", {
        customerId: customer.id,
      });
    }

    const data = snap.data() || {};
    if (data.authUid) {
      return {uid: data.authUid, customerId: snap.id, data};
    }

    const uid = generateAuthUid("customer");
    transaction.set(ref, {
      authUid: uid,
      identityLevel: data.identityLevel || "phone_lookup",
      identityCreatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
    return {uid, customerId: snap.id, data};
  });
}

async function buildCustomToken(uid, claims) {
  const token = canUseUnsignedEmulatorToken() ?
    createEmulatorCustomToken(uid, claims) :
    await admin.auth().createCustomToken(uid, claims);
  return {
    token,
    uid,
    businessId: claims.businessId,
    role: claims.role,
    identityLevel: claims.identityLevel,
    customerId: claims.customerId || null,
    phone: claims.phone || null,
  };
}

const createManagerToken = onCall(async (request) => {
  const {pin} = request.data || {};
  if (!pin) {
    structuredError("invalid-argument", "PIN_REQUIRED", "Manager PIN is required.");
  }

  const valid = await verifyManagerPIN(pin);
  if (!valid) {
    structuredError("permission-denied", "INVALID_MANAGER_PIN", "Invalid manager PIN.");
  }

  const uid = await getManagerUid();
  return buildCustomToken(uid, {
    role: "manager",
    manager: true,
    businessId: BUSINESS_ID,
    identityLevel: "manager_pin",
  });
});

const createCustomerToken = onCall(async (request) => {
  const phone = normalizePhone((request.data || {}).phone);
  if (phone.length !== 10) {
    structuredError("invalid-argument", "INVALID_PHONE", "A normalized 10-digit phone number is required.", {
      phone,
    });
  }

  const customer = await findCustomerByPhone(phone);
  if (!customer) {
    return buildCustomToken(generateAuthUid("prospect"), {
      role: "prospect",
      businessId: BUSINESS_ID,
      phone,
      identityLevel: "phone_lookup",
    });
  }

  const identity = await getCustomerIdentity(customer);
  const customerPhone = normalizePhone(identity.data.phone || phone);
  return buildCustomToken(identity.uid, {
    role: "customer",
    businessId: BUSINESS_ID,
    customerId: identity.customerId,
    phone: customerPhone,
    identityLevel: identity.data.identityLevel || "phone_lookup",
  });
});

module.exports = {
  createManagerToken,
  createCustomerToken,
  normalizePhone,
  generateAuthUid,
  canUseUnsignedEmulatorToken,
};
