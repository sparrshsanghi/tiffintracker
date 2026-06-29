import { useState } from "react";
import {
  MapPin, Package, CheckCircle2, ChevronDown, ChevronUp,
  Phone, Bell, CreditCard, Home, Building2, UtensilsCrossed,
  Users, AlertCircle, Bike, BriefcaseBusiness
} from "lucide-react";

// Helper components
const STATUS = {
  pending:   { label: "Pending",   bg: "bg-red-100",   text: "text-red-700",   dot: "bg-red-400" },
  out:       { label: "On way",    bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  delivered: { label: "Delivered", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
};

function getDefaultFood(customFood) {
  if (customFood && customFood.trim().length > 0) return customFood;
  const d = new Date();
  const isSunday = d.getDay() === 0;
  const isNoon = d.getHours() < 16;
  if (isSunday && isNoon) return "Special (Pav Bhaji / Biryani)";
  return "Roti, Rice, Daal";
}

function Pill({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function MarkBtn({ status, onPacked, onDelivered }) {
  if (status === "delivered") return null;
  return status === "pending" ? (
    <button onClick={onPacked}
      className="flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
      <Package size={11} /> Packed
    </button>
  ) : (
    <button onClick={onDelivered}
      className="flex items-center gap-1 text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
      <CheckCircle2 size={11} /> Delivered
    </button>
  );
}

function SectionLabel({ children }) {
  return <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">{children}</p>;
}

function HouseTag({ no, done }) {
  return (
    <div className={`flex-shrink-0 rounded-md text-center px-2.5 py-1.5 min-w-[52px] ${done ? "bg-stone-100" : "bg-amber-900"}`}>
      <span className={`text-xs font-black font-mono tracking-wide ${done ? "text-stone-400" : "text-amber-100"}`}>
        {no || "-"}
      </span>
    </div>
  );
}

export function DeliveryView(props) {
  var orders=props.orders, customers=props.customers, advance=props.advance;
  var advanceGroup=props.advanceGroup, logout=props.logout;

  const [exp, setExp] = useState({});

  var groups = {};
  var ungrouped = [];
  var totalTiffins = 0;
  var done = 0;

  orders.forEach(function(order){
    var c = customers.find(x => x.id === order.id);
    if(!c) return;
    totalTiffins++;
    if (order.status === "delivered") done++;
    var g = (c.group || "").trim();
    if(g) {
      if(!groups[g]) groups[g] = [];
      groups[g].push({order, customer: c});
    } else {
      ungrouped.push({order, customer: c});
    }
  });

  var groupKeys = Object.keys(groups);
  const pct = totalTiffins ? Math.round((done / totalTiffins) * 100) : 0;
  const dayName = new Date().toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col min-h-screen bg-stone-50" style={{fontFamily:"'Inter', system-ui, sans-serif"}}>
      <div className="bg-white border-b border-stone-100 px-4 pt-4 pb-3 flex-shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">Today · {dayName}</p>
            <p className="text-xs text-stone-400 mt-0.5">{groupKeys.length} colonies · {ungrouped.length} individual</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <button onClick={logout} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full mb-1 border border-stone-200">Exit</button>
            <p className="text-sm font-black text-stone-900 leading-none mt-1">
              Today's Deliveries ({totalTiffins})
            </p>
          </div>
        </div>
        <div className="mt-2.5 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-6 space-y-3">
        {groupKeys.length > 0 && <SectionLabel>Colonies</SectionLabel>}
        {groupKeys.map(gName => {
          const gOrders = groups[gName];
          const colDone = gOrders.filter(o => o.order.status === "delivered").length;
          const allDone = colDone === gOrders.length;
          const open = exp[gName] !== false; 

          return (
            <div key={gName} className={`rounded-2xl overflow-hidden border-2 ${allDone ? "border-green-200" : "border-amber-200"}`}>
              <button
                onClick={() => setExp(e => ({ ...e, [gName]: !open }))}
                className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-left ${allDone ? "bg-green-50" : "bg-amber-50"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${allDone ? "bg-green-100" : "bg-amber-100"}`}>
                  <Building2 size={18} className={allDone ? "text-green-600" : "text-amber-700"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${allDone ? "text-green-800" : "text-stone-800"}`}>{gName}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={10} />{gOrders[0].customer.address}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allDone ? "bg-green-200 text-green-800" : "bg-amber-200 text-amber-900"}`}>
                    {colDone}/{gOrders.length}
                  </span>
                  {open ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                </div>
              </button>

              {open && (
                <div className="bg-white divide-y divide-stone-50">
                  {gOrders.map(o => {
                    const m = o.customer;
                    const isDone = o.order.status === "delivered";
                    const houseNoMatch = m.address.split(",")[0].trim();
                    return (
                      <div key={m.id} className={`px-3.5 py-3 transition-opacity ${isDone ? "opacity-40" : ""}`}>
                        <div className="flex items-start gap-2.5">
                          <HouseTag no={houseNoMatch} done={isDone} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <p className="text-sm font-bold text-stone-800">{m.name}</p>
                              <Pill status={o.order.status} />
                            </div>
                            <p className="text-xs text-stone-500">{m.address}</p>
                            <p className="text-xs text-stone-500">{m.group || gName}</p>
                            <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 text-xs text-stone-500 mt-1 font-semibold text-blue-600 active:scale-95 transition-transform">
                              📞 {m.phone}
                            </a>
                            {!isDone && (
                              <div className="mt-3">
                                <MarkBtn
                                  status={o.order.status}
                                  onPacked={() => advance(m.id)}
                                  onDelivered={() => advance(m.id)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!allDone && (
                    <div className="p-3 bg-stone-50 border-t border-stone-100">
                      <button onClick={() => advanceGroup(gOrders.filter(x => x.order.status !== "delivered").map(x => x.order.id))}
                        className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-transform">
                        <Package size={14} /> Update All Remaining
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {ungrouped.length > 0 && <SectionLabel>Individual</SectionLabel>}
        {ungrouped.map(o => {
          const ind = o.customer;
          const isDone = o.order.status === "delivered";
          return (
            <div key={ind.id}
              className={`bg-white rounded-2xl border border-stone-200 px-3.5 py-3 transition-opacity ${isDone ? "opacity-40" : ""}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Home size={17} className="text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <p className="text-sm font-bold text-stone-800">{ind.name}</p>
                    <Pill status={o.order.status} />
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    {ind.address}
                  </p>
                  <p className="text-xs text-stone-500">{ind.group}</p>
                  <a href={`tel:${ind.phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 mt-1 active:scale-95 transition-transform">
                    📞 {ind.phone}
                  </a>
                  {!isDone && (
                    <div className="mt-3">
                      <MarkBtn
                        status={o.order.status}
                        onPacked={() => advance(ind.id)}
                        onDelivered={() => advance(ind.id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CustomerView(props) {
  var customer=props.customer, order=props.order, paid=props.paid;
  var notifs=props.notifs, onRead=props.onRead;
  var curMonLabel=props.curMonLabel, logout=props.logout;
  var todayMenu=props.todayMenu, weekMenu=props.weekMenu;

  var tabState = useState("home");
  var tab = tabState[0], setTab = tabState[1];

  if (!customer) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center" style={{fontFamily:"system-ui,sans-serif"}}>
        <div className="text-5xl mb-3">😕</div>
        <p className="font-black text-stone-700">Profile not found</p>
        <button onClick={logout} className="mt-6 text-amber-600 font-bold">← Go Back</button>
      </div>
    );
  }

  var delivStatus = order ? order.status : "pending"; 
  var lastRead = customer.lastReadAt ? (customer.lastReadAt.seconds || new Date(customer.lastReadAt).getTime() / 1000) : 0;
  var unread  = notifs.filter(n => n.createdAt > lastRead).length;
  
  var wDates = []; 
  var d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
  for(var i=0; i<7; i++) {
    wDates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  var TODAY_IDX = (new Date().getDay() + 6) % 7;
  const cRate = customer.rate || 0;
  const isPaid = paid >= cRate && cRate > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-50" style={{fontFamily:"'Inter', system-ui, sans-serif"}}>
      <div className="bg-amber-500 px-4 pt-5 pb-5 flex-shrink-0 relative">
        <button onClick={logout} className="absolute top-5 right-4 text-xs font-bold text-amber-200 border border-amber-400 px-2 py-1 rounded-lg">Logout</button>
        <p className="text-amber-100 text-sm">Welcome back</p>
        <p className="text-white text-2xl font-black mt-0.5">Hi, {customer.name.split(" ")[0]}!</p>
        <p className="text-amber-200 text-xs mt-0.5 truncate pr-16">{customer.group || "TiffinTrack"} · {customer.address}</p>
      </div>

      <div className="bg-white border-b border-stone-100 flex flex-shrink-0 shadow-sm">
        {[
          { id: "home", label: "Home" },
          { id: "menu", label: "Menu" },
          { id: "payment", label: "Payment" },
          { id: "alerts", label: "Alerts", badge: unread > 0 },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if(t.id==="alerts") onRead(); }}
            className={`flex-1 text-xs font-bold py-3 border-b-2 transition-all relative ${tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400"}`}>
            {t.id === "alerts" ? (
              <span className="flex items-center justify-center gap-1">
                {t.label}
                {t.badge && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 ml-1 flex items-center justify-center font-bold leading-none">{unread}</span>}
              </span>
            ) : t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-6 space-y-3">
         {tab === "home" && (
           <>
             <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                 <UtensilsCrossed size={17} className="text-amber-600 flex-shrink-0" />
                 <div>
                   <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Today's menu</p>
                 </div>
               </div>
               <p className="text-stone-800 font-bold text-base leading-snug">
                 {todayMenu && todayMenu.items.length > 0 ? todayMenu.items.join(" · ") : getDefaultFood(customer.food)}
               </p>
             </div>

             <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
               <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-4">Delivery Status</p>
               <div className="flex items-center px-2">
                 <div className="flex flex-col items-center flex-1">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${delivStatus !== "pending" ? "bg-amber-500" : "bg-stone-100"}`}>
                     {delivStatus !== "pending"
                       ? <Package size={22} className="text-white" />
                       : <span className="text-stone-300 font-black">1</span>}
                   </div>
                   <p className={`text-[11px] font-bold mt-2 ${delivStatus !== "pending" ? "text-amber-600" : "text-stone-300"}`}>Packed</p>
                 </div>

                 <div className="flex-[1.5] mx-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                   <div className={`h-full bg-amber-500 rounded-full transition-all duration-700 ${delivStatus === "delivered" ? "w-full" : "w-0"}`} />
                 </div>

                 <div className="flex flex-col items-center flex-1">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${delivStatus === "delivered" ? "bg-green-500" : "bg-stone-100"}`}>
                     {delivStatus === "delivered"
                       ? <CheckCircle2 size={22} className="text-white" />
                       : <span className="text-stone-300 font-black">2</span>}
                   </div>
                   <p className={`text-[11px] font-bold mt-2 ${delivStatus === "delivered" ? "text-green-600" : "text-stone-300"}`}>Delivered</p>
                 </div>
               </div>

               <div className={`mt-5 rounded-xl py-2.5 px-3 text-center ${delivStatus === "out" ? "bg-amber-50" : delivStatus === "delivered" ? "bg-green-50" : "bg-stone-50"}`}>
                 <p className={`text-sm font-bold ${delivStatus === "out" ? "text-amber-700" : delivStatus === "delivered" ? "text-green-700" : "text-stone-400"}`}>
                   {delivStatus === "pending" ? "Being prepared in the kitchen" : null}
                   {delivStatus === "out" ? "Your tiffin is on the way!" : null}
                   {delivStatus === "delivered" ? "Delivered! Enjoy your meal" : null}
                 </p>
               </div>
             </div>

             {cRate > paid && (
               <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                 <div>
                   <p className="text-xs font-bold text-red-700">₹{cRate - paid} due this month</p>
                   <p className="text-xs text-red-400">{curMonLabel}</p>
                 </div>
                 <button onClick={() => setTab("payment")} className="text-xs font-bold text-red-600 border border-red-200 bg-white px-3 py-1.5 rounded-lg active:scale-95 transition-transform">View</button>
               </div>
             )}
           </>
         )}

         {tab === "menu" && (
           <>
             {todayMenu && (
               <div className="bg-amber-500 rounded-2xl p-4 text-white shadow-sm">
                 <p className="text-xs font-bold text-amber-100 uppercase tracking-wide">Today</p>
                 <p className="text-lg font-black mt-1.5 leading-snug">{todayMenu.items.join(" · ")}</p>
                 <div className="mt-3 flex flex-wrap gap-1.5">
                   {todayMenu.items.map(i => (
                     <span key={i} className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{i}</span>
                   ))}
                 </div>
               </div>
             )}
             <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
               {wDates.map((date, i) => {
                 var d = weekMenu ? weekMenu[i] : null;
                 var isToday = i === TODAY_IDX;
                 if (isToday) return null;
                 var past = i < TODAY_IDX;
                 var dayName = new Date(date).toLocaleDateString("en-IN",{weekday:"short"});
                 var dayNum = new Date(date).getDate();
                 return (
                   <div key={date} className={`flex gap-3 items-center px-4 py-3 border-b border-stone-50 last:border-0 ${past ? "bg-stone-50/50" : "bg-white"}`}>
                     <div className="w-10 text-center flex-shrink-0">
                       <p className={`text-xs font-bold ${past ? "text-stone-400" : "text-stone-600"}`}>{dayName}</p>
                       <p className="text-xs text-stone-400">{dayNum}</p>
                     </div>
                     <div className={`w-0.5 h-7 rounded-full flex-shrink-0 ${past ? "bg-stone-200" : "bg-amber-200"}`} />
                     <p className={`text-sm flex-1 ${past ? "text-stone-400" : "text-stone-700 font-medium"}`}>
                       {d && d.items.length > 0 ? d.items.join(" · ") : "Not planned"}
                     </p>
                   </div>
                 );
               })}
             </div>
           </>
         )}

         {tab === "payment" && (
           <>
             <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-xs text-stone-400 uppercase tracking-wide font-bold">{curMonLabel}</p>
                   <p className="text-3xl font-black text-stone-900 mt-1">₹{paid}</p>
                   <p className="text-xs text-stone-400 font-medium">paid of ₹{cRate}</p>
                 </div>
                 {cRate > paid
                   ? <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">₹{cRate - paid} due</span>
                   : <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 size={12} /> Paid</span>
                 }
               </div>
               {cRate > 0 && (
                 <div className="mt-5 h-2 bg-stone-100 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: Math.min(100, Math.round((paid / cRate) * 100)) + "%" }} />
                 </div>
               )}
             </div>

             {cRate > paid && (
               <a href={`https://wa.me/?text=${encodeURIComponent("Hi! I've paid ₹" + (cRate - paid) + " for " + curMonLabel + ". Please confirm. — " + customer.name + " (" + customer.phone + ")")}`}
                 target="_blank" rel="noreferrer"
                 className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-4 hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/20">
                 <Phone size={16} /> Send "I've paid" to owner
               </a>
             )}
           </>
         )}

         {tab === "alerts" && (
           notifs.length === 0 ? (
             <div className="text-center py-16 text-stone-400"><div className="text-4xl mb-3">🔔</div><p className="font-semibold">No notifications yet</p></div>
           ) : (
             <div className="space-y-3">
               {notifs.map(function(n){
                 var isUnread = n.createdAt > lastRead;
                 return (
                   <div key={n.id} className={`flex gap-3 rounded-2xl px-4 py-3 border ${isUnread ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-white border-stone-100"}`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${isUnread ? "bg-amber-100 text-amber-600" : "bg-stone-50 text-stone-400"}`}>
                       {n.icon || <Bell size={18} />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className={`text-sm ${isUnread ? "font-bold text-stone-800" : "font-medium text-stone-600"}`}>{n.msg}</p>
                       <p className="text-xs text-stone-400 mt-1">{n.date}</p>
                     </div>
                     {isUnread && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />}
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

export function ManagerView(props) {
  var customers=props.customers, orders=props.orders, stats=props.stats, payStats=props.payStats;
  var logout=props.logout;
  const [tab, setTab] = useState("overview");
  const [exp, setExp] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  var groups = {};
  var ungrouped = [];
  const lowerQ = searchQuery.toLowerCase();
  customers.filter(c => c.active).forEach(function(c){
    if (searchQuery && !(
      c.name.toLowerCase().includes(lowerQ) ||
      c.phone.includes(searchQuery) ||
      (c.address || "").toLowerCase().includes(lowerQ) ||
      (c.group || "").toLowerCase().includes(lowerQ)
    )) return;
    var g = (c.group || "").trim();
    if(g) {
      if(!groups[g]) groups[g] = [];
      groups[g].push(c);
    } else {
      ungrouped.push(c);
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-50" style={{fontFamily:"'Inter', system-ui, sans-serif"}}>
      <div className="bg-white border-b border-stone-100 px-3 py-2 flex gap-1 flex-shrink-0 sticky top-0 z-10">
        {["overview", "customers", "payments", "menu"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg capitalize transition-all ${tab === t ? "bg-stone-900 text-white" : "text-stone-500"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-6 space-y-3 relative">
        {tab === "overview" && (
          <>
            <div className="flex justify-between items-center mb-1">
               <SectionLabel>Today's Overview</SectionLabel>
               <button onClick={logout} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full border border-stone-200">Logout</button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: stats.total, l: "Customers", icon: <Users size={15} className="text-stone-500" />, bg: "bg-stone-50 border-stone-100" },
                { v: stats.pending,  l: "Pending",   icon: <AlertCircle size={15} className="text-red-500" />, bg: "bg-red-50 border-red-100" },
                { v: stats.delivered,  l: "Delivered", icon: <CheckCircle2 size={15} className="text-green-500" />, bg: "bg-green-50 border-green-100" },
              ].map(s => (
                <div key={s.l} className={`rounded-xl p-3 text-center border shadow-sm ${s.bg}`}>
                  <div className="flex justify-center mb-1.5">{s.icon}</div>
                  <p className="text-2xl font-black text-stone-900 leading-none">{s.v}</p>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-stone-400 mt-1">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm mt-4">
              <p className="text-xs font-bold text-amber-900 mb-4 uppercase tracking-wider">Colony Progress Today</p>
              {Object.keys(groups).map(gName => {
                const cList = groups[gName];
                const cIds = cList.map(c => c.id);
                const gOrders = orders.filter(o => cIds.includes(o.id));
                const done = gOrders.filter(o => o.status === "delivered").length;
                const pct = cList.length > 0 ? Math.round((done / cList.length) * 100) : 0;
                return (
                  <div key={gName} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-amber-900">{gName}</span>
                      <span className="font-bold text-amber-700">{done}/{cList.length}</span>
                    </div>
                    <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mt-4">
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-3">Revenue (This Month)</p>
              <div className="flex justify-between items-end">
                <div><p className="text-3xl font-black text-stone-900">₹{payStats.collected.toLocaleString()}</p><p className="text-xs text-stone-400 font-semibold mt-0.5">collected of ₹{payStats.due.toLocaleString()}</p></div>
                <div className="text-right"><p className="text-xl font-black text-red-500">₹{(payStats.due - payStats.collected).toLocaleString()}</p><p className="text-xs text-red-400 font-semibold mt-0.5">pending</p></div>
              </div>
            </div>
            
            <p className="text-xs text-center text-stone-400 mt-6 font-medium">To manage menus, customers and settings,<br/>use the tabs above.</p>
          </>
        )}

        {tab === "customers" && (
          <>
            <div className="flex gap-2">
              {[
                { v: Object.keys(groups).length, l: "Colonies",       cl: "bg-amber-50 border-amber-200 text-amber-900" },
                { v: Object.values(groups).reduce((acc, g) => acc + g.length, 0), l: "Colony members", cl: "bg-stone-50 border-stone-200 text-stone-900" },
                { v: ungrouped.length, l: "Individual",     cl: "bg-stone-50 border-stone-200 text-stone-900" },
              ].map(s => (
                <div key={s.l} className={`flex-1 rounded-xl px-2 py-3 text-center border shadow-sm ${s.cl.split(" ").slice(0,2).join(" ")}`}>
                  <p className={`text-2xl font-black ${s.cl.split(" ")[2]}`}>{s.v}</p>
                  <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wide mt-1">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
               <input
                 type="text"
                 placeholder="🔍 Search by name, phone, or area..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
               />
            </div>

            {Object.keys(groups).length === 0 && ungrouped.length === 0 && (
              <div className="text-center py-10 text-stone-400">
                <p className="font-semibold">No customers found.</p>
              </div>
            )}

            {Object.keys(groups).length > 0 && (
              <div className="mt-4">
                 <SectionLabel>Colonies</SectionLabel>
              </div>
            )}

            {Object.keys(groups).map(gName => {
              const col = groups[gName];
              return (
              <div key={gName} className="rounded-2xl overflow-hidden border-2 border-amber-200 mb-3 shadow-sm">
                <button onClick={() => setExp(e => ({ ...e, [gName]: !e[gName] }))}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 bg-amber-50 text-left">
                  <Building2 size={18} className="text-amber-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 text-sm">{gName}</p>
                    <p className="text-xs text-stone-400 truncate">{col.length} members · {col[0].address.split(",").slice(1).join(",").trim()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {exp[gName] ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                  </div>
                </button>

                {exp[gName] && (
                  <div className="bg-white">
                    <div className="px-3.5 py-1.5 bg-stone-50 border-b border-stone-100 flex gap-3">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest w-14">House</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex-1">Customer</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Food</p>
                    </div>
                    {col.map(m => (
                      <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-stone-50 last:border-0">
                        <span className="text-xs font-black text-amber-900 font-mono bg-amber-50 px-2 py-0.5 rounded w-14 text-center flex-shrink-0 truncate">{m.address.split(",")[0].trim() || "-"}</span>
                        <p className="text-sm font-medium text-stone-800 flex-1 truncate">{m.name}</p>
                        <p className="text-[11px] text-stone-500 truncate max-w-[80px]">{getDefaultFood(m.food)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}

            {ungrouped.length > 0 && (
              <div className="mt-4">
                 <SectionLabel>Individual</SectionLabel>
              </div>
            )}

            {ungrouped.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 px-3.5 py-3 flex items-center gap-2.5 mb-2 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Home size={15} className="text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800">{p.name}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1 truncate"><MapPin size={10} className="flex-shrink-0"/>{p.address}</p>
                </div>
              </div>
            ))}
            
            <button onClick={props.openLegacy} className="w-full text-xs font-bold bg-stone-200 text-stone-600 py-3 rounded-xl mt-6 active:scale-95 transition-transform shadow-sm">
              Enter Edit Mode (Add/Edit Customers)
            </button>
          </>
        )}

        {tab === "payments" && (
           <div className="text-center py-16 text-stone-400"><p className="font-semibold">Payments view mapped to real app soon.</p></div>
        )}
        
        {tab === "menu" && (
           <div className="text-center py-16 text-stone-400"><p className="font-semibold">Menu view mapped to real app soon.</p></div>
        )}
      </div>
    </div>
  );
}
