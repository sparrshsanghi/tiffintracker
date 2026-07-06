import { Clock3 } from "lucide-react";
import { TimelineSkeleton } from "../Shared/Skeletons";
import { Timeline } from "./Timeline";

function HistoryEmptyState() {
  return (
    <div className="mx-5 rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Clock3 size={24} />
      </div>
      <p className="mt-4 font-serif text-lg font-semibold text-foreground">Your journey with Maa Sharda begins here.</p>
      <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">Every lunch, payment, pause, and small change will gather here as your story grows.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-1.5 text-[11px] text-primary">
        <span className="rounded-full bg-secondary px-3 py-1 font-medium">Today</span>
        <span className="rounded-full bg-secondary px-3 py-1 font-medium">Yesterday</span>
        <span className="rounded-full bg-secondary px-3 py-1 font-medium">Earlier</span>
      </div>
    </div>
  );
}

export function HistoryScreen({ timelineLoading, groupedTimeline }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="mx-5 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Relationship timeline</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground text-balance">A story, not a log.</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">Every meal, payment, pause, and subscription update is grouped by date so the history reads like a relationship, not a spreadsheet.</p>
      </section>

      {timelineLoading && (
        <div className="px-5">
          <TimelineSkeleton />
        </div>
      )}

      {!timelineLoading && groupedTimeline.length === 0 && (
        <HistoryEmptyState />
      )}

      {!timelineLoading && groupedTimeline.length > 0 && (
        <div className="px-5">
          <Timeline groupedTimeline={groupedTimeline} />
        </div>
      )}
    </div>
  );
}
