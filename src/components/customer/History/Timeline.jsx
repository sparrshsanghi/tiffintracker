import { TimelineGroup } from "./TimelineGroup";

export function Timeline({ groupedTimeline }) {
  return (
    <div className="space-y-6">
      {groupedTimeline.map(([label, items]) => (
        <TimelineGroup key={label} label={label} items={items} />
      ))}
    </div>
  );
}
