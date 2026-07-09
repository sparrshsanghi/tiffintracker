export function generateSummaryPrompt(task, entities) {
  if (task === "preference_update") {
    const qtyStr = entities.quantity ? `${entities.quantity} ` : "";
    return `Got it.
Change preference: ${qtyStr}${entities.preference} ${entities.meal}.
Effective Date: ${entities.effectiveDate}.

Should I send this request to the manager?`;
  }

  if (task === "pause_meals") {
    return `Got it.
Pause meals from ${entities.startDate} to ${entities.endDate}.
Reason: ${entities.reason || "Vacation"}.

Should I send this request to the manager?`;
  }

  if (task === "resume_meals") {
    return `Got it.
Resume meals starting from ${entities.resumeDate || entities.startDate}.
Reason: ${entities.reason || "Customer is back"}.

Should I send this request to the manager?`;
  }

  if (task === "meal_change") {
    return `Got it.
Change meal preference to: "${entities.mealPreference}"
Effective Date: ${entities.effectiveDate}.

Should I send this request to the manager?`;
  }

  if (task === "address_change") {
    return `Got it.
Change delivery address to: "${entities.address}"
Effective Date: ${entities.effectiveDate}.

Should I send this request to the manager?`;
  }

  if (task === "change_phone") {
    return `Got it.
Request to change phone number to: ${entities.phoneNumber}.

Should I submit this change to the manager?`;
  }

  if (task === "feedback_complaint") {
    const ratingStr = entities.rating ? `${entities.rating} Stars` : "No rating";
    return `Got it.
Rating: ${ratingStr}
Comment: "${entities.comment}"

Should I submit this feedback to the manager?`;
  }

  return "Is everything correct?";
}

export function buildDraftObject(task, entities) {
  if (task === "preference_update") {
    const qtyStr = entities.quantity ? `${entities.quantity} ` : "";
    const prefText = `${qtyStr}${entities.preference} ${entities.meal}`.trim();
    return {
      intent: "meal_change",
      confidence: 0.95,
      mealPreference: prefText.charAt(0).toUpperCase() + prefText.slice(1),
      effectiveDate: entities.effectiveDate,
      reason: entities.notes || "Preference update",
    };
  }

  if (task === "pause_meals") {
    return {
      intent: "pause_meals",
      confidence: 0.95,
      startDate: entities.startDate,
      endDate: entities.endDate,
      resumeDate: entities.resumeDate || "",
      reason: entities.reason || "Vacation",
    };
  }

  if (task === "resume_meals") {
    return {
      intent: "resume_meals",
      confidence: 0.95,
      resumeDate: entities.resumeDate,
      startDate: entities.resumeDate,
      effectiveDate: entities.resumeDate,
      reason: entities.reason || "Customer is back",
    };
  }

  if (task === "meal_change") {
    return {
      intent: "meal_change",
      confidence: 0.95,
      mealPreference: entities.mealPreference,
      effectiveDate: entities.effectiveDate,
      reason: entities.reason || "Meal preference changed",
    };
  }

  if (task === "address_change") {
    return {
      intent: "address_change",
      confidence: 0.95,
      address: entities.address,
      effectiveDate: entities.effectiveDate,
      reason: entities.reason || "Address changed",
    };
  }

  if (task === "change_phone") {
    return {
      intent: "meal_change",
      confidence: 0.95,
      mealPreference: `Update Phone Number to ${entities.phoneNumber}`,
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: "Phone number update",
    };
  }

  if (task === "feedback_complaint") {
    const ratingStr = entities.rating ? `${entities.rating} Stars` : "";
    const feedbackSummary = [ratingStr, entities.comment].filter(Boolean).join(" - ");
    return {
      intent: "meal_change",
      confidence: 0.95,
      mealPreference: `Feedback: ${feedbackSummary}`,
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: "Customer feedback/complaint",
    };
  }

  return null;
}
