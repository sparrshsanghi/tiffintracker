import { CheckCircle2, CreditCard, PauseCircle, PlayCircle, Home, Settings, Sparkles, Receipt, Smile } from "lucide-react";
import { timelineDate, timelineVerb } from "../customerUtils";

function getEventStyle(type) {
  switch (type) {
    case "payment_received":
      return {
        icon: <CreditCard size={16} className="text-amber-600" />,
        bg: "bg-amber-50 border-amber-200",
        colorClass: "text-amber-700",
      };
    case "pause":
      return {
        icon: <PauseCircle size={16} className="text-orange-600" />,
        bg: "bg-orange-50 border-orange-200",
        colorClass: "text-orange-700",
      };
    case "resume":
      return {
        icon: <PlayCircle size={16} className="text-green-600" />,
        bg: "bg-green-50 border-green-200",
        colorClass: "text-green-700",
      };
    case "address_change":
      return {
        icon: <Home size={16} className="text-indigo-600" />,
        bg: "bg-indigo-50 border-indigo-200",
        colorClass: "text-indigo-700",
      };
    case "meal_change":
    case "preference_update":
      return {
        icon: <Sparkles size={16} className="text-blue-600" />,
        bg: "bg-blue-50 border-blue-200",
        colorClass: "text-blue-700",
      };
    case "onboarding_approved":
      return {
        icon: <Smile size={16} className="text-purple-600" />,
        bg: "bg-purple-50 border-purple-200",
        colorClass: "text-purple-700",
      };
    case "monthly_bill_generated":
      return {
        icon: <Receipt size={16} className="text-zinc-600" />,
        bg: "bg-zinc-50 border-zinc-200",
        colorClass: "text-zinc-700",
      };
    case "delivered":
    case "delivery":
      return {
        icon: <CheckCircle2 size={16} className="text-emerald-600" />,
        bg: "bg-emerald-50 border-emerald-200",
        colorClass: "text-emerald-700",
      };
    default:
      return {
        icon: <Settings size={16} className="text-primary" />,
        bg: "bg-secondary border-border",
        colorClass: "text-primary",
      };
  }
}

export function TimelineEntry({ item }) {
  const style = getEventStyle(item.type);

  return (
    <div
      className="flex gap-4 border-b border-border/60 px-4 py-4 last:border-b-0 relative hover:bg-muted/30 transition-colors"
      role="listitem"
      aria-label={`${item.title || timelineVerb(item.type)} at ${timelineDate(item.createdAt)}`}
    >
      {/* Icon with status color */}
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${style.bg}`}>
        {style.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground">
              {item.title || timelineVerb(item.type)}
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {item.description || timelineVerb(item.type)}
            </p>
          </div>
          <span className={`self-start rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${style.colorClass} bg-opacity-10 bg-current`}>
            {timelineDate(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
