export function getInitialState() {
  return {
    activeTask: null, // null | "pause_meals" | "resume_meals" | "meal_change" | "address_change" | "payment_enquiry" | "subscription_enquiry" | "feedback_complaint" | "change_phone" | "general"
    entities: {}, // e.g. { startDate, endDate, reason, mealPreference, address, effectiveDate, rating, comment, phoneNumber }
    history: [], // [{ role: "user" | "assistant", text: string, time: number }]
    pendingConfirmation: false,
    extractedDraft: null, // full validated extraction object once completed
  };
}

export function addMessageToHistory(state, role, text) {
  return {
    ...state,
    history: [...state.history, { role, text, time: Date.now() }],
  };
}
