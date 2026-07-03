const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {
  BUSINESS_ID,
  customersRef,
} = require("./helpers/firestore");

function serializeDate(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value.seconds) {
    return new Date(value.seconds * 1000).toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function canReadTimeline(request, customerId) {
  const token = request.auth?.token || {};
  if (token.businessId !== BUSINESS_ID) return false;
  if (token.manager === true || token.role === "manager") return true;
  return token.role === "customer" && token.customerId === customerId;
}

const listCustomerTimeline = onCall(async (request) => {
  const token = request.auth?.token || {};
  const customerId = String(request.data?.customerId || token.customerId || "").trim();
  if (!customerId) {
    throw new HttpsError("invalid-argument", "customerId is required.");
  }
  if (!canReadTimeline(request, customerId)) {
    throw new HttpsError("permission-denied", "Timeline access denied.");
  }

  const snap = await customersRef()
      .doc(customerId)
      .collection("timeline")
      .orderBy("createdAt", "desc")
      .get();

  return {
    items: snap.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        type: data.type || "",
        title: data.title || "",
        description: data.description || "",
        actor: data.actor || "",
        source: data.source || "",
        createdAt: serializeDate(data.createdAt),
        metadata: data.metadata || {},
      };
    }),
  };
});

module.exports = {
  listCustomerTimeline,
};
