export async function resolveEntities(task, currentEntities, userInput, extractMaaAiIntent) {
  const resultEntities = { ...currentEntities };
  const lowerInput = userInput.toLowerCase();

  if (task === "preference_update") {
    // Extract preference modifier
    const prefMatch = lowerInput.match(/\b(extra|more|less|no|need|add|skip|change|without|with|only)\b/i);
    if (prefMatch) {
      resultEntities.preference = prefMatch[1].toLowerCase();
    }

    // Extract quantity if any
    const qtyMatch = lowerInput.match(/\b(\d+)\b/);
    if (qtyMatch) {
      resultEntities.quantity = parseInt(qtyMatch[1], 10);
    } else if (/\b(an|a|one)\b/.test(lowerInput)) {
      resultEntities.quantity = 1;
    }

    // Extract item / meal category
    const itemMatch = lowerInput.match(/\b(chapati|chapatis|roti|rotis|rice|dal|daal|oil|salt|spicy|spice|sweet|sugar|onion|garlic|breakfast|dinner|lunch|meal|meals|tiffin)\b/i);
    if (itemMatch) {
      resultEntities.meal = itemMatch[1].toLowerCase();
    }

    // Call backend to resolve dates cleanly (Gemini integration is excellent for relative dates)
    const synth = `Change meal preference to ${userInput}`;
    try {
      const res = await extractMaaAiIntent(synth);
      if (res && res.supported && res.extraction) {
        const ext = res.extraction;
        if (ext.effectiveDate) {
          resultEntities.effectiveDate = ext.effectiveDate;
        }
      }
    } catch (e) {
      console.error("Entity resolution failed for preference_update effectiveDate", e);
    }

    // Local fallback for date keywords if backend doesn't resolve
    if (!resultEntities.effectiveDate) {
      if (/\btomorrow\b/i.test(lowerInput)) {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        resultEntities.effectiveDate = tom.toISOString().slice(0, 10);
      } else if (/\btoday\b/i.test(lowerInput)) {
        resultEntities.effectiveDate = new Date().toISOString().slice(0, 10);
      }
    }

    // Gather notes
    if (!resultEntities.notes && userInput !== resultEntities.effectiveDate && !/^(today|tomorrow|yes|confirm|no)$/i.test(lowerInput)) {
      resultEntities.notes = userInput;
    }
  }

  else if (task === "pause_meals") {
    let synth = "";
    if (resultEntities.startDate) {
      synth = `Pause meals starting from ${resultEntities.startDate}. ${userInput}`;
    } else {
      synth = `Pause meals. ${userInput}`;
    }

    try {
      const res = await extractMaaAiIntent(synth);
      if (res && res.supported && res.extraction) {
        const ext = res.extraction;
        if (ext.startDate) resultEntities.startDate = ext.startDate;
        if (ext.endDate) resultEntities.endDate = ext.endDate;
        if (ext.reason && ext.reason !== "unsupported" && ext.reason !== "-") {
          resultEntities.reason = ext.reason;
        }
      }
    } catch (e) {
      console.error("Entity resolution failed for pause_meals", e);
    }
  }

  else if (task === "resume_meals") {
    const synth = `Resume meals. ${userInput}`;
    try {
      const res = await extractMaaAiIntent(synth);
      if (res && res.supported && res.extraction) {
        const ext = res.extraction;
        if (ext.resumeDate) resultEntities.resumeDate = ext.resumeDate;
        if (ext.effectiveDate) resultEntities.effectiveDate = ext.effectiveDate;
        if (ext.startDate) resultEntities.startDate = ext.startDate;
      }
    } catch (e) {
      console.error("Entity resolution failed for resume_meals", e);
    }
  }

  else if (task === "meal_change") {
    let synth = "";
    if (resultEntities.mealPreference) {
      synth = `Change meal preference to ${resultEntities.mealPreference}. ${userInput}`;
    } else {
      synth = `Change meal preference. ${userInput}`;
    }

    try {
      const res = await extractMaaAiIntent(synth);
      if (res && res.supported && res.extraction) {
        const ext = res.extraction;
        if (ext.mealPreference) resultEntities.mealPreference = ext.mealPreference;
        if (ext.effectiveDate) resultEntities.effectiveDate = ext.effectiveDate;
      }
    } catch (e) {
      console.error("Entity resolution failed for meal_change", e);
    }
  }

  else if (task === "address_change") {
    let synth = "";
    if (resultEntities.address) {
      synth = `Change address to ${resultEntities.address}. ${userInput}`;
    } else {
      synth = `Change address. ${userInput}`;
    }

    try {
      const res = await extractMaaAiIntent(synth);
      if (res && res.supported && res.extraction) {
        const ext = res.extraction;
        if (ext.address) resultEntities.address = ext.address;
        if (ext.effectiveDate) resultEntities.effectiveDate = ext.effectiveDate;
      }
    } catch (e) {
      console.error("Entity resolution failed for address_change", e);
    }
  }

  else if (task === "change_phone") {
    const phoneMatch = userInput.match(/\b\d{10}\b/) || userInput.match(/\+?\d[\d-\s]{8,14}\d/);
    if (phoneMatch) {
      resultEntities.phoneNumber = phoneMatch[0].trim();
    }
  }

  else if (task === "feedback_complaint") {
    const ratingMatch = userInput.match(/\b([1-5])\s*(?:star|rating|\/5)?\b/i);
    if (ratingMatch) {
      resultEntities.rating = parseInt(ratingMatch[1], 10);
    }
    if (!resultEntities.comment) {
      resultEntities.comment = userInput;
    } else {
      resultEntities.comment += ` | ${userInput}`;
    }
  }

  return resultEntities;
}
