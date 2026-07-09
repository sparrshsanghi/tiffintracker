import { IndianRupee, Inbox, Users } from "lucide-react";

import { BrandLogo } from "../../Views.jsx";
import { TODAY_STR, fmt } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// MANAGER HEADER — business identity, date, delivery progress ring,
// today's revenue, pending approvals, customer count.
// Props:
//   stats            — { delivered, total, out, pending, progress }
//   payStats         — { collected, due } (optional)
//   pendingApprovals — number (optional)
//   customerCount    — number (optional)
// ══════════════════════════════════════════════════════════════════════════════

function ProgressRing({ progress, delivered, total }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const offset = C - (Math.min(100, Math.max(0, progress)) / 100) * C;
  return (
    <div className="relative flex size-[84px] shrink-0 items-center justify-center" role="img" aria-label={delivered + " of " + total + " deliveries complete"}>
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(84,52,24,0.09)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={R} fill="none"
          stroke={progress >= 100 ? "var(--success)" : "var(--primary)"}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          className="mgr-ring-fg"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black leading-none text-foreground">{delivered}</span>
        <span className="text-[10px] font-semibold text-muted-foreground">of {total}</span>
      </div>
    </div>
  );
}

export function ManagerHeader({ stats, payStats, pendingApprovals, customerCount }) {
  const collected = payStats ? payStats.collected : null;
  const approvals = typeof pendingApprovals === "number" ? pendingApprovals : null;
  const nCustomers = typeof customerCount === "number" ? customerCount : null;
  const allDone = stats.total > 0 && stats.delivered === stats.total;

  return (
    <header className="px-4 pb-4 pt-5">
      <div className="mgr-hero mx-auto max-w-lg p-5 mgr-enter">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <BrandLogo className="size-9 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Maa Sharda</p>
                <h1 className="font-serif text-xl font-semibold leading-tight text-foreground text-balance">Kitchen Dashboard</h1>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{TODAY_STR}</p>
            <p className="mt-3 text-sm font-semibold text-foreground" aria-live="polite">
              {allDone
                ? "Every tiffin delivered. Wonderful work today."
                : stats.out > 0
                  ? stats.out + " on the way · " + stats.pending + " still to go"
                  : stats.pending > 0
                    ? stats.pending + " deliver" + (stats.pending !== 1 ? "ies" : "y") + " waiting to start"
                    : "No deliveries scheduled today"}
            </p>
          </div>
          <ProgressRing progress={stats.progress} delivered={stats.delivered} total={stats.total} />
        </div>

        {(collected !== null || approvals !== null || nCustomers !== null) && (
          <div className="mt-4 flex items-stretch gap-2 border-t border-border/70 pt-4">
            {collected !== null && (
              <div className="mgr-inset flex flex-1 items-center gap-2 px-3 py-2">
                <IndianRupee className="size-4 shrink-0 text-success" strokeWidth={2} aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black leading-tight text-foreground">{fmt(collected)}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">collected</p>
                </div>
              </div>
            )}
            {approvals !== null && (
              <div className="mgr-inset flex flex-1 items-center gap-2 px-3 py-2">
                <span className="relative shrink-0">
                  <Inbox className="size-4 text-primary" strokeWidth={2} aria-hidden />
                  {approvals > 0 && <span className="mgr-pulse-dot absolute -right-1 -top-1 size-2 rounded-full bg-destructive" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black leading-tight text-foreground">{approvals}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">approval{approvals !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
            {nCustomers !== null && (
              <div className="mgr-inset flex flex-1 items-center gap-2 px-3 py-2">
                <Users className="size-4 shrink-0 text-foreground/70" strokeWidth={2} aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-black leading-tight text-foreground">{nCustomers}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">customer{nCustomers !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
