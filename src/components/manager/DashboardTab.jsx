import { useState } from "react";
import { TODAY_STR, fmt } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ══════════════════════════════════════════════════════════════════════════════
export function DashboardTab({
  stats,
  todayMenuData,
  payStats,
  setTab,
  openAdd,
  onResetDay
}) {
  const [copied, setCopied] = useState(false);
  const [copyErr, setCopyErr] = useState(false);

  const summaryMsg = "🍱 *Delivery Update – " + TODAY_STR + "*\n\n" +
    "✅ Delivered: " + stats.delivered + "/" + stats.total + "\n" +
    "🚴 On the way: " + stats.out + "\n" +
    "⏳ Pending: " + stats.pending + "\n\n" +
    "Thank you for your trust! 🙏";

  function handleCopy() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryMsg)
        .then(function() { setCopied(true); setCopyErr(false); setTimeout(function() { setCopied(false); }, 2000); })
        .catch(function() { setCopyErr(true); setTimeout(function() { setCopyErr(false); }, 3000); });
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = summaryMsg;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(function() { setCopied(false); }, 2000);
      } catch (e) {
        setCopyErr(true);
        setTimeout(function() { setCopyErr(false); }, 3000);
      }
    }
  }

  const actions = [
    { label: "Update delivery statuses", icon: "🚴", fn: function() { setTab("orders"); } },
    { label: "Plan this week's menu",    icon: "📋", fn: function() { setTab("menu"); } },
    { label: "Add new customer",         icon: "➕", fn: openAdd },
    { label: "Reset for new day",        icon: "🔄", fn: onResetDay, destructive: true },
  ];

  const statCards = [
    { label: "Monthly Plan", value: stats.monthly,              icon: "📅", grad: "from-purple-500 to-violet-600" },
    { label: "Daily Plan",   value: stats.daily,                icon: "🔄", grad: "from-blue-500 to-cyan-600" },
    { label: "Delivered",    value: stats.delivered,            icon: "✅", grad: "from-green-500 to-emerald-600" },
    { label: "Remaining",    value: stats.pending + stats.out,  icon: "⏳", grad: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="space-y-4">

      {/* ── Stat grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(function(s) {
          return (
            <div key={s.label} className="mgr-card p-4 flex items-center gap-3">
              <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + s.grad + " flex items-center justify-center text-lg flex-shrink-0"}>
                {s.icon}
              </div>
              <div>
                <div className="text-3xl font-black text-foreground leading-none">{s.value}</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Today's Menu ──────────────────────────────────────── */}
      {todayMenuData && todayMenuData.items.length > 0 ? (
        <div className="mgr-card p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today&apos;s Menu</p>
            <button onClick={function() { setTab("menu"); }} className="text-xs text-primary font-bold">Edit →</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todayMenuData.items.map(function(item, i) {
              return (
                <span key={i} className="bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full border border-border">
                  {item}
                </span>
              );
            })}
          </div>
          {todayMenuData.note && <p className="text-xs text-muted-foreground mt-2">📝 {todayMenuData.note}</p>}
        </div>
      ) : (
        <div className="mgr-card p-4 flex items-center justify-between border-l-4 border-l-[oklch(0.76_0.125_82)]">
          <div>
            <p className="text-xs font-bold text-[oklch(0.54_0.155_35)] uppercase tracking-wider">Today&apos;s Menu</p>
            <p className="text-sm font-bold text-foreground mt-0.5">Not planned yet</p>
          </div>
          <button onClick={function() { setTab("menu"); }} className="text-xs font-black text-primary bg-accent border border-border px-3 py-1.5 rounded-xl mgr-press">
            Plan →
          </button>
        </div>
      )}

      {/* ── Payments summary ──────────────────────────────────── */}
      <div className="mgr-card p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-2xl font-black text-foreground mt-1">{fmt(payStats.collected)}</p>
            <p className="text-xs text-muted-foreground">of {fmt(payStats.due)}</p>
          </div>
          <div className="flex gap-2">
            <div className="text-center bg-[oklch(0.95_0.05_148)] rounded-xl px-3 py-2">
              <div className="text-xl font-black text-success">{payStats.nPaid}</div>
              <div className="text-xs text-success font-bold">Paid</div>
            </div>
            <div className="text-center bg-[oklch(0.96_0.04_27)] rounded-xl px-3 py-2">
              <div className="text-xl font-black text-destructive">{payStats.nUnpaid}</div>
              <div className="text-xs text-destructive font-bold">Unpaid</div>
            </div>
          </div>
        </div>
        <div className="mgr-track h-2 rounded-full overflow-hidden">
          <div className="mgr-fill h-full rounded-full transition-all duration-500" style={{ width: payStats.pct + "%" }}></div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          {payStats.pct}% · {fmt(payStats.due - payStats.collected)} pending
        </p>
        {payStats.due - payStats.collected > 0 ? (
          <button
            onClick={function() { setTab("payments"); }}
            className="w-full py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-bold border border-border mgr-press"
          >
            Manage Payments →
          </button>
        ) : (
          <div className="w-full py-2.5 text-center text-success text-sm font-bold bg-[oklch(0.95_0.05_148)] rounded-xl">
            ✅ All payments collected!
          </div>
        )}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="mgr-card p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="space-y-2">
          {actions.map(function(a) {
            return (
              <button
                key={a.label}
                onClick={a.fn}
                className={"mgr-press w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border " +
                  (a.destructive
                    ? "bg-[oklch(0.97_0.02_27)] text-destructive border-[oklch(0.92_0.04_27)]"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                  )
                }
              >
                <span>{a.icon}</span>
                {a.label}
                {a.destructive && <span className="ml-1 text-[10px] bg-[oklch(0.92_0.04_27)] text-destructive px-1.5 py-0.5 rounded-full font-bold">⚠</span>}
                <span className="ml-auto opacity-40">→</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── WhatsApp Summary ──────────────────────────────────── */}
      {stats.total > 0 && (
        <div className="mgr-card p-4">
          <p className="font-bold text-foreground text-sm mb-2">💬 WhatsApp Summary</p>
          <div className="mgr-inset p-3 text-xs text-foreground font-mono whitespace-pre-wrap">
            {summaryMsg}
          </div>
          <button
            onClick={handleCopy}
            aria-label="Copy WhatsApp delivery summary to clipboard"
            className={"mgr-press mt-3 w-full py-3 rounded-xl text-sm font-black text-white " +
              (copyErr ? "bg-destructive" : "mgr-btn-success")}
          >
            {copyErr ? "⚠ Copy failed — please copy manually" : (copied ? "✓ Copied!" : "Copy Message")}
          </button>
        </div>
      )}
    </div>
  );
}
