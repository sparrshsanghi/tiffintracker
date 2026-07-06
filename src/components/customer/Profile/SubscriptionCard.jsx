import { UtensilsCrossed } from "lucide-react";
import { ProfileSection } from "./ProfileSection";

export function SubscriptionCard({ customer, pauseText }) {
  return (
    <ProfileSection
      title="Subscription"
      icon={UtensilsCrossed}
      body={(customer.plan || "Meal plan") + (pauseText ? " · Paused" : " · Active")}
      helper={customer.food || "Meal preferences"}
    />
  );
}
