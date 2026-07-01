import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin, Package, CheckCircle2, ChevronDown, ChevronUp,
  Phone, Bell, CreditCard, Home, Building2, UtensilsCrossed,
  Users, AlertCircle, Bike, BriefcaseBusiness
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  runTransaction,
  writeBatch,
  getDocs,
  getDoc
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";
import { DeliveryView, CustomerView, BrandLogo } from "./src/Views.jsx";

const firebaseConfig = {
  apiKey: "AIzaSyCcnx83mNfBNEuFX8GYVHehfO3veuKvSa8",
  authDomain: "maa-sharda-sns.firebaseapp.com",
  projectId: "maa-sharda-sns",
  storageBucket: "maa-sharda-sns.firebasestorage.app",
  messagingSenderId: "662147715598",
  appId: "1:662147715598:web:b369234e7a03e55657225f",
  measurementId: "G-8LZVBYVVX0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const BUSINESS_ID = "default";

// Browser-compatible SHA-256 hash helper
async function hashPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(pin));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const TODAY     = new Date().toISOString().slice(0, 10);
const CUR_MON   = TODAY.slice(0, 7);
const TODAY_STR = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
const DATE_STR  = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const TODAY_IDX = (new Date().getDay() + 6) % 7;   // 0 = Mon … 6 = Sun
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function getMonday(offset) {
  var d = new Date(), day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1) + (offset || 0) * 7);
  return d.toISOString().slice(0, 10);
}
function weekDates(monday) {
  return [0,1,2,3,4,5,6].map(function(i) {
    var d = new Date(monday); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10);
  });
}
function weekRange(monday) {
  var ds = weekDates(monday);
  return new Date(ds[0]).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) + " – " +
         new Date(ds[6]).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}
function monLabel(YYYYMM) {
  var d = new Date(YYYYMM + "-01");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getDefaultFood(customFood) {
  if (customFood && customFood.trim().length > 0) return customFood;
  const d = new Date();
  const isSunday = d.getDay() === 0;
  const isNoon = d.getHours() < 16;
  if (isSunday && isNoon) return "Special (Pav Bhaji / Biryani)";
  return "Roti, Rice, Daal";
}

function prevMon(key) {
  var p = key.split("-"), d = new Date(+p[0], +p[1]-2, 1);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}
function nextMon(key) {
  var p = key.split("-"), d = new Date(+p[0], +p[1], 1);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}

var THIS_WEEK = getMonday(0);
var fmt = function(n) { return "\u20B9" + Number(n).toLocaleString("en-IN"); };
var waTo = function(ph, txt) { return "https://wa.me/91" + ph + "?text=" + encodeURIComponent(txt); };
var makeOrders = function(cs) { return cs.filter(function(c){return c.active;}).map(function(c){return {id:c.id,status:"pending"};}); };
var emptyWeek = function() { return [0,1,2,3,4,5,6].map(function(){return {items:[],note:""};});};

// ─── Status config ────────────────────────────────────────────────────────────
var DST = {
  pending:   { label:"Pending",          badge:"bg-amber-100 text-amber-800", bar:"bg-amber-400",  next:"out"       },
  out:       { label:"Out for Delivery", badge:"bg-blue-100 text-blue-800",   bar:"bg-blue-400",   next:"delivered" },
  delivered: { label:"Delivered",        badge:"bg-green-100 text-green-800", bar:"bg-green-400",  next:null        },
};
var PST = {
  paid:    { label:"Paid \u2713",  cls:"bg-green-100 text-green-800" },
  partial: { label:"Partial", cls:"bg-amber-100 text-amber-800" },
  unpaid:  { label:"Unpaid",  cls:"bg-red-100 text-red-700"     },
};

// ─── Seed data (DEV only) ─────────────────────────────────────────────────────
var SEED_C = import.meta.env.DEV ? [
  { id:"dev1", name:"Priya Sharma",  phone:"9876543210", address:"Sector 5, Near Park",   plan:"monthly", food:"Veg Thali + Roti",      rate:2500, active:true },
  { id:"dev2", name:"Rahul Verma",   phone:"9812345678", address:"MG Road, Flat 3B",      plan:"daily",   food:"Dal Chawal + Sabzi",    rate:3000, active:true },
] : [];
var SEED_P = {};
var SEED_MENU = {};

var INP = "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50";

// ══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function AuthScreen(props) {
  var icon=props.icon, title=props.title, subtitle=props.subtitle;
  var hdr=props.hdr, btn=props.btn;
  var value=props.value, onChange=props.onChange, error=props.error;
  var onBack=props.onBack, onSubmit=props.onSubmit, hint=props.hint, isPhone=props.isPhone;
  var pinInputMode = props.pinInputMode || "text";
  var disabled = props.disabled || false;
  var disabledText = props.disabledText || "Connecting...";
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col" style={{fontFamily:"system-ui,sans-serif"}}>
      <div className={hdr + " text-white px-4 pt-8 pb-6 text-center flex flex-col items-center"}>
        <BrandLogo className="w-16 h-16 mb-2" />
        <h1 className="text-2xl font-black">Maa Sharda</h1>
        <div className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold mt-1 mb-4">अब पेट भरेगा, मन नहीं</div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <p className="text-white/80 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="flex-1 p-6 max-w-sm mx-auto w-full pt-8">
        <input
          className={"w-full border-2 rounded-2xl px-4 py-4 text-xl font-bold text-center focus:outline-none " + (error ? "border-red-300 bg-red-50" : "border-stone-200 bg-white")}
          type={isPhone ? "tel" : "password"}
          inputMode={isPhone ? "numeric" : pinInputMode}
          placeholder={isPhone ? "10-digit phone" : "Enter PIN"}
          value={value}
          onChange={function(e){onChange(e.target.value);}}
          onKeyDown={function(e){if(e.key==="Enter")onSubmit();}}
          maxLength={isPhone ? 10 : 12}
          autoFocus
          disabled={disabled}
        />
        {error && <p className="text-red-500 text-sm text-center mt-2 font-semibold">{error}</p>}
        {hint  && <p className="text-stone-400 text-xs text-center mt-2">{hint}</p>}
        <button onClick={onSubmit} disabled={disabled} className={"mt-6 w-full py-4 text-white rounded-2xl font-black text-base " + (disabled ? "bg-stone-300 cursor-not-allowed" : btn)}>
          {disabled ? disabledText : "Continue →"}
        </button>
        <button onClick={onBack} className="mt-3 w-full py-3 text-stone-400 font-semibold text-sm">← Back</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MENU PLANNER
// ══════════════════════════════════════════════════════════════════════════════
function MenuPlanner(props) {
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
    var prev = getMonday(-1 + (wk===THIS_WEEK ? 0 : 0));
    // compute the actual previous week relative to wk
    var d = new Date(wk); d.setDate(d.getDate()-7); prev = d.toISOString().slice(0,10);
    var prevData = menu[prev];
    if (!prevData) { showToast("No menu found for last week"); return; }
    setMenuWeek(wk, prevData.map(function(d){return {items:d.items.slice(),note:d.note};}));
    showToast("Copied from last week!");
  }

  function buildWaMsg() {
    var msg = "\uD83C\uDF71 *Weekly Menu*\n\uD83D\uDCC5 " + weekRange(wk) + "\n\n";
    dates.forEach(function(date,i){
      var day = weekData[i] || {items:[],note:""};
      var dLbl = new Date(date).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
      msg += "*" + DAYS[i] + " (" + dLbl + ")*\n";
      msg += day.items.length>0 ? day.items.map(function(x){return "\u2022 "+x;}).join("\n") : "\u2022 (Not planned)";
      if (day.note) msg += "\n\uD83D\uDCDD " + day.note;
      msg += "\n\n";
    });
    return msg.trim();
  }

  var filled = weekData.filter(function(d){return d&&d.items.length>0;}).length;

  return (
    <div className="space-y-4">
      {tk ? <div className="bg-green-600 text-white text-sm font-bold text-center py-2.5 rounded-2xl">{tk}</div> : null}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between">
          <button onClick={function(){setWk(function(w){var d=new Date(w);d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);});setEd(null);}}
            className="w-10 h-10 rounded-xl bg-stone-50 text-stone-600 font-black text-xl hover:bg-stone-100 flex items-center justify-center">&#8249;</button>
          <div className="text-center">
            <p className="font-black text-stone-800 text-sm">{weekRange(wk)}</p>
            {isCur && <span className="text-xs text-orange-600 font-bold">Current Week</span>}
          </div>
          <button onClick={function(){setWk(function(w){var d=new Date(w);d.setDate(d.getDate()+7);return d.toISOString().slice(0,10);});setEd(null);}}
            className="w-10 h-10 rounded-xl bg-stone-50 text-stone-600 font-black text-xl hover:bg-stone-100 flex items-center justify-center">&#8250;</button>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-stone-400 mb-1"><span>Menu planned</span><span>{filled}/7 days</span></div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all" style={{width:Math.round(filled/7*100)+"%"}}></div>
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
          <div key={date} className={"bg-white rounded-2xl shadow-sm border overflow-hidden " + (isToday?"border-orange-400":"border-stone-100")}>
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
                    {hasItems && <button onClick={function(){clearDay(i);}} className="text-xs font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg">&#10005;</button>}
                    <button onClick={function(){openEdit(i);}} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">{hasItems?"Edit":"+ Add"}</button>
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
        <a href={props.whatsappGroup ? props.whatsappGroup : ("https://wa.me/?text="+encodeURIComponent(buildWaMsg()))} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white rounded-2xl text-sm font-black hover:bg-green-700 shadow-sm"
          onClick={function(e){
            if (props.whatsappGroup) {
              navigator.clipboard.writeText(buildWaMsg());
              alert("Menu copied to clipboard! Paste it in your WhatsApp group.");
            }
          }}>
          Share Weekly Menu on WhatsApp
        </a>
        <button onClick={copyLastWeek} className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl text-sm font-bold hover:bg-blue-100">
          Copy Menu from Last Week
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DELIVERY VIEW
// ══════════════════════════════════════════════════════════════════════════════
function OldDeliveryView(props) {
  var orders=props.orders, customers=props.customers, advance=props.advance;
  var advanceGroup=props.advanceGroup, setRiderNext=props.setRiderNext, resetDay=props.resetDay;
  var logout=props.logout, stats=props.stats;

  var groups = {};
  var ungrouped = [];
  var totalTiffins = 0;
  orders.forEach(function(order){
    var c = customers.find(function(x){return x.id===order.id;});
    if(!c) return;
    totalTiffins++;
    var g = (c.group || "").trim();
    if(g) {
      if(!groups[g]) groups[g] = [];
      groups[g].push({order: order, customer: c});
    } else {
      ungrouped.push({order: order, customer: c});
    }
  });

  var groupKeys = Object.keys(groups).sort(function(a, b) {
    var minA = Math.min(...groups[a].map(o => (o.order.riderNextFlag ? -1000 : (o.customer.deliveryOrder || 999))));
    var minB = Math.min(...groups[b].map(o => (o.order.riderNextFlag ? -1000 : (o.customer.deliveryOrder || 999))));
    return minA - minB;
  });

  ungrouped.sort(function(a, b) {
    var oa = a.order.riderNextFlag ? -1000 : (a.customer.deliveryOrder || 999);
    var ob = b.order.riderNextFlag ? -1000 : (b.customer.deliveryOrder || 999);
    return oa - ob;
  });

  var numGroups = groupKeys.length;
  
  var groupsDelivered = 0;
  var groupsTransit = 0;
  var groupsPending = 0;
  
  groupKeys.forEach(function(g) {
    var gOrders = groups[g];
    var allDelivered = gOrders.every(function(o){ return o.order.status === "delivered"; });
    var anyTransit = gOrders.some(function(o){ return o.order.status === "out"; });
    if(allDelivered) groupsDelivered++;
    else if(anyTransit) groupsTransit++;
    else groupsPending++;
  });

  var dayName = new Date().toLocaleDateString("en-US", { weekday: 'long' }).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-10" style={{fontFamily:"'Inter', system-ui, sans-serif"}}>
      <div className="max-w-md mx-auto p-4 pt-8">
        
        {/* Header */}
        <p className="text-[11px] font-bold text-stone-400 tracking-widest">{dayName} &middot; {totalTiffins} TIFFINS &middot; {numGroups} BUILDINGS</p>
        <h1 className="text-3xl font-black text-stone-200 mt-1 mb-6">
          Group by <span className="text-amber-400">building.</span>
        </h1>
        
        {/* Summary Card */}
        <div className="bg-[#1C1C1C] rounded-[24px] p-5 flex items-center gap-5 mb-4 shadow-xl shadow-stone-200/50">
          <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
            <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
              <path className="text-stone-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-amber-400 transition-all duration-500" strokeDasharray={(numGroups>0?(groupsDelivered/numGroups)*100:0) + ", 100"} strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="text-center flex flex-col">
              <span className="text-white font-bold leading-none text-sm">{groupsDelivered}/{numGroups}</span>
              <span className="text-[9px] text-stone-400 font-semibold mt-0.5">groups</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg leading-tight mb-1">{groupsDelivered} groups delivered</h2>
            <p className="text-stone-400 text-xs mb-3">{groupsTransit} in transit &middot; {groupsPending} pending</p>
            <div className="flex gap-2">
              <span className="bg-amber-500/20 text-amber-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-amber-500/10">{stats.out} out for delivery</span>
              <span className="bg-stone-800 text-stone-400 text-[10px] font-bold px-3 py-1.5 rounded-lg">{totalTiffins} tiffins</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-stone-100 p-1.5 rounded-2xl mb-6">
          <button className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-400 flex items-center justify-center gap-2"><span className="opacity-50">&#9871;</span> Pack</button>
          <button className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-400 flex items-center justify-center gap-2"><span className="opacity-50">&#9871;</span> Dispatch</button>
          <button className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-800 bg-white shadow-sm flex items-center justify-center gap-2"><span className="text-stone-300">&#9871;</span> Route</button>
        </div>

        {/* Group Cards */}
        <div className="space-y-4">
          {groupKeys.map(function(gName, idx) {
            var gOrders = groups[gName];
            var address = gOrders[0].customer.address;
            var allDelivered = gOrders.every(function(o){ return o.order.status === "delivered"; });
            var anyTransit = gOrders.some(function(o){ return o.order.status === "out"; });
            
            var stdCount = gOrders.filter(function(o){ return (o.customer.food||"").toLowerCase().includes("standard"); }).length;
            var jainCount = gOrders.filter(function(o){ return (o.customer.food||"").toLowerCase().includes("jain"); }).length;
            var dietCount = gOrders.filter(function(o){ return (o.customer.food||"").toLowerCase().includes("diet"); }).length;
            var regularCount = gOrders.length - stdCount - jainCount - dietCount;

            var advanceIds = gOrders.filter(function(o){ return o.order.status !== "delivered"; }).map(function(o){ return o.order.id; });
            var nextAction = anyTransit ? "Deliver All \u2705" : "Pick Up \ud83d\udeb4";

            return (
              <div key={gName} className={"bg-white rounded-[24px] border border-stone-100 p-5 shadow-sm " + (allDelivered?"opacity-60 grayscale-[50%]":"")}>
                <p className="text-[10px] font-extrabold text-stone-400 tracking-wider uppercase mb-1">STOP {idx+1} OF {numGroups}</p>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-stone-800 leading-tight">{gName}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">{address}</p>
                  </div>
                  <a href={"https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(gName+" "+address)} target="_blank" rel="noreferrer" className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-lg shadow-sm border border-stone-100 active:scale-95 transition-transform" title="Navigate">\ud83d\uddfa\ufe0f</a>
                </div>
                
                {/* Stats Row */}
                <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-bold text-stone-600">
                  <span className="bg-stone-100 px-2.5 py-1.5 rounded-md flex items-center gap-1.5"><span className="text-stone-400">\ud83c\udf71</span> {gOrders.length} tiffins</span>
                  <span className="bg-stone-100 px-2.5 py-1.5 rounded-md flex items-center gap-1.5"><span className="text-stone-400">\ud83d\udc64</span> {gOrders.length}</span>
                  {stdCount > 0 && <span className="bg-stone-50 border border-stone-100 px-2.5 py-1.5 rounded-md text-stone-500">{stdCount}&times; Standard</span>}
                  {jainCount > 0 && <span className="bg-green-50 text-green-700 px-2.5 py-1.5 rounded-md">{jainCount}&times; Jain</span>}
                  {dietCount > 0 && <span className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-md">{dietCount}&times; Diet</span>}
                  {regularCount > 0 && <span className="bg-stone-50 border border-stone-100 px-2.5 py-1.5 rounded-md text-stone-500">{regularCount}&times; Regular</span>}
                </div>
                
                {/* Customers */}
                <div className="mt-5 border-t border-stone-100">
                  {gOrders.map(function(o, i) {
                     var c = o.customer;
                     var isJain = (c.food||"").toLowerCase().includes("jain");
                     var isDiet = (c.food||"").toLowerCase().includes("diet");
                     var isStd = (c.food||"").toLowerCase().includes("standard");
                     var initials = c.name.split(" ").map(function(n){return n[0];}).join("").substring(0,2).toUpperCase();
                     
                     return (
                       <div key={c.id} className={"py-3 flex items-center justify-between " + (i!==gOrders.length-1?"border-b border-stone-50":"")}>
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 font-bold text-xs flex items-center justify-center shrink-0">{initials}</div>
                           <p className="text-sm font-bold text-stone-700">{c.name}</p>
                         </div>
                         <div className="text-right">
                           <span className={"text-[10px] font-bold block " + (isJain?"text-green-700":isDiet?"text-blue-600":"text-stone-400")}>
                             1&times;<br/>{isJain?"Jain":isDiet?"Diet":isStd?"Standard":c.food||"Regular"}
                           </span>
                         </div>
                       </div>
                     );
                  })}
                </div>

                {/* Bulk Advance Button */}
                {!allDelivered && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={function(){advanceGroup(advanceIds);}} className={"flex-1 py-3 rounded-xl text-sm font-black text-white active:scale-95 transition-transform " + (anyTransit ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-amber-500 shadow-lg shadow-amber-500/20")}>
                      {nextAction}
                    </button>
                    <button onClick={function(){setRiderNext(advanceIds[0]);}} className="w-16 py-3 bg-stone-100 rounded-xl text-lg flex items-center justify-center active:scale-95 transition-transform border border-stone-200" title="Set as Next">
                      ⭐️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ungrouped */}
        {ungrouped.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-black text-stone-400 tracking-wider uppercase mb-3">Ungrouped Orders</h3>
            <div className="space-y-3">
               {ungrouped.map(function(o) {
                 var c = o.customer;
                 var isJain = (c.food||"").toLowerCase().includes("jain");
                 var isDiet = (c.food||"").toLowerCase().includes("diet");
                 var initials = c.name.split(" ").map(function(n){return n[0];}).join("").substring(0,2).toUpperCase();
                 return (
                   <div key={c.id} className="bg-white rounded-[20px] border border-stone-100 p-4 flex items-center justify-between shadow-sm">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 font-bold text-sm flex items-center justify-center shrink-0">{initials}</div>
                       <div>
                         <p className="text-sm font-bold text-stone-800">{c.name}</p>
                         <p className="text-[10px] text-stone-400 mt-0.5 font-medium max-w-[150px] truncate">{c.address}</p>
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <span className={"text-[10px] font-bold " + (isJain?"text-green-700":isDiet?"text-blue-600":"text-stone-400")}>{c.food||"Regular"}</span>
                       {o.order.status !== "delivered" ? (
                         <div className="flex gap-1.5">
                           <button onClick={function(){setRiderNext(c.id);}} className="bg-stone-100 text-stone-600 text-[10px] px-2 py-1.5 rounded-lg border border-stone-200" title="Next">⭐️</button>
                           <button onClick={function(){advance(c.id);}} className="bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">{o.order.status==="out"?"Deliver ✅":"Pick Up 🚴"}</button>
                         </div>
                       ) : (
                         <span className="text-[10px] text-green-500 font-bold">Delivered ✅</span>
                       )}
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-stone-200">
           <button onClick={logout} className="w-full py-3 text-stone-400 font-semibold text-sm">&larr; Switch Role</button>
           <button onClick={resetDay} className="w-full py-3 text-red-400 font-semibold text-sm mt-2">Reset Day (Debug)</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMER VIEW
// ══════════════════════════════════════════════════════════════════════════════
function OldCustomerView(props) {
  var customer=props.customer, order=props.order, paid=props.paid;
  var payStatus=props.payStatus, notifs=props.notifs, onRead=props.onRead;
  var curMonLabel=props.curMonLabel, logout=props.logout;
  var todayMenu=props.todayMenu, weekMenu=props.weekMenu;

  var tabState = useState("home");
  var tab = tabState[0], setTab = tabState[1];

  if (!customer) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center" style={{fontFamily:"system-ui,sans-serif"}}>
        <div className="text-5xl mb-3">😕</div>
        <p className="font-black text-stone-700">Profile not found</p>
        <button onClick={logout} className="mt-6 text-green-600 font-bold">← Go Back</button>
      </div>
    );
  }

  var delivSt = order ? DST[order.status] : null;
  var paySt   = PST[payStatus] || PST.unpaid;
  var lastRead = customer.lastReadAt ? (customer.lastReadAt.seconds || new Date(customer.lastReadAt).getTime() / 1000) : 0;
  var unread  = notifs.filter(function(n){return n.createdAt > lastRead;}).length;
  var wDates  = weekDates(THIS_WEEK);

  var tabs = [
    {id:"home",    icon:"🏠", label:"Home"},
    {id:"menu",    icon:"📋", label:"Menu"},
    {id:"payment", icon:"💰", label:"Payment"},
    {id:"alerts",  icon:"🔔", label: unread>0 ? "Alerts ("+unread+")" : "Alerts"},
  ];

  return (
    <div className="min-h-screen bg-green-50" style={{fontFamily:"system-ui,sans-serif"}}>
      <div className="bg-green-600 text-white px-4 pt-5 pb-4 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-green-200 text-xs">Welcome back</p>
            <p className="text-xl font-black">{customer.name}</p>
            <p className="text-green-200 text-xs mt-0.5">{TODAY_STR}</p>
          </div>
          <button onClick={logout} className="text-xs text-green-200 border border-green-400 px-3 py-1.5 rounded-full">Exit</button>
        </div>
      </div>

      <div className="flex bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        {tabs.map(function(t){
          return (
            <button key={t.id}
              onClick={function(){setTab(t.id); if(t.id==="alerts") onRead();}}
              className={"flex-1 flex flex-col items-center py-2.5 text-xs font-semibold gap-0.5 " + (tab===t.id?"text-green-600 border-b-2 border-green-600":"text-stone-400 border-b-2 border-transparent")}>
              <span className="text-base">{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-8">

        {tab==="home" && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl p-5 shadow-lg shadow-green-600/30 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20 text-8xl -rotate-12 translate-x-4 -translate-y-4">🍽️</div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-green-100 uppercase tracking-widest mb-3">Today's Meal</p>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-3xl font-black">{customer.food || "Regular Meal"}</h2>
                    <p className="text-sm text-green-100 mt-1 capitalize font-medium bg-black/20 inline-block px-3 py-1 rounded-full">{customer.plan} Plan</p>
                  </div>
                </div>
                {delivSt && <span className={"inline-block mt-4 text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-wider bg-white " + (order.status==="delivered"?"text-green-700":order.status==="out"?"text-blue-700":"text-amber-700")}>{delivSt.label}</span>}
              </div>
              
              {order && order.status==="out" && <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30"><p className="text-white text-sm font-bold flex items-center gap-2"><span>🚴</span> Your food is on the way!</p></div>}
              {order && order.status==="delivered" && <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30"><p className="text-white text-sm font-bold flex items-center gap-2"><span>✅</span> Delivered! Enjoy your meal.</p></div>}
            </div>

            {todayMenu && todayMenu.items.length>0 && (
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-stone-100">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">📋 Today's Menu</p>
                <div className="flex flex-wrap gap-1.5">
                  {todayMenu.items.map(function(item,i){return <span key={i} className="bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-100">{item}</span>;})}
                </div>
                {todayMenu.note && <p className="text-xs text-stone-400 mt-2">📝 {todayMenu.note}</p>}
              </div>
            )}

            <div className={"rounded-2xl p-4 shadow-sm border " + (payStatus==="paid"?"bg-green-50 border-green-200":payStatus==="partial"?"bg-amber-50 border-amber-200":"bg-red-50 border-red-200")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{curMonLabel}</p>
                  <p className={"text-2xl font-black mt-1 " + (payStatus==="paid"?"text-green-700":payStatus==="partial"?"text-amber-700":"text-red-700")}>{fmt(paid)}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{"paid" + (customer.rate?" of "+fmt(customer.rate):"")}</p>
                </div>
                <span className={"px-3 py-1.5 rounded-full text-sm font-black " + paySt.cls}>{paySt.label}</span>
              </div>
              <button onClick={function(){setTab("payment");}} className="mt-3 w-full py-2 text-sm font-bold text-stone-600 bg-white/70 border border-stone-200 rounded-xl">View Payment Details →</button>
            </div>

            {unread>0 && (
              <button onClick={function(){setTab("alerts");onRead();}} className="w-full flex items-center gap-3 p-4 bg-green-600 text-white rounded-2xl font-bold">
                <span className="text-xl">🔔</span>
                <span>You have {unread} new notification{unread>1?"s":""}</span>
                <span className="ml-auto">→</span>
              </button>
            )}
          </div>
        )}

        {tab==="menu" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">This Week's Menu</p>
            {wDates.map(function(date,i){
              var isToday = i===TODAY_IDX;
              var day = weekMenu ? weekMenu[i] : null;
              var hasItems = day && day.items.length>0;
              var dLabel = new Date(date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
              return (
                <div key={date} className={"py-3 border-b border-stone-50 last:border-0" + (isToday?" bg-orange-50 -mx-4 px-4 rounded-xl":"")}>
                  <div className="flex items-start gap-2">
                    <div className={"text-xs font-black w-16 flex-shrink-0 pt-0.5 " + (isToday?"text-orange-600":"text-stone-400")}>{dLabel}</div>
                    <div className="flex-1">
                      {hasItems ? (
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {day.items.map(function(item,j){return <span key={j} className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (isToday?"bg-orange-100 text-orange-700":"bg-stone-100 text-stone-600")}>{item}</span>;})}
                          </div>
                          {day.note && <p className="text-xs text-stone-400 mt-1">📝 {day.note}</p>}
                        </div>
                      ) : <p className="text-xs text-stone-400 italic">Not planned</p>}
                    </div>
                    {isToday && <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold flex-shrink-0">Today</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="payment" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">{curMonLabel}</p>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-3xl font-black text-stone-800">{fmt(paid)}</p>
                  <p className="text-xs text-stone-400">{"paid" + (customer.rate?" of "+fmt(customer.rate):"")}</p>
                </div>
                <span className={"px-3 py-1.5 rounded-full text-sm font-black " + paySt.cls}>{paySt.label}</span>
              </div>
              {customer.rate>0 && <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-4"><div className="h-full bg-green-400 rounded-full" style={{width:Math.min(100,Math.round(paid/customer.rate*100))+"%"}}></div></div>}
              {customer.rate>paid ? (
                <a href={waTo(customer.phone,"Hi! I've paid "+fmt(customer.rate-paid)+" for "+curMonLabel+". Please confirm.\n— "+customer.name+" ("+customer.phone+")")}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl text-sm font-black">
                  Send "I've Paid" to Owner
                </a>
              ) : customer.rate>0 ? <div className="text-center py-3 text-green-600 font-black text-sm bg-green-50 rounded-xl">✅ Fully paid this month!</div> : null}
            </div>
          </div>
        )}

        {tab==="alerts" && (
          notifs.length===0 ? (
            <div className="text-center py-16 text-stone-400"><div className="text-4xl mb-3">🔔</div><p className="font-semibold">No notifications yet</p></div>
          ) : (
            <div className="space-y-3">
              {notifs.map(function(n){
                var isUnread = n.createdAt > lastRead;
                return (
                  <div key={n.id} className={"bg-white rounded-2xl p-4 shadow-sm border " + (isUnread?"border-green-200 bg-green-50/60":"border-stone-100")}>
                    <div className="flex gap-3 items-start">
                      <span className="text-2xl flex-shrink-0">{n.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-stone-800">{n.msg}</p>
                        <p className="text-xs text-stone-400 mt-1">{n.date}</p>
                      </div>
                      {isUnread && <span className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0 mt-1"></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAGER VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ManagerView(props) {
  var customers=props.customers, setCustomers=props.setCustomers;
  var orders=props.orders, setOrders=props.setOrders;
  var payments=props.payments, menu=props.menu, setMenuWeek=props.setMenuWeek;
  var stats=props.stats, payStats=props.payStats;
  var getPaid=props.getPaid, getPayStat=props.getPayStat;
  var addPayment=props.addPayment, removePayment=props.removePayment;
  var resetDay=props.resetDay, advanceStatus=props.advanceStatus;
  var curMonth=props.curMonth, delivPin=props.delivPin;
  var setDelivPin=props.setDelivPin, mgrPin=props.mgrPin, setMgrPin=props.setMgrPin;
  var logout=props.logout;

  var tabS=useState(function(){ var h=window.location.hash.replace("#",""); return h.startsWith("form/") ? h.split("/")[1] : (h||"dashboard"); });
  var tab=tabS[0], setTabState=tabS[1];
  var pmS=useState(curMonth); var payMonth=pmS[0],setPayMonth=pmS[1];
  var pfS=useState("all"); var payFilter=pfS[0],setPayFilter=pfS[1];
  var paS=useState({}); var payAmt=paS[0],setPayAmt=paS[1];
  var spS=useState({}); var showPart=spS[0],setShowPart=spS[1];
  var sfS=useState(function(){ return window.location.hash.replace("#","").startsWith("form/"); });
  var showForm=sfS[0], setShowFormState=sfS[1];
  var eiS=useState(null); var editId=eiS[0],setEditId=eiS[1];
  var fmS=useState({name:"",phone:"",address:"",group:"",plan:"daily",food:"",rate:"",deliveryOrder:"", paused:false, pauseFrom:"", pauseTo:""}); var form=fmS[0],setForm=fmS[1];
  var srS=useState(""); var search=srS[0],setSearch=srS[1];
  var cpS=useState(false); var copied=cpS[0],setCopied=cpS[1];
  var ndS=useState(""); var newDP=ndS[0],setNewDP=ndS[1];
  var nmS=useState(""); var newMP=nmS[0],setNewMP=nmS[1];
  var psS=useState(false); var pinSaved=psS[0],setPinSaved=psS[1];
  var dcS=useState(null); var delConfirm=dcS[0],setDelConfirm=dcS[1];
  var wgS=useState(props.whatsappGroup||""); var wg=wgS[0],setWg=wgS[1];
  
  useEffect(function() { setWg(props.whatsappGroup||""); }, [props.whatsappGroup]);

  useEffect(function() {
    function onHash() {
      var h = window.location.hash.replace("#", "");
      if (h.startsWith("form/")) {
        setShowFormState(true);
        setTabState(h.split("/")[1] || "customers");
      } else {
        setShowFormState(false);
        setTabState(h || "dashboard");
      }
    }
    window.addEventListener("hashchange", onHash);
    return function() { window.removeEventListener("hashchange", onHash); };
  }, []);

  function setTab(t) { window.location.hash = t; }
  function setShowForm(v) { window.location.hash = v ? "form/" + tab : tab; }

  var pmStats = useMemo(function(){
    var active=customers.filter(function(c){return c.active&&c.rate>0;});
    var due=0,col=0,nP=0,nPart=0,nU=0;
    active.forEach(function(c){
      var p=getPaid(c.id,payMonth); due+=c.rate; col+=Math.min(p,c.rate);
      var s=getPayStat(c.id,payMonth,c.rate);
      if(s==="paid")nP++; else if(s==="partial")nPart++; else nU++;
    });
    return {due:due,col:col,nP:nP,nPart:nPart,nU:nU,pct:due>0?Math.round(col/due*100):0};
  }, [customers, payments, payMonth]);

  var payC = useMemo(function(){
    var active=customers.filter(function(c){return c.active&&c.rate>0;});
    if(payFilter==="all") return active;
    return active.filter(function(c){return getPayStat(c.id,payMonth,c.rate)===payFilter;});
  }, [customers, payments, payMonth, payFilter]);

  var filteredC = customers.filter(function(c){
    var q=search.toLowerCase();
    return c.name.toLowerCase().includes(q)||c.phone.includes(search)||c.address.toLowerCase().includes(q);
  });

  var summaryMsg = "🍱 *Delivery Update – "+TODAY_STR+"*\n\n✅ Delivered: "+stats.delivered+"/"+stats.total+"\n🚴 On the way: "+stats.out+"\n⏳ Pending: "+stats.pending+"\n\nThank you for your trust! 🙏";

  function openAdd() { setEditId(null); setForm({name:"",phone:"",address:"",group:"",plan:"daily",food:"",rate:"",deliveryOrder:"", paused:false, pauseFrom:"", pauseTo:""}); setShowForm(true); }
  function openEdit(c) { setEditId(c.id); setForm({name:c.name,phone:c.phone,address:c.address,group:c.group||"",plan:c.plan,food:c.food,rate:String(c.rate||""),deliveryOrder:String(c.deliveryOrder||""), paused:c.paused||false, pauseFrom:c.pauseFrom||"", pauseTo:c.pauseTo||""}); setShowForm(true); }

  function save() {
    if(!form.name.trim()) return;
    var rate = parseInt(form.rate)||0;
    var dOrder = parseInt(form.deliveryOrder);
    if(isNaN(dOrder)) dOrder = 999;
    
    if(editId) {
      setCustomers(customers.map(function(c){ return c.id===editId?Object.assign({},c,form,{rate:rate,deliveryOrder:dOrder}):c; }));
    } else {
      var nc = Object.assign({},form,{rate:rate,deliveryOrder:dOrder,id:Date.now(),active:true});
      var updated = customers.concat([nc]);
      setCustomers(updated);
      setOrders(makeOrders(updated).map(function(no){ return orders.find(function(o){return o.id===no.id;})||no; }));
    }
    setShowForm(false);
  }

  function togglePause(c) {
    if (c.active !== false && !c.paused) {
      var dateStr = window.prompt("Pause Customer. Enter auto-resume date (YYYY-MM-DD) or leave empty to pause indefinitely:");
      if (dateStr === null) return; // Cancelled
      setCustomers(customers.map(function(x){ return x.id===c.id?Object.assign({},x,{paused:true, pauseFrom: TODAY.split("T")[0], pauseTo: dateStr.trim()}):x; }));
      setOrders(orders.filter(function(o){return o.id!==c.id;}));
    } else {
      setCustomers(customers.map(function(x){ var copy = Object.assign({},x,{active:true, paused:false, pauseFrom:"", pauseTo:""}); delete copy.resumeDate; return copy; }));
      setOrders(orders.concat([{id:c.id,status:"pending"}]));
    }
  }

  function confirmDel(id) {
    if(delConfirm===id) {
      setCustomers(customers.filter(function(c){return c.id!==id;}));
      setOrders(orders.filter(function(o){return o.id!==id;}));
      setDelConfirm(null);
    } else {
      setDelConfirm(id);
      setTimeout(function(){setDelConfirm(null);},3000);
    }
  }

  function confirmFull(cid) {
    var c=customers.find(function(x){return x.id===cid;}); if(!c||!c.rate) return;
    var rem=c.rate-getPaid(cid,payMonth); if(rem>0) addPayment(cid,rem,true);
  }

  function confirmPartial(cid) {
    var c = customers.find(function(x){return x.id===cid;});
    var amt=payAmt[cid]; if(!amt||isNaN(+amt)||+amt<=0) return;
    var remaining = c ? Math.max(0, c.rate - getPaid(cid, payMonth)) : 0;
    if(remaining > 0 && +amt > remaining) {
      alert("Amount " + fmt(+amt) + " exceeds balance of " + fmt(remaining));
      return;
    }
    addPayment(cid,+amt,true);
    setShowPart(function(p){ var n=Object.assign({},p); n[cid]=false; return n; });
    setPayAmt(function(p){ var n=Object.assign({},p); n[cid]=""; return n; });
  }

  function savePins() {
    var saved = false;
    if(newDP.length>=3) { props.setDelivPin(newDP); saved = true; }
    if(newMP.length>=4) { props.setMgrPin(newMP); saved = true; }
    if(wg !== props.whatsappGroup) { props.saveWhatsappGroup(wg); saved = true; }
    if(saved) { setPinSaved(true); setTimeout(function(){setPinSaved(false);},2000); }
  }

  var todayMenuData = menu[THIS_WEEK] ? menu[THIS_WEEK][TODAY_IDX] : null;

  var TABS = [
    {id:"dashboard",icon:"📊",label:"Overview"},
    {id:"orders",   icon:"🚴",label:"Delivery"},
    {id:"customers",icon:"👥",label:"Customers"},
    {id:"payments", icon:"💰",label:"Payments"},
    {id:"menu",     icon:"📋",label:"Menu"},
    {id:"settings", icon:"⚙️", label:"Settings"},
  ];

  return (
    <div className="min-h-screen bg-orange-50" style={{fontFamily:"system-ui,sans-serif"}}>
      <div className="bg-orange-600 text-white px-4 pt-5 pb-4 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-2"><BrandLogo className="w-8 h-8" /><span className="text-xl font-black">Maa Sharda</span></div>
            <p className="text-orange-200 text-xs mt-0.5">{TODAY_STR}</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-0.5"><span className="text-4xl font-black">{stats.delivered}</span><span className="text-orange-300 text-xl font-semibold">/{stats.total}</span></div>
            <p className="text-orange-200 text-xs">delivered</p>
          </div>
        </div>
        <div className="mt-3 max-w-lg mx-auto">
          <div className="h-2 bg-orange-800/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-300 to-green-400 rounded-full transition-all duration-700" style={{width:stats.progress+"%"}}></div>
          </div>
          <div className="flex justify-between text-orange-300 text-xs mt-1">
            <span>{stats.progress}% complete</span>
            <span>{stats.out>0?stats.out+" on the way · ":""}{stats.pending} pending</span>
          </div>
        </div>
      </div>

      <div className="flex bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        {TABS.map(function(t){
          return (
            <button key={t.id} onClick={function(){setTab(t.id);}}
              className={"flex-1 flex flex-col items-center py-2 text-[10px] font-semibold gap-0.5 " + (tab===t.id?"text-orange-600 border-b-2 border-orange-600":"text-stone-400 border-b-2 border-transparent")}>
              <span className="text-sm">{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 max-w-lg mx-auto pb-8">

        {tab==="dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:"Monthly",  value:stats.monthly,            icon:"📅",grad:"from-purple-500 to-violet-600"},
                {label:"Daily",    value:stats.daily,              icon:"🔄",grad:"from-blue-500 to-cyan-600"},
                {label:"Delivered",value:stats.delivered,          icon:"✅",grad:"from-green-500 to-emerald-600"},
                {label:"Remaining",value:stats.pending+stats.out,  icon:"⏳",grad:"from-amber-500 to-orange-600"},
              ].map(function(s){
                return (
                  <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center gap-3">
                    <div className={"w-10 h-10 rounded-xl bg-gradient-to-br "+s.grad+" flex items-center justify-center text-lg flex-shrink-0"}>{s.icon}</div>
                    <div>
                      <div className="text-3xl font-black text-stone-800 leading-none">{s.value}</div>
                      <div className="text-xs text-stone-500 font-medium mt-0.5">{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {todayMenuData && todayMenuData.items.length>0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Today's Menu</p>
                  <button onClick={function(){setTab("menu");}} className="text-xs text-orange-600 font-bold">Edit →</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todayMenuData.items.map(function(item,i){return <span key={i} className="bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-100">{item}</span>;})}
                </div>
                {todayMenuData.note && <p className="text-xs text-stone-400 mt-2">📝 {todayMenuData.note}</p>}
              </div>
            )}

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
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{width:payStats.pct+"%"}}></div>
              </div>
              <p className="text-xs text-stone-400 mt-1 mb-3">{payStats.pct}% · {fmt(payStats.due-payStats.collected)} pending</p>
              <button onClick={function(){setTab("payments");}} className="w-full py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-bold">Manage Payments →</button>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="space-y-2">
                {[
                  {label:"Update delivery statuses",icon:"🚴",cls:"bg-orange-50 text-orange-700",fn:function(){setTab("orders");}},
                  {label:"Plan this week's menu",   icon:"📋",cls:"bg-amber-50 text-amber-700",  fn:function(){setTab("menu");}},
                  {label:"Add new customer",        icon:"➕",cls:"bg-green-50 text-green-700",  fn:openAdd},
                  {label:"Reset for new day",       icon:"🔄",cls:"bg-blue-50 text-blue-700",    fn:props.onResetDay},
                ].map(function(a){
                  return (
                    <button key={a.label} onClick={a.fn} className={"w-full flex items-center gap-3 px-4 py-3 "+a.cls+" rounded-xl text-sm font-semibold"}>
                      <span>{a.icon}</span>{a.label}<span className="ml-auto opacity-40">→</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <p className="font-bold text-stone-700 text-sm mb-2">💬 WhatsApp Summary</p>
              <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 font-mono whitespace-pre-wrap border border-stone-200">{summaryMsg}</div>
              <button onClick={function(){navigator.clipboard&&navigator.clipboard.writeText(summaryMsg);setCopied(true);setTimeout(function(){setCopied(false);},2000);}}
                className={"mt-3 w-full py-3 rounded-xl text-sm font-black text-white " + (copied?"bg-green-500":"bg-green-500")}>
                {copied?"✓ Copied!":"Copy Message"}
              </button>
            </div>
          </div>
        )}

        {tab==="orders" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-stone-600">{orders.length} deliveries today</p>
              <button onClick={props.onResetDay} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">Reset Day</button>
            </div>
            {orders.length===0 && <div className="text-center py-16 text-stone-400"><div className="text-5xl mb-3">🍽️</div><p className="font-semibold">No deliveries today</p></div>}
            {orders.map(function(order){
              var c=customers.find(function(x){return x.id===order.id;}); if(!c) return null;
              var st=DST[order.status];
              return (
                <div key={order.id} className={"bg-white rounded-2xl shadow-sm border overflow-hidden " + (order.status==="delivered"?"border-green-200":"border-stone-100")}>
                  <div className={"h-1.5 "+st.bar}></div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className="font-black text-stone-800 text-base">{c.name}</p>
                        <p className="text-xs text-stone-500 mt-1">📍 {c.address}</p>
                        <p className="text-xs text-stone-500 mt-0.5">🍴 {c.food}</p>
                      </div>
                      <span className={"text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 "+st.badge}>{st.label}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {st.next && <button onClick={function(){advanceStatus(order.id);}} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-black">Mark → {DST[st.next].label}</button>}
                      <a href={waTo(c.phone,"Hi "+c.name+"! Your food is "+(order.status==="out"?"on the way 🚴":order.status==="delivered"?"delivered ✅":"being prepared 👩‍🍳")+" — thank you! 🙏")}
                        target="_blank" rel="noreferrer"
                        className={"py-2.5 px-4 bg-green-500 text-white rounded-xl text-sm font-black flex items-center gap-1.5 "+(st.next?"":"flex-1 justify-center")}>
                        💬 WhatsApp
                      </a>
                    </div>
                    {!st.next && <p className="mt-2 text-center text-green-600 text-sm font-bold">✓ Delivered</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="customers" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold text-stone-600">{customers.length} customers</p>
              <button onClick={openAdd} className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-black">+ Add</button>
            </div>
            <input className={INP + " mb-2"} placeholder="🔍  Search…" value={search} onChange={function(e){setSearch(e.target.value);}}/>
            
            {/* Render grouped customers */}
            {(() => {
              var groups = {
                "Monthly - Jain": [],
                "Monthly - Normal": [],
                "Daily - Jain": [],
                "Daily - Normal": [],
              };
              
              filteredC.forEach(function(c) {
                var plan = c.plan === "monthly" ? "Monthly" : "Daily";
                var foodType = (c.food || "").toLowerCase().includes("jain") ? "Jain" : "Normal";
                var groupName = plan + " - " + foodType;
                if(groups[groupName]) groups[groupName].push(c);
              });
              
              return Object.keys(groups).map(function(gName) {
                var cList = groups[gName];
                if(cList.length === 0) return null;
                return (
                  <div key={gName} className="mt-6 first:mt-2">
                    <h3 className="text-xs font-black text-stone-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                      {gName.includes("Jain") ? "🌿" : "🍛"} {gName} <span className="bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">{cList.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {cList.map(function(c) {
                        return (
                          <div key={c.id} className={"bg-white rounded-2xl p-4 shadow-sm border " + (c.active?"border-stone-100":"border-stone-200 opacity-60")}>
                            <div className="flex gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-black text-stone-800">{c.name}</p>
                                  {c.group && <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">🏢 {c.group}</span>}
                                  {(c.active === false || c.paused) && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-100">Paused {c.pauseTo ? "until " + c.pauseTo : (c.resumeDate ? "(until " + c.resumeDate + ")" : "")}</span>}
                                </div>
                                <p className="text-xs text-stone-500 mt-1.5">📞 {c.phone} &middot; 📍 {c.address}</p>
                                <p className="text-xs font-medium text-stone-600 mt-0.5">🍴 {getDefaultFood(c.food)}</p>
                                {c.rate>0?<p className="text-xs text-orange-600 font-bold mt-1.5">💰 {fmt(c.rate)}/month</p>:<p className="text-xs text-red-400 font-semibold mt-1.5">⚠️ No rate set</p>}
                              </div>
                              <div className="flex flex-col gap-1.5 flex-shrink-0">
                                <button onClick={function(){openEdit(c);}} className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">Edit</button>
                                <button onClick={function(){togglePause(c);}} className={"text-xs font-bold px-2.5 py-1.5 rounded-lg border " + ((c.active!==false && !c.paused)?"text-amber-600 bg-amber-50 border-amber-100":"text-green-600 bg-green-50 border-green-100")}>{(c.active!==false && !c.paused)?"Pause":"Resume"}</button>
                                <button onClick={function(){setDelConfirm(c.id);}} className="text-xs font-bold px-2.5 py-1.5 rounded-lg border text-red-500 bg-red-50 border-red-100">Delete</button>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-3 border-t border-stone-50">
                              <a href={"tel:+91"+c.phone} className="flex-1 text-center py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-600">📞 Call</a>
                              <a href={waTo(c.phone,"Hi "+c.name+"!")} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-600">💬 WhatsApp</a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {tab==="payments" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <button onClick={function(){setPayMonth(prevMon(payMonth));}} className="w-10 h-10 rounded-xl bg-stone-50 text-stone-600 font-black text-xl flex items-center justify-center">&#8249;</button>
                <div className="text-center">
                  <p className="font-black text-stone-800">{monLabel(payMonth)}</p>
                  {payMonth===curMonth && <span className="text-xs text-orange-600 font-bold">Current Month</span>}
                </div>
                <button onClick={function(){if(payMonth<curMonth)setPayMonth(nextMon(payMonth));}} className={"w-10 h-10 rounded-xl font-black text-xl flex items-center justify-center " + (payMonth>=curMonth?"bg-stone-50 text-stone-300 cursor-not-allowed":"bg-stone-50 text-stone-600")}>&#8250;</button>
              </div>
              <div className="flex items-end justify-between">
                <div><p className="text-3xl font-black text-stone-800">{fmt(pmStats.col)}</p><p className="text-xs text-stone-400">of {fmt(pmStats.due)}</p></div>
                <div className="flex gap-2">
                  <div className="text-center bg-green-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-green-700">{pmStats.nP}</div><div className="text-xs text-green-600 font-bold">Paid</div></div>
                  {pmStats.nPart>0&&<div className="text-center bg-amber-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-amber-700">{pmStats.nPart}</div><div className="text-xs text-amber-600 font-bold">Part</div></div>}
                  <div className="text-center bg-red-50 rounded-xl px-3 py-2"><div className="text-xl font-black text-red-700">{pmStats.nU}</div><div className="text-xs text-red-600 font-bold">Unpaid</div></div>
                </div>
              </div>
              <div className="mt-3 h-2.5 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{width:pmStats.pct+"%"}}></div></div>
              <p className="text-xs text-stone-400 mt-1 text-right">{pmStats.pct}% · {fmt(pmStats.due-pmStats.col)} remaining</p>
            </div>
            <div className="flex gap-2">
              {["all","unpaid","partial","paid"].map(function(f){
                return <button key={f} onClick={function(){setPayFilter(f);}} className={"flex-1 py-2 rounded-xl text-xs font-bold capitalize " + (payFilter===f?"bg-orange-600 text-white":"bg-white text-stone-500 border border-stone-200")}>{f}</button>;
              })}
            </div>
            {payC.map(function(c){
              var paid=getPaid(c.id,payMonth);
              var remaining=Math.max(0,c.rate-paid);
              var pst=PST[getPayStat(c.id,payMonth,c.rate)]||PST.unpaid;
              var records=payments[c.id+"-"+payMonth]||[];
              var isCur=payMonth===curMonth;
              return (
                <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div><p className="font-black text-stone-800 text-base">{c.name}</p><p className="text-xs text-stone-400">{c.plan} · {fmt(c.rate)}/month</p></div>
                      <span className={"text-xs px-2.5 py-1 rounded-full font-black "+pst.cls}>{pst.label}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1.5"><span className="font-bold text-stone-600">Paid: {fmt(paid)}</span>{remaining>0&&<span className="font-bold text-red-500">Due: {fmt(remaining)}</span>}</div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{width:Math.min(100,Math.round(paid/c.rate*100))+"%"}}></div></div>
                    </div>
                    {records.length>0 && (
                      <div className="mt-3 space-y-1.5">
                        {records.map(function(r){
                          return (
                            <div key={r.id} className={"flex justify-between items-center rounded-xl px-3 py-2 border " + (r.confirmed?"bg-green-50 border-green-100":"bg-stone-50 border-stone-100")}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-stone-700">{fmt(r.amount)}</span>
                                {r.confirmed?<span className="text-xs text-green-600 font-bold">✓ Confirmed</span>:<span className="text-xs text-stone-400">Unconfirmed</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-stone-400">{r.date}</span>
                                {isCur&&<button onClick={function(){removePayment(c.id,r.id);}} className="text-xs text-red-400 font-bold">✕</button>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {isCur && remaining>0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          <button onClick={function(){confirmFull(c.id);}} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-black">✓ Confirm & Notify ({fmt(remaining)})</button>
                          <button onClick={function(){setShowPart(function(p){var n=Object.assign({},p);n[c.id]=!p[c.id];return n;});}} className="px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold">Partial</button>
                        </div>
                        {showPart[c.id] && (
                          <div className="flex gap-2">
                            <input className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-stone-50"
                              placeholder={"Amount (max "+fmt(remaining)+")"} inputMode="numeric"
                              value={payAmt[c.id]||""}
                              onChange={function(e){var v=e.target.value;setPayAmt(function(p){var n=Object.assign({},p);n[c.id]=v;return n;});}}/>
                            <button onClick={function(){confirmPartial(c.id);}} className="px-5 bg-green-600 text-white rounded-xl text-sm font-black">Save</button>
                          </div>
                        )}
                        <a href={waTo(c.phone,"Hi "+c.name+" ji! 🙏\nGentle reminder — payment of "+fmt(remaining)+" for "+monLabel(payMonth)+" is pending.\nPlease pay when convenient. Thank you!")}
                          target="_blank" rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-600">
                          💬 Send Reminder on WhatsApp
                        </a>
                      </div>
                    )}
                    {remaining<=0&&paid>0&&<div className="mt-3 py-2 text-center text-green-600 text-sm font-black bg-green-50 rounded-xl">✅ Fully paid · Customer notified</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="menu" && <MenuPlanner menu={menu} setMenuWeek={setMenuWeek}/>}

        {tab==="settings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Access PINs</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">New Delivery PIN</label>
                  <p className="text-xs text-stone-400 mb-1.5">Share with your delivery person (min 3 digits)</p>
                  <input className={INP} placeholder="Enter new delivery PIN" inputMode="numeric" value={newDP} onChange={function(e){setNewDP(e.target.value);}} maxLength={6}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">New Manager PIN</label>
                  <p className="text-xs text-stone-400 mb-1.5">Leave blank to keep current (min 4 digits)</p>
                  <input className={INP} placeholder="Enter new manager PIN" type="password" inputMode="text" value={newMP} onChange={function(e){setNewMP(e.target.value);}} maxLength={12}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">WhatsApp Group Invite Link</label>
                  <p className="text-xs text-stone-400 mb-1.5">For sharing the weekly menu</p>
                  <input className={INP} placeholder="https://chat.whatsapp.com/..." value={wg} onChange={function(e){setWg(e.target.value);}}/>
                </div>
              </div>
              <button onClick={savePins} className={"mt-4 w-full py-3 rounded-xl text-sm font-black " + (pinSaved?"bg-green-500 text-white":"bg-orange-600 text-white")}>{pinSaved?"✓ Saved!":"Save Settings"}</button>
            </div>
            <button onClick={logout} className="w-full py-3 text-stone-400 font-semibold text-sm">← Switch Role</button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {delConfirm && (() => {
        var dc = customers.find(function(x){return x.id===delConfirm;});
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-4xl text-center mb-3">🗑️</div>
              <h3 className="text-lg font-black text-stone-800 text-center">Delete {dc ? dc.name : "Customer"}?</h3>
              <p className="text-sm text-stone-500 text-center mt-2 mb-6">All their payment history will also be removed. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={function(){setDelConfirm(null);}} className="flex-1 py-3 border-2 border-stone-200 rounded-2xl text-stone-600 font-bold">Cancel</button>
                <button onClick={function(){confirmDel(delConfirm);setDelConfirm(null);}} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black">Delete</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showForm && (
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
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("roleSelect");
  const [role, setRole] = useState(null);
  const [cust, setCust] = useState([]);
  const [ords, setOrds] = useState([]);
  const [pays, setPays] = useState({});
  const [menu, setMenu] = useState({});
  const [delivPin, setDelivPin] = useState("");
  const [mgrPin, setMgrPin] = useState("");
  const [notifs, setNotifs] = useState({});
  const [custPhone, setCustPhone] = useState("");
  const [whatsappGroup, setWhatsappGroup] = useState("");

  const [mgrPinHash, setMgrPinHash] = useState("");
  const [delivPinHash, setDelivPinHash] = useState("");
  // NOTE: userPin is intentionally never stored; all auth uses hashes only
  const [userPin, setUserPin] = useState("");

  const [mgrInput, setMgrInput] = useState("");
  const [mgrErr, setMgrErr] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phonErr, setPhonErr] = useState(false);
  const [custAttempts, setCustAttempts] = useState(0);
  const [custLockedUntil, setCustLockedUntil] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ─── Brute-force lockout helpers (persisted to sessionStorage so refresh doesn't bypass) ─
  function getLockoutState(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
    } catch { return { attempts: 0, lockedUntil: 0 }; }
  }
  function setLockoutState(key, attempts, lockedUntil) {
    sessionStorage.setItem(key, JSON.stringify({ attempts, lockedUntil }));
  }
  function checkLockout(key) {
    const { attempts, lockedUntil } = getLockoutState(key);
    if (Date.now() < lockedUntil) return { locked: true, secs: Math.ceil((lockedUntil - Date.now()) / 1000) };
    return { locked: false, attempts };
  }
  function recordFailedAttempt(key, maxAttempts = 5, lockMs = 60000) {
    const { attempts } = getLockoutState(key);
    const next = attempts + 1;
    if (next >= maxAttempts) {
      setLockoutState(key, 0, Date.now() + lockMs);
    } else {
      setLockoutState(key, next, 0);
    }
  }
  function clearLockout(key) { sessionStorage.removeItem(key); }

  // Lockout error messages
  const [mgrLockMsg, setMgrLockMsg] = useState("");
  const [delLockMsg, setDelLockMsg] = useState("");

  // ─── Firebase Anonymous Auth ──────────────────────────────────────────────
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [settingsReady, setSettingsReady] = useState(false);
  const [customersReady, setCustomersReady] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUid(user.uid);
        setAuthReady(true);
      } else {
        // Sign in anonymously — gives every session a real Firebase UID
        // This is used by Firestore rules to require request.auth != null
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Anonymous auth failed:", e);
          setAuthReady(true); // Still allow app to load in degraded mode
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // ─── Secure session restoration — re-verify PIN hash against Firestore ────
  const sessionRestored = useRef(false);

  useEffect(() => {
    if (!authReady || !settingsReady || !customersReady || !mgrPinHash || !delivPinHash || sessionRestored.current) return;
    sessionRestored.current = true;

    const savedRole = sessionStorage.getItem("tiffin_role");
    if (!savedRole) return;

    (async () => {
      if (savedRole === "customer") {
        const savedPhone = sessionStorage.getItem("tiffin_phone") || "";
        // Verify the phone still exists in Firestore (don't trust storage alone)
        if (savedPhone) {
          const found = cust.find((x) => x.phone === savedPhone);
          if (found) {
            setCustPhone(savedPhone);
            setRole("customer");
            setScreen("app");
          } else {
            // Customer deleted or phone changed — force re-login
            sessionStorage.removeItem("tiffin_role");
            sessionStorage.removeItem("tiffin_phone");
          }
        }
      } else if (savedRole === "manager" || savedRole === "delivery") {
        const savedPinHash = sessionStorage.getItem("tiffin_pin_hash") || "";
        const expectedHash = savedRole === "manager" ? mgrPinHash : delivPinHash;
        if (savedPinHash && savedPinHash === expectedHash) {
          // Hash matches current Firestore hash — session is valid
          setRole(savedRole);
          setScreen("app");
        } else {
          // Hash mismatch — PIN was changed or storage was tampered
          sessionStorage.removeItem("tiffin_role");
          sessionStorage.removeItem("tiffin_pin_hash");
        }
      }
    })();
  }, [authReady, settingsReady, customersReady, mgrPinHash, delivPinHash, cust]);

  // ─── Real-time Sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUid) return; // Wait for anonymous auth before attaching listeners

    // 1. Sync Customers
    const customersQuery = collection(db, "businesses", BUSINESS_ID, "customers");
    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          name: d.name,
          phone: d.phone,
          address: d.address,
          plan: d.plan,
          food: d.food,
          rate: d.rate,
          active: d.active,
          group: d.group || "",
          deliveryOrder: d.deliveryOrder,
          resumeDate: d.resumeDate
        });
      });
      setCust(list);
      setCustomersReady(true);
    }, (error) => {
      console.error("Customer sync failed:", error);
      setCust(SEED_C);
      setCustomersReady(true);
    });

    // 2. Sync Today's Orders
    const dateKey = TODAY;
    const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", dateKey);
    const unsubscribeOrders = onSnapshot(orderDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const list = [];
        Object.keys(data).forEach((cid) => {
          list.push({
            id: cid,
            status: data[cid].status,
            updatedAt: data[cid].updatedAt,
            updatedBy: data[cid].updatedBy,
            riderNextFlag: data[cid].riderNextFlag || false
          });
        });
        setOrds(list);
      } else {
        setOrds([]);
      }
    });

    // 3. Sync Payments
    const paymentsQuery = collection(db, "businesses", BUSINESS_ID, "payments");
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        const stateKey = doc.id.replace("_", "-");
        data[stateKey] = doc.data().records || [];
      });
      setPays(data);
    });

    // 4. Sync Menu
    const menuQuery = collection(db, "businesses", BUSINESS_ID, "menu");
    const unsubscribeMenu = onSnapshot(menuQuery, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data().days || [];
      });
      setMenu(data);
    });

    // 5. Sync Pin Hashes & config
    const settingsDocRef = doc(db, "businesses", BUSINESS_ID, "config", "settings");
    const unsubscribeSettings = onSnapshot(settingsDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMgrPinHash(data.mgrPinHash || "");
        setDelivPinHash(data.delivPinHash || "");
        setWhatsappGroup(data.whatsappGroup || "");
        setSettingsReady(Boolean(data.mgrPinHash && data.delivPinHash));
      } else {
        const defaultMgrHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        const defaultDelivHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
        try {
          await setDoc(settingsDocRef, {
            mgrPinHash: defaultMgrHash,
            delivPinHash: defaultDelivHash,
            businessName: "Maa Sharda",
            createdAt: new Date()
          });
        } catch (error) {
          console.error("Settings seed failed:", error);
        }
        setMgrPinHash(defaultMgrHash);
        setDelivPinHash(defaultDelivHash);
        setSettingsReady(true);
      }
    }, (error) => {
      console.error("Settings sync failed:", error);
      setMgrPinHash("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
      setDelivPinHash("03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4");
      setSettingsReady(true);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
      unsubscribePayments();
      unsubscribeMenu();
      unsubscribeSettings();
    };
  }, [firebaseUid]);

  // ─── Automated System Maintenance (Fallback for Cloud Functions) ───────────
  useEffect(() => {
    if (role !== "manager") return;

    const runMaintenance = async () => {
      const now = new Date();
      const todayString = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonthKey = `${year}-${month}`;

      const settingsRef = doc(db, "businesses", BUSINESS_ID, "config", "settings");
      
      try {
        const needsMaintenance = await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(settingsRef);
          if (!sfDoc.exists()) return null;
          
          const data = sfDoc.data();
          const tasks = [];
          
          if (data.lastResetDate !== todayString) tasks.push("dailyReset");
          if (data.lastPauseCheck !== todayString) tasks.push("pauseCheck");
          if (data.lastMonthlyInit !== currentMonthKey) tasks.push("monthlyInit");

          if (tasks.length > 0) {
            transaction.update(settingsRef, { 
              lastResetDate: todayString,
              lastPauseCheck: todayString,
              lastMonthlyInit: currentMonthKey
            });
            return tasks;
          }
          return null;
        });

        if (needsMaintenance) {
          console.log("Running system maintenance for:", todayString, needsMaintenance);
          const custSnap = await getDocs(collection(db, "businesses", BUSINESS_ID, "customers"));
          const batch = writeBatch(db);
          let changes = 0;

          if (needsMaintenance.includes("dailyReset")) {
            const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", todayString);
            const orderData = {};
            custSnap.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.active !== false) {
                orderData[docSnap.id] = { status: "pending", updatedAt: new Date(), updatedBy: "system_frontend_fallback" };
              }
            });
            if (Object.keys(orderData).length > 0) {
              batch.set(orderDocRef, orderData);
              changes++;
            }
          }

          if (needsMaintenance.includes("pauseCheck")) {
            custSnap.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.active === false && data.resumeDate && data.resumeDate <= todayString) {
                batch.update(docSnap.ref, { active: true, resumeDate: deleteField() });
                changes++;
              }
            });
          }

          if (needsMaintenance.includes("monthlyInit")) {
            custSnap.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.active !== false && data.rate && data.rate > 0) {
                const paymentRef = doc(db, "businesses", BUSINESS_ID, "payments", `${docSnap.id}_${currentMonthKey}`);
                batch.set(paymentRef, { totalPaid: 0, records: [] }, { merge: true });
                changes++;
              }
            });
          }

          if (changes > 0) {
            await batch.commit();
            console.log("System maintenance complete.");
          }
        }
      } catch (e) {
        console.error("System maintenance failed: ", e);
      }
    };

    runMaintenance();
  }, [role]);

  // 6. Sync Notifications for the logged-in customer phone
  useEffect(() => {
    if (!custPhone) return;
    const notificationsQuery = collection(db, "businesses", BUSINESS_ID, "notifications", custPhone, "messages");
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        const dateStr = d.createdAt
          ? new Date(d.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
          : DATE_STR;
        const createdAtSeconds = d.createdAt ? d.createdAt.seconds : 0;
        list.push({
          id: doc.id,
          type: d.type,
          msg: d.message,
          icon: d.type === "payment" ? "💰" : "🚴",
          date: dateStr,
          createdAt: createdAtSeconds
        });
      });
      // Sort notifications by newest first
      list.sort((a, b) => b.createdAt - a.createdAt);
      setNotifs((prev) => {
        const updated = { ...prev };
        updated[custPhone] = list;
        return updated;
      });
    });

    return () => unsubscribeNotifications();
  }, [custPhone]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  async function loginMgr() {
    const lockStatus = checkLockout("tiffin_mgr_lockout");
    if (lockStatus.locked) {
      setMgrLockMsg(`Too many attempts. Try again in ${lockStatus.secs}s.`);
      setMgrErr(true);
      return;
    }
    setMgrLockMsg("");
    const hashed = await hashPIN(mgrInput);
    if (hashed !== mgrPinHash) {
      recordFailedAttempt("tiffin_mgr_lockout", 5, 60000);
      const ls = checkLockout("tiffin_mgr_lockout");
      const attemptsLeft = 5 - ls.attempts;
      setMgrLockMsg(ls.locked ? `Too many attempts. Try again in ${ls.secs}s.` : `Incorrect PIN. Please try again. Attempts remaining: ${attemptsLeft}`);
      setMgrErr(true);
      return;
    }
    clearLockout("tiffin_mgr_lockout");
    setMgrErr(false);
    setMgrLockMsg("");
    setUserPin(mgrInput);
    // Fix 1: Store PIN hash (not plaintext) for secure session restoration
    sessionStorage.setItem("tiffin_role", "manager");
    sessionStorage.setItem("tiffin_pin_hash", hashed);
    setMgrInput("");
    setRole("manager");
    setScreen("app");
  }

  async function loginDel() {
    // Fix 2: Brute-force protection (persisted in sessionStorage)
    const lockStatus = checkLockout("tiffin_del_lockout");
    if (lockStatus.locked) {
      setDelLockMsg(`Too many attempts. Try again in ${lockStatus.secs}s.`);
      setPinErr(true);
      return;
    }
    setDelLockMsg("");
    const hashed = await hashPIN(pinInput);
    if (hashed !== delivPinHash) {
      recordFailedAttempt("tiffin_del_lockout", 5, 60000);
      const ls = checkLockout("tiffin_del_lockout");
      const attemptsLeft = 5 - ls.attempts;
      setDelLockMsg(ls.locked ? `Too many attempts. Try again in ${ls.secs}s.` : `Incorrect PIN. Please try again. Attempts remaining: ${attemptsLeft}`);
      setPinErr(true);
      return;
    }
    clearLockout("tiffin_del_lockout");
    setPinErr(false);
    setDelLockMsg("");
    setUserPin(pinInput);
    // Fix 1: Store PIN hash (not plaintext) for secure session restoration
    sessionStorage.setItem("tiffin_role", "delivery");
    sessionStorage.setItem("tiffin_pin_hash", hashed);
    setPinInput("");
    setRole("delivery");
    setScreen("app");
  }

  function loginCust() {
    const now = Date.now();
    if (now < custLockedUntil) {
      const secs = Math.ceil((custLockedUntil - now) / 1000);
      setPhonErr(true);
      return;
    }
    const ph = phoneInput.trim();
    const c = cust.find((x) => x.phone === ph);
    if (!c) {
      const next = custAttempts + 1;
      setCustAttempts(next);
      if (next >= 3) {
        setCustLockedUntil(Date.now() + 30000);
        setCustAttempts(0);
      }
      setPhonErr(true);
      return;
    }
    setPhonErr(false);
    setCustAttempts(0);
    setCustLockedUntil(0);
    setCustPhone(ph);
    sessionStorage.setItem("tiffin_role", "customer");
    sessionStorage.setItem("tiffin_phone", ph);
    setRole("customer");
    setScreen("app");
  }

  function logout() {
    sessionStorage.removeItem("tiffin_role");
    sessionStorage.removeItem("tiffin_pin_hash");  // was: tiffin_userpin
    sessionStorage.removeItem("tiffin_phone");
    setRole(null);
    setScreen("roleSelect");
    setPhoneInput("");
    setCustPhone("");
    setPinInput("");
    setMgrInput("");
    setUserPin("");
    setMgrErr(false);
    setPinErr(false);
    setPhonErr(false);
    setMgrLockMsg("");
    setDelLockMsg("");
  }

  async function advanceStatus(id) {
    const STATUS_NEXT = { pending: "out", out: "delivered" };
    const NOTIF_MSG = { out: "Your tiffin is on the way! 🛵", delivered: "Your tiffin has been delivered. Enjoy your meal! 🍱" };
    try {
      const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", TODAY);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(orderDocRef);
        if (!snap.exists()) return;
        const customerOrder = snap.data()[String(id)];
        if (!customerOrder) return;
        const next = STATUS_NEXT[customerOrder.status];
        if (!next) return;
        transaction.update(orderDocRef, {
          [`${id}.status`]: next,
          [`${id}.updatedBy`]: role || "manager",
          [`${id}.updatedAt`]: new Date()
        });
        // Write notification
        const c = cust.find((x) => String(x.id) === String(id));
        if (c && c.phone) {
          const notifRef = doc(collection(db, "businesses", BUSINESS_ID, "notifications", c.phone, "messages"));
          transaction.set(notifRef, {
            message: NOTIF_MSG[next],
            type: "delivery",
            createdAt: new Date(),
            read: false
          });
        }
      });
    } catch (e) {
      console.error(e);
      alert("Error updating status: " + e.message);
    }
  }

  async function advanceGroupStatus(ids) {
    try {
      await Promise.all(ids.map(id => advanceStatus(id)));
    } catch(e) {
      console.error(e);
    }
  }

  // Fix 3: Replace read-modify-write setDoc with atomic updateDoc
  async function setRiderNext(customerId) {
    try {
      const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", TODAY);
      await updateDoc(orderDocRef, { [`${String(customerId)}.riderNextFlag`]: true });
    } catch (e) {
      console.error("setRiderNext failed:", e);
    }
  }

  async function resetDay() {
    const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", TODAY);
    const orderData = {};
    cust.forEach((c) => {
      if (c.active) {
        orderData[String(c.id)] = {
          status: "pending",
          updatedAt: new Date(),
          updatedBy: "manager"
        };
      }
    });
    await setDoc(orderDocRef, orderData);
  }

  function getPaid(cid, mon) {
    return (pays[cid + "-" + mon] || []).reduce((s, r) => s + r.amount, 0);
  }

  function getPayStat(cid, mon, rate) {
    if (!rate) return "unpaid";
    const p = getPaid(cid, mon);
    return p <= 0 ? "unpaid" : p >= rate ? "paid" : "partial";
  }

  async function addPayment(cid, rawAmt) {
    const amt = +rawAmt;
    if (!amt || isNaN(amt) || amt <= 0) return;
    try {
      const monthKey = CUR_MON;
      const docId = `${cid}_${monthKey}`;
      const payRef = doc(db, "businesses", BUSINESS_ID, "payments", docId);
      const recordId = String(Date.now()) + "_" + String(Math.random()).slice(2, 8);
      const dateLabel = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(payRef);
        const existing = snap.exists() ? snap.data() : { totalPaid: 0, records: [] };
        transaction.set(payRef, {
          customerId: cid,
          month: monthKey,
          totalPaid: (existing.totalPaid || 0) + amt,
          lastUpdated: new Date(),
          records: [...(existing.records || []), {
            id: recordId,
            amount: amt,
            date: dateLabel,
            confirmed: true,
            recordedAt: new Date()
          }]
        }, { merge: true });
        // Notify customer
        const c = cust.find((x) => String(x.id) === String(cid));
        if (c && c.phone) {
          const notifRef = doc(collection(db, "businesses", BUSINESS_ID, "notifications", c.phone, "messages"));
          transaction.set(notifRef, {
            message: `Payment of ₹${amt} recorded for ${monthKey}. Total paid: ₹${(existing.totalPaid || 0) + amt}.`,
            type: "payment",
            createdAt: new Date(),
            read: false
          });
        }
      });
    } catch (e) {
      console.error(e);
      alert("Error confirming payment: " + e.message);
    }
  }

  async function removePayment(cid, pid) {
    const monthKey = CUR_MON;
    const docRef = doc(db, "businesses", BUSINESS_ID, "payments", `${cid}_${monthKey}`);
    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const recordToRemove = data.records.find((r) => r.id === pid);
        if (!recordToRemove) return;
        const updatedRecords = data.records.filter((r) => r.id !== pid);
        const updatedTotal = Math.max(0, (data.totalPaid || 0) - recordToRemove.amount);
        transaction.update(docRef, {
          records: updatedRecords,
          totalPaid: updatedTotal
        });
      });
    } catch (e) {
      console.error(e);
      alert("Error removing payment: " + e.message);
    }
  }

  async function setMenuWeek(weekStart, data) {
    const docRef = doc(db, "businesses", BUSINESS_ID, "menu", weekStart);
    await setDoc(docRef, {
      days: data,
      updatedAt: new Date()
    }, { merge: true });
  }

  async function updateCustomersInFirestore(updatedList) {
    const currentIds = cust.map((c) => String(c.id));
    const updatedIds = updatedList.map((c) => String(c.id));

    // Delete removed customers
    const deletedIds = currentIds.filter((id) => !updatedIds.includes(id));
    for (const id of deletedIds) {
      await deleteDoc(doc(db, "businesses", BUSINESS_ID, "customers", id));
      try {
        const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", TODAY);
        await updateDoc(orderDocRef, {
          [id]: deleteField()
        });
      } catch (e) {}
    }

    // Add or update remaining customers
    for (const c of updatedList) {
      const docId = String(c.id);
      const oldVal = cust.find((x) => String(x.id) === docId);

      if (!oldVal || oldVal.active !== c.active) {
        const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", TODAY);
        if (c.active === false) {
          try {
            await updateDoc(orderDocRef, {
              [docId]: deleteField()
            });
          } catch (e) {}
        } else {
          await setDoc(orderDocRef, {
            [docId]: {
              status: "pending",
              updatedAt: new Date(),
              updatedBy: "manager"
            }
          }, { merge: true });
        }
      }

      await setDoc(doc(db, "businesses", BUSINESS_ID, "customers", docId), {
        name: c.name,
        phone: c.phone,
        address: c.address,
        group: c.group || "",
        plan: c.plan,
        food: c.food,
        rate: c.rate,
        active: c.active !== undefined ? c.active : true,
        createdAt: c.createdAt || new Date()
      }, { merge: true });
    }
  }

  async function updateDelivPin(newPin) {
    try {
      const newHash = await hashPIN(newPin);
      if (newHash === delivPinHash) { alert("New PIN must be different."); return; }
      const settingsRef = doc(db, "businesses", BUSINESS_ID, "config", "settings");
      await updateDoc(settingsRef, { delivPinHash: newHash });
    } catch (e) {
      console.error(e);
      alert("Error changing delivery PIN: " + e.message);
    }
  }

  async function updateMgrPin(newPin) {
    try {
      const newHash = await hashPIN(newPin);
      if (newHash === mgrPinHash) { alert("New PIN must be different."); return; }
      const settingsRef = doc(db, "businesses", BUSINESS_ID, "config", "settings");
      await updateDoc(settingsRef, { mgrPinHash: newHash });
      // Intentionally NOT storing plaintext PIN; hash stored in Firestore only
    } catch (e) {
      console.error(e);
      alert("Error changing manager PIN: " + e.message);
    }
  }

  // ─── Stats and Selectors ──────────────────────────────────────────────────
  const displayOrders = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const activeCustomers = cust.filter((c) => {
      if (c.active === false) return false;
      if (c.paused === true) return false;
      if (c.pauseFrom && c.pauseTo && today >= c.pauseFrom && today <= c.pauseTo) return false;
      return true;
    });
    return activeCustomers.map((c) => {
      const order = ords.find((o) => String(o.id) === String(c.id));
      return order || {
        id: c.id,
        status: "pending",
        updatedAt: null,
        updatedBy: null
      };
    });
  }, [cust, ords]);

  const stats = useMemo(() => {
    const active = cust.filter((c) => c.active);
    const delivered = displayOrders.filter((o) => o.status === "delivered").length;
    return {
      total: active.length,
      monthly: active.filter((c) => c.plan === "monthly").length,
      daily: active.filter((c) => c.plan === "daily").length,
      delivered: delivered,
      out: displayOrders.filter((o) => o.status === "out").length,
      pending: displayOrders.filter((o) => o.status === "pending").length,
      progress: active.length > 0 ? Math.round((delivered / active.length) * 100) : 0
    };
  }, [cust, displayOrders]);

  const payStats = useMemo(() => {
    const active = cust.filter((c) => c.active && c.rate > 0);
    let due = 0;
    let collected = 0;
    let nPaid = 0;
    let nPartial = 0;
    let nUnpaid = 0;
    active.forEach((c) => {
      const p = getPaid(c.id, CUR_MON);
      due += c.rate;
      collected += Math.min(p, c.rate);
      const s = getPayStat(c.id, CUR_MON, c.rate);
      if (s === "paid") nPaid++;
      else if (s === "partial") nPartial++;
      else nUnpaid++;
    });
    return {
      due: due,
      collected: collected,
      nPaid: nPaid,
      nPartial: nPartial,
      nUnpaid: nUnpaid,
      pct: due > 0 ? Math.round((collected / due) * 100) : 0
    };
  }, [cust, pays]);

  const todayMenu = menu[THIS_WEEK] ? menu[THIS_WEEK][TODAY_IDX] : null;
  const weekMenu = menu[THIS_WEEK] || null;

  if (screen === "roleSelect") {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get("role");
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex flex-col items-center justify-center p-6" style={{ fontFamily: "system-ui,sans-serif" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-10 flex flex-col items-center">
            <BrandLogo className="w-24 h-24 mb-3" />
            <h1 className="text-4xl font-black text-stone-800 tracking-tight">Maa Sharda</h1>
            <div className="bg-orange-600 text-white rounded-full px-4 py-1.5 inline-block mt-3 font-bold text-sm shadow-sm">अब पेट भरेगा, मन नहीं</div>
            <p className="text-stone-400 mt-6 text-xs font-semibold uppercase tracking-wider">Select your role to continue</p>
          </div>
          <div className="space-y-3">
            {[
              { icon: "👔", title: "Business Owner", sub: "Full access", bdr: "border-orange-200 hover:border-orange-400", fn: function () { setScreen("mgrAuth"); }, highlight: roleParam === "manager" },
              { icon: "🚴", title: "Delivery Person", sub: "Today's deliveries", bdr: "border-blue-200 hover:border-blue-400", fn: function () { setScreen("delivAuth"); }, highlight: roleParam === "delivery" },
              { icon: "👤", title: "I'm a Customer", sub: "My order & payment", bdr: "border-green-200 hover:border-green-400", fn: function () { setScreen("custAuth"); }, highlight: roleParam === "customer" }
            ].map(function (r) {
              return (
                <button key={r.title} onClick={r.fn} className={"w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border-2 " + r.bdr + (r.highlight ? " ring-2 ring-offset-2 ring-orange-400" : "") + " hover:shadow-md transition-all text-left"}>
                  <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">{r.icon}</div>
                  <div><p className="font-black text-stone-800 text-base">{r.title}</p><p className="text-xs text-stone-400 mt-0.5">{r.sub}</p></div>
                  <span className="ml-auto text-stone-300 text-xl">›</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "mgrAuth") {
    const ls = checkLockout("tiffin_mgr_lockout");
    const mgrErrMsg = mgrErr
      ? (ls.locked ? `Too many attempts. Try again in ${ls.secs}s.` : (mgrLockMsg || "Wrong PIN. Try again."))
      : null;
    return <AuthScreen icon="👔" title="Owner Access" subtitle="Enter your manager PIN" hdr="bg-orange-600" btn="bg-orange-600 hover:bg-orange-700" value={mgrInput} onChange={setMgrInput} error={mgrErrMsg} onBack={function () { setScreen("roleSelect"); setMgrErr(false); setMgrLockMsg(""); }} onSubmit={loginMgr} hint="Contact your IT setup person for initial PIN" isPhone={false} pinInputMode="text" />;
  }
  if (screen === "delivAuth") {
    const ls = checkLockout("tiffin_del_lockout");
    const delErrMsg = pinErr
      ? (ls.locked ? `Too many attempts. Try again in ${ls.secs}s.` : (delLockMsg || "Wrong PIN. Try again."))
      : null;
    return <AuthScreen icon="🚴" title="Delivery Access" subtitle="Enter your delivery PIN" hdr="bg-blue-600" btn="bg-blue-600 hover:bg-blue-700" value={pinInput} onChange={setPinInput} error={delErrMsg} onBack={function () { setScreen("roleSelect"); setPinErr(false); setDelLockMsg(""); }} onSubmit={loginDel} hint="Get the PIN from the business owner" isPhone={false} pinInputMode="numeric" />;
  }
  if (screen === "custAuth") {
    const isLocked = Date.now() < custLockedUntil;
    const lockSecs = isLocked ? Math.ceil((custLockedUntil - Date.now()) / 1000) : 0;
    const custErrMsg = phonErr
      ? (isLocked ? `Too many attempts. Wait ${lockSecs}s before trying again.` : "Number not registered. Contact your tiffin owner.")
      : null;
    return <AuthScreen icon="👤" title="Customer Portal" subtitle="Enter your registered phone number" hdr="bg-green-600" btn="bg-green-600 hover:bg-green-700" value={phoneInput} onChange={setPhoneInput} error={custErrMsg} onBack={function () { setScreen("roleSelect"); setPhonErr(false); setCustAttempts(0); }} onSubmit={loginCust} hint="Use the phone number you gave the business owner" isPhone={true} />;
  }

  // Reset Day confirmation modal (rendered at App level so it works across roles)
  const resetConfirmModal = showResetConfirm ? (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-4xl text-center mb-3">🔄</div>
        <h3 className="text-lg font-black text-stone-800 text-center">Reset Delivery Day?</h3>
        <p className="text-sm text-stone-500 text-center mt-2 mb-6">All delivery statuses will reset to Pending. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 border-2 border-stone-200 rounded-2xl text-stone-600 font-bold">Cancel</button>
          <button onClick={() => { setShowResetConfirm(false); resetDay(); }} className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-black">Reset</button>
        </div>
      </div>
    </div>
  ) : null;

  const onResetDay = () => setShowResetConfirm(true);

  if (role === "manager") {
    return (
      <div>
        {resetConfirmModal}
        <ManagerView customers={cust} setCustomers={updateCustomersInFirestore} orders={displayOrders} setOrders={async () => {}} payments={pays} menu={menu} setMenuWeek={setMenuWeek} stats={stats} payStats={payStats} getPaid={getPaid} getPayStat={getPayStat} addPayment={addPayment} removePayment={removePayment} onResetDay={onResetDay} advanceStatus={advanceStatus} curMonth={CUR_MON} delivPin={delivPin} setDelivPin={updateDelivPin} mgrPin={mgrPin} setMgrPin={updateMgrPin} whatsappGroup={whatsappGroup} saveWhatsappGroup={async function(link) { const docRef = doc(db, "businesses", BUSINESS_ID, "config", "settings"); await setDoc(docRef, { whatsappGroup: link }, { merge: true }); setWhatsappGroup(link); }} logout={logout} />
      </div>
    );
  }

  if (role === "delivery") {
    // Delivery person cannot reset — only manager can
    return (
      <div>
        {resetConfirmModal}
        <DeliveryView orders={displayOrders} customers={cust} advance={advanceStatus} advanceGroup={advanceGroupStatus} setRiderNext={setRiderNext} logout={logout} stats={stats} />
      </div>
    );
  }

  if (role === "customer") {
    const c = cust.find((x) => x.phone === custPhone);
    const cNotifs = notifs[custPhone] || [];
    return (
      <CustomerView
        customer={c}
        order={displayOrders.find((o) => String(o.id) === String(c && c.id))}
        paid={c ? getPaid(c.id, CUR_MON) : 0}
        payStatus={c ? getPayStat(c.id, CUR_MON, c.rate) : "unpaid"}
        notifs={cNotifs}
        onRead={async function () {
          if (c) {
            const cRef = doc(db, "businesses", BUSINESS_ID, "customers", String(c.id));
            await updateDoc(cRef, { lastReadAt: new Date() });
          }
        }}
        curMonLabel={monLabel(CUR_MON)}
        logout={logout}
        todayMenu={todayMenu}
        weekMenu={weekMenu}
      />
    );
  }

  return null;
}
