import { useEffect, useState, useMemo, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { TimelineSkeleton } from "../Shared/Skeletons";
import { Timeline } from "./Timeline";

function HistoryEmptyState() {
  return (
    <div className="mx-5 rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary text-2xl" aria-hidden="true">
        🍱
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">Your journey with Maa Sharda starts here.</h3>
      <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
        Every meal, payment, pause, delivery and conversation will become part of your story. Once your first order is delivered, you&apos;ll see it here.
      </p>
      <div className="mt-5 flex justify-center">
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Back Home
        </button>
      </div>
    </div>
  );
}

function HistoryErrorState({ onRetry }) {
  return (
    <div className="mx-5 rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600" aria-hidden="true">
        <AlertTriangle size={24} />
      </div>
      <h3 className="mt-4 font-semibold text-foreground">Could not load your history.</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">Please check your internet connection and try again.</p>
      <div className="mt-5">
        <button
          onClick={onRetry}
          className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function HistoryScreen({ timelineLoading, groupedTimeline, loadTimeline }) {
  const [showSkeleton, setShowSkeleton] = useState(timelineLoading);
  const [loadError, setLoadError] = useState(false);

  // Briefly show skeleton (max 450ms)
  useEffect(() => {
    if (timelineLoading) {
      setShowSkeleton(true);
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [timelineLoading]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    setLoadError(false);
    setShowSkeleton(true);
    try {
      if (loadTimeline) {
        await loadTimeline();
      }
    } catch (err) {
      setLoadError(true);
    }
  }, [loadTimeline]);

  // Memoize grouped events to prevent redundant rendering and sorting
  const renderedContent = useMemo(() => {
    if (showSkeleton) {
      return (
        <div className="px-5" aria-hidden="true">
          <TimelineSkeleton />
        </div>
      );
    }

    if (loadError) {
      return <HistoryErrorState onRetry={handleRetry} />;
    }

    if (!groupedTimeline || groupedTimeline.length === 0) {
      return <HistoryEmptyState />;
    }

    return (
      <div className="px-5">
        <Timeline groupedTimeline={groupedTimeline} />
      </div>
    );
  }, [showSkeleton, loadError, groupedTimeline, handleRetry]);

  return (
    <div className="flex flex-col gap-5">
      <section className="mx-5 rounded-3xl border border-border bg-card p-5 shadow-sm" tabIndex={0} aria-label="History overview">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Relationship timeline</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground text-balance">A story, not a log.</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          Every meal, payment, pause, and subscription update is grouped by date so the history reads like a relationship, not a spreadsheet.
        </p>
      </section>

      {renderedContent}
    </div>
  );
}
