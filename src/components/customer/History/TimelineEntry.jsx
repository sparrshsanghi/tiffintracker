import { CheckCircle2 } from "lucide-react";
import { timelineDate, timelineVerb } from "../customerUtils";

export function TimelineEntry({ item }) {
  return (
    <div className="flex gap-4 border-b border-border/60 px-4 py-4 last:border-b-0">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary border border-border">
        <CheckCircle2 size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{item.title || timelineVerb(item.type)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.description || timelineVerb(item.type)}</p>
          </div>
          <span className="self-start rounded-full bg-secondary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {timelineDate(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
