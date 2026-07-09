import { TimelineEntry } from "./TimelineEntry";

export function TimelineGroup({ label, items }) {
  return (
    <section className="flex flex-col gap-3" aria-label={`Events grouped under ${label}`}>
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="flex-shrink-0 rounded-full border border-border bg-secondary px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          {label}
        </p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm divide-y divide-border/40 relative" role="list">
        {items.map((item, idx) => (
          <TimelineEntry key={item.id || idx} item={item} />
        ))}
      </div>
    </section>
  );
}
