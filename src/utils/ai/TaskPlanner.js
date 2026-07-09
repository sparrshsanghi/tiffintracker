export function getNextStep(task, entities) {
  if (task === "preference_update") {
    if (!entities.preference || !entities.meal) {
      return {
        complete: false,
        prompt: "Sure, what preference update would you like to make? (e.g., extra chapati, less spicy, no sweet)",
      };
    }
    if (!entities.effectiveDate) {
      const qtyStr = entities.quantity ? `${entities.quantity} ` : "";
      return {
        complete: false,
        prompt: `Sure. Would you like ${qtyStr}${entities.preference} ${entities.meal} starting from today or tomorrow?`,
      };
    }
    return { complete: true };
  }

  if (task === "pause_meals") {
    if (!entities.startDate) {
      return {
        complete: false,
        prompt: "Sure! From which date would you like to pause your meals?",
      };
    }
    if (!entities.endDate) {
      return {
        complete: false,
        prompt: "For how long would you like to pause your meals? Or till which date?",
      };
    }
    return { complete: true };
  }

  if (task === "resume_meals") {
    if (!entities.resumeDate) {
      return {
        complete: false,
        prompt: "When would you like to resume your meals?",
      };
    }
    return { complete: true };
  }

  if (task === "meal_change") {
    if (!entities.mealPreference) {
      return {
        complete: false,
        prompt: "What would you like to update your meal preference to? (e.g. extra chapati, less spicy, skip dessert)",
      };
    }
    if (!entities.effectiveDate) {
      return {
        complete: false,
        prompt: "From which date should this preference change take effect?",
      };
    }
    return { complete: true };
  }

  if (task === "address_change") {
    if (!entities.address) {
      return {
        complete: false,
        prompt: "Could you please provide your new delivery address?",
      };
    }
    if (!entities.effectiveDate) {
      return {
        complete: false,
        prompt: "From which date should we start delivering to this new address?",
      };
    }
    return { complete: true };
  }

  if (task === "change_phone") {
    if (!entities.phoneNumber) {
      return {
        complete: false,
        prompt: "What is the new phone number you would like to update in your profile?",
      };
    }
    return { complete: true };
  }

  if (task === "feedback_complaint") {
    if (!entities.comment && !entities.rating) {
      return {
        complete: false,
        prompt: "Sure, please share your rating (1 to 5 stars) or any comments/complaints about our food or service.",
      };
    }
    return { complete: true };
  }

  return { complete: true };
}
