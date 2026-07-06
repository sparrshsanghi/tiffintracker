export function SkeletonBlock({ className = "" }) {
  return <div className={"skeleton-shimmer " + className} aria-hidden="true" />;
}

export function SkeletonLine({ className = "" }) {
  return <SkeletonBlock className={"rounded-full " + className} />;
}

export function TodayMealSkeleton() {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <SkeletonLine className="h-3.5 w-24" />
      <SkeletonLine className="h-8 w-3/4" />
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-3 w-4/5" />
                <SkeletonLine className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-accent p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <SkeletonLine className="h-3 w-16" />
            <SkeletonLine className="h-6 w-32" />
          </div>
          <SkeletonBlock className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
          <SkeletonBlock className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-4 w-3/5" />
                <SkeletonLine className="h-3 w-4/5" />
              </div>
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AiThinkingSkeleton() {
  return (
    <div className="max-w-[80%] rounded-3xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-8 w-8 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-3 w-28" />
          <SkeletonLine className="h-3 w-40" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <SkeletonLine className="h-3 w-[86%]" />
        <SkeletonLine className="h-3 w-[68%]" />
      </div>
    </div>
  );
}

export function ProfileLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-5" aria-busy="true">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-14 w-14 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-3.5 w-24" />
            <SkeletonLine className="h-7 w-2/3" />
            <SkeletonLine className="h-3 w-1/2" />
          </div>
        </div>
        <SkeletonLine className="mt-4 h-4 w-full" />
        <SkeletonLine className="mt-2 h-4 w-11/12" />
        <div className="mt-4 rounded-2xl bg-accent px-4 py-3">
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="mt-2.5 h-5 w-44" />
          <SkeletonLine className="mt-2 h-3 w-52" />
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-5 w-40" />
            <SkeletonLine className="h-3 w-52" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-5 w-36" />
          </div>
        </div>
        <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-8 w-32" />
          </div>
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-11 w-11 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-5 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
