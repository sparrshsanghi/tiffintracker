import { INP } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMER FORM MODAL
// ══════════════════════════════════════════════════════════════════════════════
export function CustomerFormModal({
  showForm,
  setShowForm,
  editId,
  form,
  setForm,
  save
}) {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={function(e){if(e.target===e.currentTarget)setShowForm(false);}}>
      <div className="bg-white rounded-t-3xl p-5 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-lg font-black text-stone-800 mb-4">{editId?"✏️ Edit Customer":"➕ New Customer"}</h2>
        <div className="space-y-3">
          {[
            {k:"name",   l:"Name *",          p:"Full name",               m:"text"},
            {k:"phone",  l:"Phone",            p:"10-digit mobile",         m:"numeric"},
            {k:"address",l:"Address",          p:"Delivery address",        m:"text"},
            {k:"group",  l:"Building / Group", p:"e.g. Tower A, Tech Park", m:"text"},
            {k:"food",   l:"Food Order",       p:"e.g. Veg Thali, Dal Rice",m:"text"},
            {k:"rate",   l:"Monthly Rate (₹)", p:"e.g. 2500",             m:"numeric"},
            {k:"deliveryOrder", l:"Delivery Sequence", p:"e.g. 1, 2, 3...", m:"numeric"},
          ].map(function(f){
            return (
              <div key={f.k}>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">{f.l}</label>
                <input className={INP+" mt-1"} placeholder={f.p} inputMode={f.m} value={form[f.k]}
                  onChange={function(e){var v=e.target.value;setForm(function(p){var n=Object.assign({},p);n[f.k]=v;return n;});}}/>
              </div>
            );
          })}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Plan Type</label>
            <div className="flex gap-2 mt-1">
              {["daily","monthly"].map(function(pl){
                return (
                  <button key={pl} onClick={function(){setForm(function(p){return Object.assign({},p,{plan:pl});});}}
                    className={"flex-1 py-3 rounded-xl text-sm font-black border-2 transition-colors " + (form.plan===pl?(pl==="daily"?"bg-blue-600 text-white border-blue-600":"bg-purple-600 text-white border-purple-600"):"bg-white text-stone-400 border-stone-200")}>
                    {pl==="daily"?"🔄 Daily":"📅 Monthly"}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Pause Delivery?</label>
            <select className={INP+" mt-1"} value={form.paused ? "yes" : "no"} onChange={e => setForm(p => Object.assign({}, p, {paused: e.target.value === "yes"}))}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          {form.paused && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">From Date</label>
                <input type="date" className={INP+" mt-1"} value={form.pauseFrom} onChange={e => setForm(p => Object.assign({}, p, {pauseFrom: e.target.value}))} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">To Date</label>
                <input type="date" className={INP+" mt-1"} value={form.pauseTo} onChange={e => setForm(p => Object.assign({}, p, {pauseTo: e.target.value}))} />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={function(){setShowForm(false);}} className="flex-1 py-3.5 border-2 border-stone-200 rounded-2xl text-stone-600 font-bold">Cancel</button>
          <button onClick={save} className="flex-1 py-3.5 bg-orange-600 text-white rounded-2xl font-black disabled:opacity-40">{editId?"Save Changes":"Add Customer"}</button>
        </div>
      </div>
    </div>
  );
}
