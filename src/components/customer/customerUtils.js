import {
  Bell,
  Clock3,
  CreditCard,
  PauseCircle,
  Phone,
  UtensilsCrossed,
} from "lucide-react";

export const AI_SUGGESTIONS = [
  "Pause tomorrow",
  "Resume meals",
  "Extra chapati",
  "Less spicy",
  "Change address",
  "Need breakfast",
];

const DEFAULT_MEAL = [
  { key: "rice", icon: "🍚", name: "Steamed Rice", layer: "Top layer" },
  { key: "chapati", icon: "🫓", name: "2 Chapati", layer: "Top layer" },
  { key: "salad", icon: "🥗", name: "Fresh Salad", layer: "Top layer" },
  { key: "dal", icon: "🟡", name: "Yellow Dal", layer: "Middle layer" },
  { key: "vegetable", icon: "🥬", name: "Aloo Gobi", layer: "Bottom layer" },
  { key: "curry", icon: "🍛", name: "Seasonal Curry", layer: "Bottom layer" },
];

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function firstName(customer) {
  return String(customer?.name || "there").trim().split(" ")[0] || "there";
}

export function formatMoney(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

export function getDefaultFood(customFood) {
  if (customFood && customFood.trim().length > 0) return customFood;
  const d = new Date();
  const isSunday = d.getDay() === 0;
  const isNoon = d.getHours() < 16;
  if (isSunday && isNoon) return "Special Pav Bhaji, Rice, Raita";
  return "Rice, Dal Fry, Mix Veg";
}

function classifyFood(rawItem) {
  const text = String(rawItem || "").toLowerCase();
  if (!text) return null;
  if (text.includes("rice") || text.includes("chawal") || text.includes("biryani")) {
    return { key: "rice", icon: "🍚", name: text.includes("biryani") ? "Veg Biryani" : "Steamed Rice", layer: "Top layer" };
  }
  if (text.includes("chapati") || text.includes("roti") || text.includes("phulka")) {
    return { key: "chapati", icon: "🫓", name: "2 Chapati", layer: "Top layer" };
  }
  if (text.includes("salad") || text.includes("kachumber")) {
    return { key: "salad", icon: "🥗", name: "Fresh Salad", layer: "Top layer" };
  }
  if (text.includes("dal") || text.includes("daal")) {
    return { key: "dal", icon: "🟡", name: text.includes("fry") ? "Dal Fry" : "Yellow Dal", layer: "Middle layer" };
  }
  if (text.includes("veg") || text.includes("sabzi") || text.includes("gobi") || text.includes("aloo") || text.includes("bhaji")) {
    return { key: "vegetable", icon: "🥬", name: text.includes("bhaji") ? "Pav Bhaji" : "Aloo Gobi", layer: "Bottom layer" };
  }
  if (text.includes("curry") || text.includes("paneer") || text.includes("chole") || text.includes("rajma")) {
    return { key: "curry", icon: "🍛", name: rawItem, layer: "Bottom layer" };
  }
  return null;
}

export function getMealPresentation(todayMenu, customer) {
  const fromMenu = Array.isArray(todayMenu?.items)
    ? todayMenu.items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const sourceItems = (fromMenu.length > 0
    ? fromMenu
    : getDefaultFood(customer?.food)
      .split(/,|·|\+|\/| and /i)
      .map((item) => item.trim())
      .filter(Boolean));
  const resolved = DEFAULT_MEAL.map((item) => Object.assign({}, item));
  sourceItems.forEach((item) => {
    const classified = classifyFood(item);
    if (!classified) return;
    const index = resolved.findIndex((candidate) => candidate.key === classified.key);
    if (index >= 0) resolved[index] = classified;
  });
  return resolved;
}

export function getDeliveryCopy(status) {
  if (status === "delivered") {
    return {
      label: "Delivered",
      eta: "Delivered",
      partner: "Maa Sharda rider",
      body: "Enjoy your meal ❤️",
      tone: "green",
    };
  }
  if (status === "out") {
    return {
      label: "On the way",
      eta: "20-30 min",
      partner: "Maa Sharda rider",
      body: "Your tiffin is travelling to you now.",
      tone: "amber",
    };
  }
  return {
    label: "Preparing",
    eta: "Lunch window",
    partner: "Assigning soon",
    body: "The kitchen is getting your meal ready.",
    tone: "stone",
  };
}

export function actionLabel(intent) {
  if (intent === "pause_meals") return "Pause Meals";
  if (intent === "resume_meals") return "Resume Meals";
  if (intent === "meal_change") return "Meal Change";
  if (intent === "address_change") return "Address Change";
  return "Unsupported";
}

export function dateLine(extraction) {
  if (!extraction) return "";
  if (extraction.intent === "pause_meals") {
    return (extraction.startDate || "-") + " to " + (extraction.endDate || "-");
  }
  return extraction.effectiveDate || extraction.resumeDate || extraction.startDate || "-";
}

export function requestedLine(extraction) {
  if (!extraction) return "";
  if (extraction.intent === "meal_change") return extraction.mealPreference || "-";
  if (extraction.intent === "address_change") return extraction.address || "-";
  if (extraction.intent === "pause_meals") return "Pause meals";
  return "Resume meals";
}

export function timelineDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function chatTimeLabel(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function notificationGroupLabel(value) {
  if (!value) return "Older";
  const eventDate = new Date(value);
  if (Number.isNaN(eventDate.getTime())) return "Older";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = eventDate.toLocaleDateString("en-CA");
  if (key === today.toLocaleDateString("en-CA")) return "Today";
  if (key === yesterday.toLocaleDateString("en-CA")) return "Yesterday";
  return "Older";
}

export function notificationMeta(item) {
  const text = String(item?.msg || item?.message || "").toLowerCase();
  if (text.includes("lunch") || text.includes("ready")) {
    return {
      title: "Today's lunch ready",
      body: item?.msg || item?.message || "Your lunch is ready.",
      tone: "green",
      icon: UtensilsCrossed,
    };
  }
  if (text.includes("paid") || text.includes("payment")) {
    return {
      title: "Payment received",
      body: item?.msg || item?.message || "We received your payment.",
      tone: "emerald",
      icon: CreditCard,
    };
  }
  if (text.includes("pause") || text.includes("paused")) {
    return {
      title: "Pause approved",
      body: item?.msg || item?.message || "Your pause request is approved.",
      tone: "amber",
      icon: PauseCircle,
    };
  }
  if (text.includes("delay") || text.includes("late") || text.includes("delayed")) {
    return {
      title: "Delivery delayed",
      body: item?.msg || item?.message || "Your delivery may arrive a little later.",
      tone: "slate",
      icon: Clock3,
    };
  }
  if (text.includes("bill")) {
    return {
      title: "Monthly bill",
      body: item?.msg || item?.message || "Your monthly bill is ready.",
      tone: "stone",
      icon: Phone,
    };
  }
  return {
    title: item?.title || "Update",
    body: item?.msg || item?.message || "You have a new update.",
    tone: "stone",
    icon: Bell,
  };
}

export function timelineGroupLabel(value) {
  if (!value) return "Earlier";
  const eventDate = new Date(value);
  if (Number.isNaN(eventDate.getTime())) return "Earlier";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = eventDate.toLocaleDateString("en-CA");
  if (key === today.toLocaleDateString("en-CA")) return "Today";
  if (key === yesterday.toLocaleDateString("en-CA")) return "Yesterday";
  return eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function timelineVerb(type) {
  if (type === "payment_received") return "Paid";
  if (type === "pause") return "Meals paused";
  if (type === "resume") return "Meals resumed";
  if (type === "address_change") return "Address updated";
  if (type === "meal_change") return "Meal preference updated";
  if (type === "onboarding_approved") return "Joined Maa Sharda";
  if (type === "monthly_bill_generated") return "Monthly bill generated";
  return "Updated";
}
