// ─── Date helpers ─────────────────────────────────────────────────────────────
export const TODAY     = new Date().toISOString().slice(0, 10);
export const CUR_MON   = TODAY.slice(0, 7);
export const TODAY_STR = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
export const DATE_STR  = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
export const TODAY_IDX = (new Date().getDay() + 6) % 7;   // 0 = Mon ... 6 = Sun
export const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export function getMonday(offset) {
  var d = new Date(), day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1) + (offset || 0) * 7);
  return d.toISOString().slice(0, 10);
}
export function weekDates(monday) {
  return [0,1,2,3,4,5,6].map(function(i) {
    var d = new Date(monday); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10);
  });
}
export function weekRange(monday) {
  var ds = weekDates(monday);
  return new Date(ds[0]).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) + " - " +
         new Date(ds[6]).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}
export function monLabel(YYYYMM) {
  var d = new Date(YYYYMM + "-01");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
export function prevMon(key) {
  var p = key.split("-"), d = new Date(+p[0], +p[1]-2, 1);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}
export function nextMon(key) {
  var p = key.split("-"), d = new Date(+p[0], +p[1], 1);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}

export var THIS_WEEK = getMonday(0);

// ─── Formatters ───────────────────────────────────────────────────────────────
export var fmt = function(n) { return "\u20B9" + Number(n).toLocaleString("en-IN"); };
export var waTo = function(ph, txt) { return "https://wa.me/91" + ph + "?text=" + encodeURIComponent(txt); };

// ─── Data helpers ─────────────────────────────────────────────────────────────
export var makeOrders = function(cs) { return cs.filter(function(c){return c.active;}).map(function(c){return {id:c.id,status:"pending"};}); };
export var emptyWeek = function() { return [0,1,2,3,4,5,6].map(function(){return {items:[],note:""};});};

// ─── Status config ────────────────────────────────────────────────────────────
export var DST = {
  pending:   { label:"Pending",          badge:"bg-amber-100 text-amber-800", bar:"bg-amber-400",  next:"out"       },
  out:       { label:"Out for Delivery", badge:"bg-blue-100 text-blue-800",   bar:"bg-blue-400",   next:"delivered" },
  delivered: { label:"Delivered",        badge:"bg-green-100 text-green-800", bar:"bg-green-400",  next:null        },
};
export var PST = {
  paid:    { label:"Paid",     cls:"bg-green-100 text-green-800" },
  partial: { label:"Partial",  cls:"bg-amber-100 text-amber-800" },
  unpaid:  { label:"Unpaid",   cls:"bg-red-100 text-red-700"     },
};

// ─── UI constants ─────────────────────────────────────────────────────────────
export var INP = "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50";
