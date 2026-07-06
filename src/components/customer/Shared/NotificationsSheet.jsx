import { Bell } from "lucide-react";
import { chatTimeLabel, notificationGroupLabel, notificationMeta } from "../customerUtils";
import { SkeletonBlock, SkeletonLine } from "./Skeletons";

function NotificationSkeletonCard() {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <SkeletonBlock className="h-11 w-11 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-4 w-40" />
              <SkeletonLine className="h-3 w-11/12" />
            </div>
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonLine className="mt-3 h-3 w-24" />
        </div>
      </div>
    </article>
  );
}

function NotificationSkeletonList() {
  return (
    <div className="space-y-6" aria-busy="true">
      {["Today", "Yesterday"].map((section) => (
        <section key={section} className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <SkeletonBlock className="h-6 w-20 rounded-full" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => <NotificationSkeletonCard key={section + index} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function NotificationsSheet({ notifs, onClose, loading = false }) {
  const unreadCount = notifs.length;
  const grouped = notifs.slice().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).reduce((groups, item) => {
    const label = notificationGroupLabel(item.createdAt);
    groups[label] = groups[label] || [];
    groups[label].push(item);
    return groups;
  }, {});
  const sectionOrder = ["Today", "Yesterday", "Older"];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/45 px-4 py-4 backdrop-blur-sm sm:py-6" role="presentation">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-lg" role="dialog" aria-modal="true" aria-label="Notifications">
        <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-4 text-primary-foreground sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-80">Notifications</p>
            <p className="mt-0.5 font-serif text-lg font-semibold leading-tight">Maa Sharda</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/25" aria-label="Close notifications">×</button>
        </div>

        <div className="border-b border-border bg-secondary px-5 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">{unreadCount} update{unreadCount === 1 ? "" : "s"}</p>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
                Unread
              </span>
            )}
          </div>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {loading ? (
            <NotificationSkeletonList />
          ) : unreadCount === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary border border-border">
                <Bell size={24} />
              </div>
              <p className="mt-4 font-serif text-base font-semibold text-foreground">We'll let you know when today's meal is ready.</p>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">Lunch notes, payment updates, pauses, and delivery messages will arrive here with a familiar WhatsApp-style rhythm.</p>
            </div>
          ) : sectionOrder.map((section) => {
            const items = grouped[section] || [];
            if (items.length === 0) return null;
            return (
              <section key={section} className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <p className="flex-shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{section}</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                <div className="space-y-3">
                  {items.map((item) => {
                    const meta = notificationMeta(item);
                    const Icon = meta.icon;
                    return (
                      <article key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className={"flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-border/40 " + (meta.tone === "green" ? "bg-success/12 text-success" : meta.tone === "amber" ? "bg-primary/10 text-primary" : meta.tone === "emerald" ? "bg-success/12 text-success" : "bg-secondary text-foreground")}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{meta.title}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{meta.body}</p>
                              </div>
                              <span className="flex-shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{chatTimeLabel(item.createdAt)}</span>
                            </div>
                            {item.date && <p className="mt-2 text-[10px] font-semibold text-muted-foreground">{item.date}</p>}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
