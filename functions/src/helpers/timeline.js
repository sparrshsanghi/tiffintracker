const {FieldValue} = require("firebase-admin/firestore");
const {customersRef} = require("./firestore");

function removeUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }
  if (value && typeof value === "object" &&
      typeof value.toMillis !== "function" &&
      typeof value.isEqual !== "function") {
    return Object.keys(value).reduce((cleaned, key) => {
      if (value[key] !== undefined) {
        cleaned[key] = removeUndefined(value[key]);
      }
      return cleaned;
    }, {});
  }
  return value;
}

function safeEventId(value) {
  const cleaned = String(value || "")
      .trim()
      .replace(/[^A-Za-z0-9_-]/g, "_")
      .slice(0, 120);
  return cleaned || "";
}

async function appendTimelineEvent(customerId, event) {
  if (!customerId) {
    throw new Error("customerId is required for timeline events.");
  }
  if (!event || !event.type || !event.title || !event.description) {
    throw new Error("type, title, and description are required for timeline events.");
  }

  const eventId = safeEventId(event.eventId || event.id);
  const timelineRef = customersRef().doc(String(customerId)).collection("timeline");
  const ref = eventId ? timelineRef.doc(eventId) : timelineRef.doc();
  const payload = removeUndefined({
    type: String(event.type),
    title: String(event.title),
    description: String(event.description),
    actor: String(event.actor || "system"),
    source: String(event.source || "system"),
    createdAt: event.createdAt || FieldValue.serverTimestamp(),
    metadata: event.metadata || {},
  });

  try {
    await ref.create(payload);
    return {id: ref.id, created: true};
  } catch (error) {
    if (error.code === 6 || error.code === "already-exists" ||
        /already exists/i.test(error.message || "")) {
      return {id: ref.id, created: false};
    }
    throw error;
  }
}

module.exports = {
  appendTimelineEvent,
};
