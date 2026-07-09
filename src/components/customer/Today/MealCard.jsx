import { Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { TodayMealSkeleton } from "../Shared/Skeletons";

export function MealCard({ mealItems, mealLoading, isEmptyMeal, note }) {
  if (mealLoading) {
    return <TodayMealSkeleton />;
  }

  const items = mealItems.map(item => {
    let detail = "";
    if (item.key === "rice") detail = "basmati";
    else if (item.key === "chapati") detail = "4 pieces, soft";
    else if (item.key === "salad") detail = "cucumber, onion, lemon";
    else if (item.key === "dal") detail = "ghee, jeera, hing";
    else if (item.key === "vegetable") detail = "seasonal, home-style";
    
    return {
      name: item.name || "Special Item",
      detail: detail || item.layer || "",
    };
  });

  return (
    <motion.section layoutId="tiffin-morph" aria-labelledby="todays-meal" className="mx-5 bg-card text-card-foreground border border-border p-5 rounded-3xl shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="todays-meal" className="font-serif text-xl font-semibold text-foreground">
          Today&apos;s Lunch
        </h2>
        <span className="flex items-center gap-1 text-xs font-medium text-success">
          <Leaf className="size-3.5" strokeWidth={2} aria-hidden />
          Pure veg
        </span>
      </div>

      <p className="mt-2 font-serif text-lg leading-snug text-foreground text-balance">
        {isEmptyMeal ? "Your lunch is being prepared with care" : items.map(i => i.name).join(" · ")}
      </p>

      {note ? (
        <blockquote className="mt-3 rounded-2xl bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground text-pretty">
          <span className="font-medium">From the kitchen: </span>
          {note}
        </blockquote>
      ) : null}

      {!isEmptyMeal && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {items.map((item, idx) => (
            <li
              key={item.name + idx}
              className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2.5 last:border-b-0 last:pb-0"
            >
              <span className="font-medium text-foreground">{item.name}</span>
              {item.detail ? (
                <span className="shrink-0 text-sm text-muted-foreground">{item.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
