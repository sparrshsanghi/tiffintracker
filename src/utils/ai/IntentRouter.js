export function detectLocalIntent(text) {
  const lower = String(text || "").toLowerCase();

  // Elegant regular expression matching preference updates to avoid huge if/else chains
  const PREFERENCE_REGEX = /\b(extra|more|less|no|need|add|skip|change|without|with|only)\b\s*\d*\s*\b(chapati|chapatis|roti|rotis|rice|dal|daal|oil|salt|spicy|spice|sweet|sugar|onion|garlic|breakfast|dinner|lunch|meal|meals|tiffin)s?\b/i;

  if (PREFERENCE_REGEX.test(lower)) {
    return "preference_update";
  }

  // Payment enquiries
  if (
    (/\b(pay|payment|due|bill|balance|rate|price|cost|money|fees)\b/.test(lower) &&
     /\b(status|enquiry|query|ask|tell|how|what|show|get|detail|pending)\b/.test(lower)) ||
    /\b(how much (do i owe|to pay|is my bill|is my due|is the rate|is the price|is the cost))\b/.test(lower) ||
    /\b(payment status|pending payment|due payment|billing info|billing status)\b/.test(lower)
  ) {
    return "payment_enquiry";
  }

  // Subscription enquiries
  if (/\b(subscription|sub|plan|package|duration|active|joined|validity)\b/.test(lower)) {
    return "subscription_enquiry";
  }

  // Change phone
  if (/\b(phone|number|mobile|contact)\b/.test(lower) && /\b(change|update|new|replace)\b/.test(lower)) {
    return "change_phone";
  }

  // Feedback, ratings, complaints, compliments
  if (
    /\b(rate|rating|feedback|review|taste|quality|hygiene|complain|complaint|compliment|good|bad|delicious|yummy|amazing|disgusting|worst|best|poor|excellent|star|stars)\b/.test(lower)
  ) {
    return "feedback_complaint";
  }

  return null;
}
