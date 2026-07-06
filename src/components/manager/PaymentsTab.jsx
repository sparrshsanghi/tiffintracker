import { useState } from "react";
import { prevMon, nextMon, monLabel, fmt, PST, waTo } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS TAB
// ══════════════════════════════════════════════════════════════════════════════
export function PaymentsTab({
  payMonth,
  setPayMonth,
  curMonth,
  pmStats,
  payFilter,
  setPayFilter,
  payC,
  getPaid,
  getPayStat,
  payments,
  confirmFull,
  confirmPartial,
  removePayment,
  showPart,
  setShowPart,
  payAmt,
  setPayAmt
}) {
  // removeConfirm: { cid, pid } — the payment record pending removal confirmation
  const [removeConfirm, setRemoveConfirm] = useState(null);
  // partialErr: { cid, msg } — inline validation error for partial amount
  const [partialErr, setPartialErr] = useState(null);

  function handlePartialSave(cid, remaining) {
    var val = parseFloat(payAmt[cid]);
    if (!payAmt[cid] || isNaN(val) || val <= 0) {
      setPartialErr({ cid, msg: "Please enter a valid amount." });
      return;
    }
    if (val > remaining) {
      setPartialErr({ cid, msg: "Amount exceeds balance of " + fmt(remaining) + "." });
      return;
    }
    setPartialErr(null);
    confirmPartial(cid);
  }

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={function () { setPayMonth(prevMon(payMonth)); }}
            className="w-10 h-10 rounded-xl bg-stone-50 text-stone-600 font-black text-xl flex items-center justify-center"
            aria-label="Previous month"
          >
            &#8249;
          </button>
          <div className="text-center">
            <p className="font-black text-stone-800">{monLabel(payMonth)}</p>
            {payMonth === curMonth && <span className="text-xs text-orange-600 font-bold">Current Month</span>}
          </div>
          <button
            onClick={function () { if (payMonth < curMonth) setPayMonth(nextMon(payMonth)); }}
            disabled={payMonth >= curMonth}
            className={"w-10 h-10 rounded-xl font-black text-xl flex items-center justify-center " + (payMonth >= curMonth ? "bg-stone-100 text-stone-300 cursor-not-allowed" : "bg-stone-50 text-stone-600")}
            aria-label={payMonth >= curMonth ? "No future months" : "Next month"}
          >
            &#8250;
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-end justify-between">
          <div><p className="text-3xl font-black text-stone-800">{fmt(pmStats.col)}</p><p className="text-xs text-stone-400">of {fmt(pmStats.due)}</p></div>
          <div className="flex gap-2">
            <div className="text-center bg-green-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-green-700">{pmStats.nP}</div><div className="text-xs text-green-600 font-bold">Paid</div></div>
            {pmStats.nPart > 0 && <div className="text-center bg-amber-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-amber-700">{pmStats.nPart}</div><div className="text-xs text-amber-600 font-bold">Part</div></div>}
            <div className="text-center bg-red-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-red-700">{pmStats.nU}</div><div className="text-xs text-red-600 font-bold">Unpaid</div></div>
          </div>
        </div>
        <div className="mt-3 h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: pmStats.pct + "%" }}></div>
        </div>
        <p className="text-xs text-stone-400 mt-1 text-right">{pmStats.pct}% · {fmt(pmStats.due - pmStats.col)} remaining</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2" role="group" aria-label="Payment filter">
        {["all", "unpaid", "partial", "paid"].map(function (f) {
          var label = f.charAt(0).toUpperCase() + f.slice(1);
          return (
            <button
              key={f}
              onClick={function () { setPayFilter(f); }}
              className={"flex-1 py-2 rounded-xl text-xs font-bold " + (payFilter === f ? "bg-orange-600 text-white" : "bg-white text-stone-500 border border-stone-200")}
              aria-pressed={payFilter === f}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Empty filtered state */}
      {payC.length === 0 && (
        <div className="text-center py-10 text-stone-400">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-bold text-stone-600">No customers in this filter</p>
        </div>
      )}

      {payC.map(function (c) {
        var paid = getPaid(c.id, payMonth);
        var remaining = Math.max(0, c.rate - paid);
        var pst = PST[getPayStat(c.id, payMonth, c.rate)] || PST.unpaid;
        var records = payments[c.id + "-" + payMonth] || [];
        var isCur = payMonth === curMonth;
        return (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-stone-800 text-base">{c.name}</p>
                  <p className="text-xs text-stone-400">{c.plan} · {fmt(c.rate)}/month</p>
                </div>
                <span className={"text-xs px-2.5 py-1 rounded-full font-black " + pst.cls}>{pst.label}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-stone-600">Paid: {fmt(paid)}</span>
                  {remaining > 0 && <span className="font-bold text-red-500">Due: {fmt(remaining)}</span>}
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: Math.min(100, Math.round(paid / c.rate * 100)) + "%" }}></div>
                </div>
              </div>

              {/* Payment records */}
              {records.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {records.map(function (r) {
                    var isConfirmingRemove = removeConfirm && removeConfirm.cid === c.id && removeConfirm.pid === r.id;
                    return (
                      <div key={r.id} className={"flex justify-between items-center rounded-xl px-3 py-2.5 border " + (r.confirmed ? "bg-green-50 border-green-100" : "bg-stone-50 border-stone-100")}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-700">{fmt(r.amount)}</span>
                          {r.confirmed
                            ? <span className="text-xs text-green-600 font-bold">✓ Confirmed</span>
                            : <span className="text-xs text-stone-400">Unconfirmed</span>
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-400">{r.date}</span>
                          {isCur && !isConfirmingRemove && (
                            <button
                              onClick={function () { setRemoveConfirm({ cid: c.id, pid: r.id }); }}
                              className="text-xs text-red-500 font-bold bg-red-50 border border-red-100 px-2 py-1 rounded-lg"
                              aria-label={"Remove payment of " + fmt(r.amount)}
                            >
                              Remove
                            </button>
                          )}
                          {isCur && isConfirmingRemove && (
                            <div className="flex gap-1">
                              <button
                                onClick={function () { setRemoveConfirm(null); }}
                                className="text-xs text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded-lg"
                              >
                                Keep
                              </button>
                              <button
                                onClick={function () { removePayment(c.id, r.id); setRemoveConfirm(null); }}
                                className="text-xs text-white font-bold bg-red-600 px-2 py-1 rounded-lg"
                                aria-label="Confirm remove payment"
                              >
                                Confirm
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment actions */}
              {isCur && remaining > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={function () { confirmFull(c.id); }}
                      className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-black"
                      aria-label={"Confirm full payment of " + fmt(remaining) + " for " + c.name}
                    >
                      ✓ Confirm · {fmt(remaining)}
                    </button>
                    <button
                      onClick={function () { setShowPart(function (p) { var n = Object.assign({}, p); n[c.id] = !p[c.id]; return n; }); setPartialErr(null); }}
                      className="px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold"
                    >
                      Partial
                    </button>
                  </div>
                  {showPart[c.id] && (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-stone-50"
                          placeholder={"Amount (max " + fmt(remaining) + ")"}
                          inputMode="numeric"
                          aria-label={"Partial payment amount for " + c.name}
                          value={payAmt[c.id] || ""}
                          onChange={function (e) {
                            var v = e.target.value;
                            setPayAmt(function (p) { var n = Object.assign({}, p); n[c.id] = v; return n; });
                            if (partialErr && partialErr.cid === c.id) setPartialErr(null);
                          }}
                        />
                        <button
                          onClick={function () { handlePartialSave(c.id, remaining); }}
                          className="px-5 bg-green-600 text-white rounded-xl text-sm font-black"
                          aria-label={"Save partial payment for " + c.name}
                        >
                          Save
                        </button>
                      </div>
                      {partialErr && partialErr.cid === c.id && (
                        <p className="text-xs text-red-600 font-semibold" role="alert">{partialErr.msg}</p>
                      )}
                    </div>
                  )}
                  <a
                    href={waTo(c.phone, "Hi " + c.name + " ji! 🙏\nGentle reminder — payment of " + fmt(remaining) + " for " + monLabel(payMonth) + " is pending.\nPlease pay when convenient. Thank you!")}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={"Send payment reminder to " + c.name + " on WhatsApp"}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-600"
                  >
                    💬 Send Reminder on WhatsApp
                  </a>
                </div>
              )}
              {remaining <= 0 && paid > 0 && (
                <div className="mt-3 py-2 text-center text-green-600 text-sm font-black bg-green-50 rounded-xl">✅ Fully paid · Customer notified</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
