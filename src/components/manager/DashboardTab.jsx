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
      // Fallback for older browsers
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
    { label: "Update delivery statuses", icon: "🚴", cls: "bg-orange-50 text-orange-700", fn: function() { setTab("orders"); } },
    { label: "Plan this week's menu", icon: "📋", cls: "bg-amber-50 text-amber-700", fn: function() { setTab("menu"); } },
    { label: "Add new customer", icon: "➕", cls: "bg-green-50 text-green-700", fn: openAdd },
    { label: "Reset for new day", icon: "🔄", cls: "bg-red-50 text-red-700 border border-red-100", fn: onResetDay, destructive: true },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Monthly Plan", value: stats.monthly, icon: "📅", grad: "from-purple-500 to-violet-600" },
          { label: "Daily Plan",   value: stats.daily,   icon: "🔄", grad: "from-blue-500 to-cyan-600" },
          { label: "Delivered",    value: stats.delivered, icon: "✅", grad: "from-green-500 to-emerald-600" },
          { label: "Remaining",    value: stats.pending + stats.out, icon: "⏳", grad: "from-amber-500 to-orange-600" },
        ].map(function (s) {
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-3">
              <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + s.grad + " flex items-center justify-center text-lg flex-shrink-0"}>{s.icon}</div>
              <div>
                <div className="text-3xl font-black text-stone-800 leading-none">{s.value}</div>
                <div className="text-xs text-stone-500 font-medium mt-0.5">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Menu — show either content or nudge */}
      {todayMenuData && todayMenuData.items.length > 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Today's Menu</p>
            <button onClick={function () { setTab("menu"); }} className="text-xs text-orange-600 font-bold">Edit →</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todayMenuData.items.map(function (item, i) { return <span key={i} className="bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-100">{item}</span>; })}
          </div>
          {todayMenuData.note && <p className="text-xs text-stone-400 mt-2">📝 {todayMenuData.note}</p>}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Today's Menu</p>
            <p className="text-sm font-bold text-stone-700 mt-0.5">Not planned yet</p>
          </div>
          <button onClick={function() { setTab("menu"); }} className="text-xs font-black text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl">Plan →</button>
        </div>
      )}

      {/* Payments summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">This Month</p>
            <p className="text-2xl font-black text-stone-800 mt-1">{fmt(payStats.collected)}</p>
            <p className="text-xs text-stone-400">of {fmt(payStats.due)}</p>
          </div>
          <div className="flex gap-2">
            <div className="text-center bg-green-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-green-700">{payStats.nPaid}</div><div className="text-xs text-green-600 font-bold">Paid</div></div>
            <div className="text-center bg-red-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-red-700">{payStats.nUnpaid}</div><div className="text-xs text-red-600 font-bold">Unpaid</div></div>
          </div>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: payStats.pct + "%" }}></div>
        </div>
        <p className="text-xs text-stone-400 mt-1 mb-3">{payStats.pct}% · {fmt(payStats.due - payStats.collected)} pending</p>
        {payStats.due - payStats.collected > 0 ? (
          <button onClick={function () { setTab("payments"); }} className="w-full py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-bold">Manage Payments →</button>
        ) : (
          <div className="w-full py-2 text-center text-green-600 text-sm font-bold bg-green-50 rounded-xl">✅ All payments collected!</div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="space-y-2">
          {actions.map(function (a) {
            return (
              <button key={a.label} onClick={a.fn} className={"w-full flex items-center gap-3 px-4 py-3 " + a.cls + " rounded-xl text-sm font-semibold"}>
                <span>{a.icon}</span>{a.label}{a.destructive && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">⚠</span>}<span className="ml-auto opacity-40">→</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Summary — hidden when 0 customers */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <p className="font-bold text-stone-700 text-sm mb-2">💬 WhatsApp Summary</p>
          <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 font-mono whitespace-pre-wrap border border-stone-200">{summaryMsg}</div>
          <button
            onClick={handleCopy}
            aria-label="Copy WhatsApp delivery summary to clipboard"
            className={"mt-3 w-full py-3 rounded-xl text-sm font-black text-white " + (copyErr ? "bg-red-500" : "bg-green-500")}
          >
            {copyErr ? "⚠ Copy failed — please copy manually" : (copied ? "✓ Copied!" : "Copy Message")}
          </button>
        </div>
      )}
    </div>
  );
}
