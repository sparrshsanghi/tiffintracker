import { useEffect, useRef, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { formatMoney } from "../customerUtils";
import { MealStatusBanner } from "./MealStatusBanner";
import { TiffinReveal } from "./TiffinReveal";
import { MealCard } from "./MealCard";
import { QuickActions } from "./QuickActions";
import { DeliveryInfoCard } from "./DeliveryInfoCard";

export function TodayScreen({ meal, deliveryCopy, pauseText, customer, amountDue, openAiWith, onRefreshMeal, onGoProfile, mealLoading }) {
  const [openingCycle, setOpeningCycle] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const openingTimers = useRef([]);
  const mealItems = Array.isArray(meal) ? meal : [];
  const reducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mealSignature = mealItems.map((item) => item.key + ":" + item.name + ":" + item.layer).join("|");
  const storageKey = customer?.id ? "maa_today_opening_signature_" + customer.id : "maa_today_opening_signature_guest";

  function clearOpeningTimers() {
    openingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    openingTimers.current = [];
  }

  function playOpeningSequence(force = false) {
    clearOpeningTimers();
    setOpeningCycle((value) => value + 1);
    if (reducedMotion) {
      setIsOpening(false);
      return;
    }
    setIsOpening(true);
    const timerId = window.setTimeout(() => setIsOpening(false), 2360);
    openingTimers.current = [timerId];
    if (force && customer?.id) {
      window.localStorage.setItem(storageKey, mealSignature);
    }
  }

  useEffect(() => {
    return () => clearOpeningTimers();
  }, []);

  useEffect(() => {
    if (!customer?.id) return;
    const storedSignature = window.localStorage.getItem(storageKey);
    if (storedSignature !== mealSignature) {
      window.localStorage.setItem(storageKey, mealSignature);
      playOpeningSequence();
    } else {
      setIsOpening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, mealSignature]);

  const mealDisplayRows = mealItems
    .map((item) => {
      if (item.key === "dal") return "Dal Tadka";
      if (item.key === "chapati") return "4 Chapati";
      if (item.key === "rice") return "Jeera Rice";
      if (item.key === "vegetable") return "Seasonal Sabzi";
      if (item.key === "salad") return "Salad";
      if (item.key === "curry") return item.name || "Seasonal Curry";
      return item.name;
    })
    .filter(Boolean);

  const mainMeal = mealDisplayRows.join(" · ") || "Your lunch is being prepared with care";
  const isEmptyMeal = mealItems.length === 0;

  function replayTiffin() {
    playOpeningSequence(true);
    if (onRefreshMeal) onRefreshMeal();
  }

  const getStatus = () => {
    if (customer?.paused || customer?.active === false) {
      return "skipped";
    }
    if (deliveryCopy?.label === "Delivered" || deliveryCopy?.eta === "Delivered") {
      return "delivered";
    }
    if (deliveryCopy?.label === "On the way" || deliveryCopy?.label === "Out for delivery") {
      return "on-the-way";
    }
    return "preparing";
  };

  const info = {
    windowLabel: deliveryCopy?.eta || "12:30 – 1:15 PM",
    address: customer?.address || "Address on file",
    deliveryPartner: deliveryCopy?.partner || null,
    dabbaCount: customer?.dabbas || 1,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="ms-fade-up">
        <MealStatusBanner status={getStatus()} />
      </div>

      <div className="relative">
        <TiffinReveal
          key={openingCycle}
          phase={isOpening ? "opening" : "open"}
          heroSrc={customer?.imageUrl || "/images/todays-thali.png"}
          heroAlt={`Today's lunch: ${mainMeal}`}
        />
        <button
          onClick={replayTiffin}
          className="absolute top-2 right-8 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/85 text-muted-foreground transition-colors hover:bg-secondary shadow-sm"
          aria-label="Replay tiffin opening"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {pauseText && (
        <div className="mx-5 rounded-2xl border border-border bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm">
          <p className="font-bold">{pauseText}</p>
          {customer.resumeDate && <p className="mt-1 text-xs text-accent-foreground/80">Resume date: {customer.resumeDate}</p>}
        </div>
      )}

      <div className="ms-fade-up" style={{ animationDelay: '0.08s' }}>
        <MealCard
          mealItems={mealItems}
          mealLoading={mealLoading}
          isEmptyMeal={isEmptyMeal}
          note={customer?.foodNote || ""}
        />
      </div>

      <div className="ms-fade-up" style={{ animationDelay: '0.16s' }}>
        <QuickActions openAiWith={openAiWith} />
      </div>

      <div className="ms-fade-up" style={{ animationDelay: '0.24s' }}>
        <DeliveryInfoCard info={info} />
      </div>

      {amountDue > 0 && (
        <div className="ms-fade-up px-5" style={{ animationDelay: '0.32s' }}>
          <button
            onClick={onGoProfile}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-accent px-4 py-3 text-left text-sm text-accent-foreground shadow-sm transition-colors hover:bg-accent/80"
          >
            <div>
              <p className="font-semibold">{formatMoney(amountDue)} due this month</p>
              <p className="text-xs text-accent-foreground/80">Open profile for payment details</p>
            </div>
            <CreditCard className="size-5" />
          </button>
        </div>
      )}

      <p className="px-5 pb-2 text-center text-xs text-muted-foreground">
        {customer.mealsThisMonth || customer.mealsCount || 12} days of meals together
      </p>
    </div>
  );
}
