import { DST, waTo } from "./managerUtils.js";
import { getDefaultFood } from "../customer/customerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// DELIVERY TAB
// ══════════════════════════════════════════════════════════════════════════════
export function DeliveryTab({
  orders,
  customers,
  onResetDay,
  advanceStatus
}) {
  const allDelivered = orders.length > 0 && orders.every(function(o) { return o.status === "delivered"; });

  function statusMsg(order) {
    if (order.status === "delivered") return "delivered ✅";
    if (order.status === "out")       return "on the way 🚴";
    return "getting ready 🍱";
  }

  function fmtTimestamp(ts) {
    if (!ts) return null;
    try {
      var d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (e) { return null; }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-stone-600">{orders.length} deliver{orders.length !== 1 ? "ies" : "y"} today</p>
        <button
          onClick={onResetDay}
          className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full"
          aria-label="Reset all delivery statuses to pending"
        >
          ⚠ Reset Day
        </button>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="font-black text-stone-700">No deliveries today</p>
          <p className="text-sm text-stone-400 mt-1">All active customers are paused or none exist.</p>
        </div>
      )}

      {/* All-done celebration */}
      {allDelivered && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">🎉</div>
          <p className="font-black text-green-800">All Delivered!</p>
          <p className="text-sm text-green-600 mt-0.5">Every customer's tiffin has been delivered today.</p>
        </div>
      )}

      {orders.map(function (order) {
        var c = customers.find(function (x) { return x.id === order.id; });
        if (!c) return null;
        var st = DST[order.status];
        var time = fmtTimestamp(order.updatedAt);
        return (
          <div key={order.id} className={"bg-white rounded-2xl shadow-sm border overflow-hidden " + (order.status === "delivered" ? "border-green-200" : "border-stone-100")}>
            <div className={"h-1.5 " + st.bar}></div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <p className="font-black text-stone-800 text-base">{c.name}</p>
                  <p className="text-xs text-stone-500 mt-1">📍 {c.address}</p>
                  <p className="text-xs text-stone-500 mt-0.5">🍴 {getDefaultFood(c.food)}</p>
                  {time && <p className="text-xs text-stone-400 mt-0.5">🕐 Updated {time}</p>}
                </div>
                <span className={"text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 " + st.badge}>{st.label}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {st.next && (
                  <button
                    onClick={function () { advanceStatus(order.id); }}
                    className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-black"
                    aria-label={"Mark " + c.name + " as " + DST[st.next].label}
                  >
                    Mark → {DST[st.next].label}
                  </button>
                )}
                <a
                  href={waTo(c.phone, "Hi " + c.name + "! Your tiffin is " + statusMsg(order) + " — thank you! 🙏")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={"Send WhatsApp to " + c.name}
                  className={"py-2.5 px-4 bg-green-500 text-white rounded-xl text-sm font-black flex items-center gap-1.5 " + (st.next ? "" : "flex-1 justify-center")}
                >
                  💬 WhatsApp
                </a>
              </div>
              {!st.next && <p className="mt-2 text-center text-green-600 text-sm font-bold">✓ Delivered</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
