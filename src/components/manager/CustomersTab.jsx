import { useState } from "react";
import { getDefaultFood } from "../customer/customerUtils.js";
import { INP, fmt, waTo, TODAY } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS TAB
// ══════════════════════════════════════════════════════════════════════════════
export function CustomersTab({
  customers,
  openAdd,
  openEdit,
  togglePause,
  setDelConfirm
}) {
  const [search, setSearch] = useState("");
  // pauseTarget: { c, pauseFrom, pauseTo } — the customer being paused inline
  const [pauseTarget, setPauseTarget] = useState(null);

  const filteredC = customers.filter(function (c) {
    var q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(search) || c.address.toLowerCase().includes(q);
  });

  var groups = {
    "Monthly - Jain": [],
    "Monthly - Normal": [],
    "Daily - Jain": [],
    "Daily - Normal": [],
  };

  filteredC.forEach(function (c) {
    var plan = c.plan === "monthly" ? "Monthly" : "Daily";
    var foodType = (c.food || "").toLowerCase().includes("jain") ? "Jain" : "Normal";
    var groupName = plan + " - " + foodType;
    if (groups[groupName]) groups[groupName].push(c);
  });

  const hasAnyGroup = Object.values(groups).some(function(g) { return g.length > 0; });

  function handlePauseClick(c) {
    if (c.active !== false && !c.paused) {
      // Open inline pause panel for this customer
      setPauseTarget({ c, pauseFrom: TODAY.split("T")[0], pauseTo: "" });
    } else {
      // Resume immediately
      togglePause(c, "", "");
    }
  }

  function commitPause() {
    if (!pauseTarget) return;
    togglePause(pauseTarget.c, pauseTarget.pauseFrom, pauseTarget.pauseTo);
    setPauseTarget(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-bold text-stone-600">{customers.length} customer{customers.length !== 1 ? "s" : ""}</p>
        <button onClick={openAdd} className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-black">+ Add</button>
      </div>
      <input className={INP + " mb-2"} placeholder="🔍 Search by name, phone, address…" value={search} onChange={function (e) { setSearch(e.target.value); }} />

      {/* Pause inline panel */}
      {pauseTarget && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-black text-amber-800">Pause {pauseTarget.c.name}</p>
          <p className="text-xs text-amber-700">Set an optional auto-resume date. Leave blank to pause indefinitely.</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-bold text-stone-500 uppercase">From</label>
              <input type="date" className={INP + " mt-1"} value={pauseTarget.pauseFrom}
                onChange={function(e) {
                  var v = e.target.value;
                  setPauseTarget(function(p) { return Object.assign({}, p, { pauseFrom: v }); });
                }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Resume on</label>
              <input type="date" className={INP + " mt-1"} value={pauseTarget.pauseTo}
                onChange={function(e) {
                  var v = e.target.value;
                  setPauseTarget(function(p) { return Object.assign({}, p, { pauseTo: v }); });
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={function() { setPauseTarget(null); }} className="flex-1 py-2.5 border-2 border-stone-200 rounded-xl text-stone-600 font-bold text-sm">Cancel</button>
            <button onClick={commitPause} className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-black text-sm">Confirm Pause</button>
          </div>
        </div>
      )}

      {/* No customers at all */}
      {customers.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">👥</div>
          <p className="font-black text-stone-700 text-base">No customers yet</p>
          <p className="text-sm text-stone-400 mt-1 mb-4">Add your first customer to get started.</p>
          <button onClick={openAdd} className="bg-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-black">+ Add Customer</button>
        </div>
      )}

      {/* Search returned nothing */}
      {customers.length > 0 && search.trim() !== "" && !hasAnyGroup && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-black text-stone-700">No results for "{search}"</p>
          <p className="text-sm text-stone-400 mt-1">Try searching by name, phone, or address.</p>
        </div>
      )}

      {Object.keys(groups).map(function (gName) {
        var cList = groups[gName];
        if (cList.length === 0) return null;
        return (
          <div key={gName} className="mt-6 first:mt-2">
            <h3 className="text-xs font-black text-stone-400 tracking-wider uppercase mb-3 flex items-center gap-2">
              {gName.includes("Jain") ? "🌿" : "🍛"} {gName} <span className="bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">{cList.length}</span>
            </h3>
            <div className="space-y-3">
              {cList.map(function (c) {
                const hasNoRate = !c.rate || c.rate <= 0;
                return (
                  <div key={c.id} className={"bg-white rounded-2xl p-4 shadow-sm border " + (hasNoRate ? "border-amber-200" : (c.active ? "border-stone-100" : "border-stone-200 opacity-60"))}>
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-black text-stone-800">{c.name}</p>
                          {c.group && <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">🏢 {c.group}</span>}
                          {(c.active === false || c.paused) && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-100">⏸ Paused{c.pauseTo ? " until " + c.pauseTo : ""}</span>}
                        </div>
                        <p className="text-xs text-stone-500 mt-1.5">📞 {c.phone} &middot; 📍 {c.address}</p>
                        <p className="text-xs font-medium text-stone-600 mt-0.5">🍴 {getDefaultFood(c.food)}</p>
                        {hasNoRate
                          ? <p className="text-xs text-amber-600 font-semibold mt-1.5">⚠️ No rate set — set rate to track payments</p>
                          : <p className="text-xs text-orange-600 font-bold mt-1.5">💰 {fmt(c.rate)}/month</p>
                        }
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={function () { openEdit(c); }} className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100" aria-label={"Edit " + c.name}>Edit</button>
                        <button
                          onClick={function () { handlePauseClick(c); }}
                          className={"text-xs font-bold px-2.5 py-1.5 rounded-lg border " + ((c.active !== false && !c.paused) ? "text-amber-600 bg-amber-50 border-amber-100" : "text-green-600 bg-green-50 border-green-100")}
                          aria-label={(c.active !== false && !c.paused) ? "Pause " + c.name : "Resume " + c.name}
                        >
                          {(c.active !== false && !c.paused) ? "Pause" : "Resume"}
                        </button>
                        <button onClick={function () { setDelConfirm(c.id); }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg border text-red-500 bg-red-50 border-red-100" aria-label={"Delete " + c.name}>Delete</button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-stone-50">
                      <a href={"tel:+91" + c.phone} className="flex-1 text-center py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-600" aria-label={"Call " + c.name}>📞 Call</a>
                      <a href={waTo(c.phone, "Hi " + c.name + "!")} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-600" aria-label={"WhatsApp " + c.name}>💬 WhatsApp</a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
