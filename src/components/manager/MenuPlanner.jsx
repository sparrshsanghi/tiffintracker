import { useState, useMemo } from "react";
import {
  DAYS, TODAY_IDX, THIS_WEEK, INP, emptyWeek,
  weekDates, weekRange
} from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// MENU PLANNER
// ══════════════════════════════════════════════════════════════════════════════
export function MenuPlanner(props) {
  var menu = props.menu, setMenuWeek = props.setMenuWeek;
  var curWeek    = useState(THIS_WEEK);
  var editDay    = useState(null);
  var editItems  = useState("");
  var editNote   = useState("");
  var toast      = useState("");
  // Unpack useState pairs
  var wk=curWeek[0], setWk=curWeek[1];
  var ed=editDay[0], setEd=editDay[1];
  var ei=editItems[0], setEi=editItems[1];
  var en=editNote[0], setEn=editNote[1];
  var tk=toast[0], setTk=toast[1];

  var dates    = weekDates(wk);
  var weekData = menu[wk] || emptyWeek();
  var isCur    = wk === THIS_WEEK;

  function showToast(msg) { setTk(msg); setTimeout(function(){setTk("");}, 2500); }

  function openEdit(i) {
    var day = weekData[i] || {items:[],note:""};
    setEd(i); setEi(day.items.join("\n")); setEn(day.note||"");
  }

  function saveEdit() {
    var items = ei.split("\n").map(function(s){return s.trim();}).filter(function(s){return s.length>0;});
    var updated = weekData.map(function(d,i){ return i===ed ? {items:items,note:en.trim()} : d; });
    setMenuWeek(wk, updated);
    setEd(null);
    showToast("Saved!");
  }

  function clearDay(i) {
    var updated = weekData.map(function(d,idx){ return idx===i ? {items:[],note:""} : d; });
    setMenuWeek(wk, updated);
  }

  function copyLastWeek() {
    // Compute the Monday of the previous week relative to current wk
    var d = new Date(wk);
    d.setDate(d.getDate() - 7);
    var prev = d.toISOString().slice(0, 10);
    var prevData = menu[prev];
    if (!prevData) { showToast("No menu found for last week"); return; }
    setMenuWeek(wk, prevData.map(function(d) { return { items: d.items.slice(), note: d.note }; }));
    showToast("Copied from last week!");
  }

  // Memoize WhatsApp message — only rebuild when week data changes
  var waMsg = useMemo(function() {
    var msg = "\uD83C\uDF71 *Weekly Menu*\n\uD83D\uDCC5 " + weekRange(wk) + "\n\n";
    dates.forEach(function(date, i) {
      var day = weekData[i] || { items: [], note: "" };
      var dLbl = new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      msg += "*" + DAYS[i] + " (" + dLbl + ")*\n";
      msg += day.items.length > 0 ? day.items.map(function(x) { return "\u2022 " + x; }).join("\n") : "\u2022 (Not planned)";
      if (day.note) msg += "\n\uD83D\uDCDD " + day.note;
      msg += "\n\n";
    });
    return msg.trim();
  }, [wk, weekData, dates]);

  var filled = weekData.filter(function(d){return d&&d.items.length>0;}).length;

  return (
    <div className="space-y-4">
      {tk ? <div className="bg-green-600 text-white text-sm font-bold text-center py-2.5 rounded-2xl">{tk}</div> : null}

      <div className="mgr-card p-4">
        <div className="flex items-center justify-between">
          <button onClick={function(){setWk(function(w){var d=new Date(w);d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);});setEd(null);}}
            aria-label="Previous week"
            className="w-10 h-10 rounded-xl bg-secondary text-foreground font-black text-xl hover:bg-accent flex items-center justify-center mgr-press">&#8249;</button>
          <div className="text-center">
            <p className="font-black text-foreground text-sm">{weekRange(wk)}</p>
            {isCur && <span className="text-xs text-primary font-bold">Current Week</span>}
          </div>
          <button onClick={function(){setWk(function(w){var d=new Date(w);d.setDate(d.getDate()+7);return d.toISOString().slice(0,10);});setEd(null);}}
            aria-label="Next week"
            className="w-10 h-10 rounded-xl bg-secondary text-foreground font-black text-xl hover:bg-accent flex items-center justify-center mgr-press">&#8250;</button>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Menu planned</span><span>{filled}/7 days</span></div>
          <div className="mgr-track h-1.5">
            <div className="mgr-fill transition-all" style={{width:Math.round(filled/7*100)+"%"}}></div>
          </div>
        </div>
      </div>

      {dates.map(function(date,i){
        var isToday = isCur && i===TODAY_IDX;
        var day = weekData[i] || {items:[],note:""};
        var isEditing = ed===i;
        var hasItems = day.items.length>0;
        var dLabel = new Date(date).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
        return (
          <div key={date} className={"mgr-card overflow-hidden " + (isToday ? "border-l-4 border-l-primary" : "")}>
            {isToday && <div className="h-1 bg-orange-500"></div>}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-stone-800">{DAYS[i]}</p>
                    {isToday && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">Today</span>}
                  </div>
                  <p className="text-xs text-stone-400">{dLabel}</p>
                </div>
                {!isEditing && (
                  <div className="flex gap-1.5">
                    {hasItems && <button onClick={function(){clearDay(i);}} aria-label="Clear menu for day" className="text-xs font-bold text-destructive bg-[oklch(0.97_0.03_27)] px-2 py-1 rounded-lg mgr-press">&#10005;</button>}
                    <button onClick={function(){openEdit(i);}} className="text-xs font-bold text-primary bg-accent px-3 py-1.5 rounded-lg hover:bg-accent/80 mgr-press">{hasItems?"Edit":"+ Add"}</button>
                  </div>
                )}
              </div>
              {!isEditing && (
                hasItems ? (
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {day.items.map(function(item,j){
                        return <span key={j} className="bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-100">{item}</span>;
                      })}
                    </div>
                    {day.note && <p className="text-xs text-stone-400 mt-2">📝 {day.note}</p>}
                  </div>
                ) : <p className="text-xs text-stone-400 italic">No menu planned — tap + Add</p>
              )}
              {isEditing && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Items — one per line</label>
                    <textarea className={INP + " resize-none mt-1"} rows={5}
                      placeholder={"Dal Tadka\nRice\nRoti x4\nAloo Gobi"}
                      value={ei} onChange={function(e){setEi(e.target.value);}}></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Note (optional)</label>
                    <input className={INP + " mt-1"} placeholder="e.g. Special sweet today" value={en} onChange={function(e){setEn(e.target.value);}}/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={function(){setEd(null);}} className="flex-1 py-2.5 border-2 border-stone-200 rounded-xl text-stone-500 font-bold text-sm">Cancel</button>
                    <button onClick={saveEdit} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-black text-sm">Save</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="space-y-2 pt-2">
        <a
          href={props.whatsappGroup ? props.whatsappGroup : ("https://wa.me/?text=" + encodeURIComponent(waMsg))}
          target="_blank"
          rel="noreferrer"
          aria-label={filled === 0 ? "Share menu (week not planned yet)" : "Share this week's menu on WhatsApp"}
          className={"flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-black shadow-sm " + (filled === 0 ? "bg-stone-200 text-stone-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700")}
          onClick={function(e) {
            if (filled === 0) { e.preventDefault(); showToast("Plan at least one day before sharing."); return; }
            if (props.whatsappGroup) {
              navigator.clipboard && navigator.clipboard.writeText(waMsg);
              showToast("Menu copied! Paste it in your WhatsApp group.");
            }
          }}
        >
          Share Weekly Menu on WhatsApp
        </a>
        <button onClick={copyLastWeek} className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl text-sm font-bold hover:bg-blue-100">
          Copy Menu from Last Week
        </button>
      </div>
    </div>
  );
}
