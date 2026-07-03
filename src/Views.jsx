import { useState } from "react";
import {
  Package, CheckCircle2,
  Phone, Bell, UtensilsCrossed
} from "lucide-react";

export function BrandLogo({ className = "w-24 h-24" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 4 A 46 46 0 0 0 50 96" stroke="#E65100" strokeWidth="5" fill="none" />
      <path d="M 50 4 A 46 46 0 0 1 50 96" stroke="#2E7D32" strokeWidth="5" fill="none" />
      <path d="M38 18 Q35 8 42 4 Q45 10 40 18" stroke="#E65100" strokeWidth="2" fill="none" />
      <path d="M48 16 Q45 6 52 2 Q55 8 50 16" stroke="#E65100" strokeWidth="2" fill="none" />
      <path d="M58 18 Q55 8 62 4 Q65 10 60 18" stroke="#E65100" strokeWidth="2" fill="none" />
      <rect x="34" y="22" width="32" height="6" rx="3" fill="#E65100" />
      <rect x="28" y="30" width="44" height="48" rx="4" fill="#E65100" />
      <line x1="28" y1="36" x2="72" y2="36" stroke="#FFF" strokeWidth="1.5" />
      <line x1="28" y1="46" x2="72" y2="46" stroke="#FFF" strokeWidth="1.5" />
      <line x1="28" y1="62" x2="72" y2="62" stroke="#FFF" strokeWidth="1.5" />
      <line x1="28" y1="72" x2="72" y2="72" stroke="#FFF" strokeWidth="1.5" />
      <text x="50" y="57" fill="#FFF" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">माँ</text>
      <path d="M 40 67 Q 50 71 60 67" stroke="#FFF" strokeWidth="1.5" fill="none" />
      <path d="M 45 70 Q 50 72 55 70" stroke="#FFF" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function getDefaultFood(customFood) {
  if (customFood && customFood.trim().length > 0) return customFood;
  const d = new Date();
  const isSunday = d.getDay() === 0;
  const isNoon = d.getHours() < 16;
  if (isSunday && isNoon) return "Special (Pav Bhaji / Biryani)";
  return "Roti, Rice, Daal";
}

export function CustomerView(props) {
  var customer=props.customer, order=props.order, paid=props.paid;
  var notifs=props.notifs, onRead=props.onRead;
  var curMonLabel=props.curMonLabel, logout=props.logout;
  var todayMenu=props.todayMenu, weekMenu=props.weekMenu;
  var extractMaaAiIntent=props.extractMaaAiIntent;
  var confirmMaaAiAction=props.confirmMaaAiAction;

  var tabState = useState("home");
  var tab = tabState[0], setTab = tabState[1];
  var aiMsgState = useState([
    { role: "assistant", text: "Tell me when you want to pause or resume meals." },
  ]);
  var aiMessages = aiMsgState[0], setAiMessages = aiMsgState[1];
  var aiInputState = useState("");
  var aiInput = aiInputState[0], setAiInput = aiInputState[1];
  var aiDraftState = useState(null);
  var aiDraft = aiDraftState[0], setAiDraft = aiDraftState[1];
  var aiBusyState = useState(false);
  var aiBusy = aiBusyState[0], setAiBusy = aiBusyState[1];
  var aiErrState = useState("");
  var aiErr = aiErrState[0], setAiErr = aiErrState[1];
  var aiPendingState = useState("");
  var aiPending = aiPendingState[0], setAiPending = aiPendingState[1];

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
  const pauseText = customer.paused || customer.active === false
    ? (customer.pauseTo ? "Meals paused until " + customer.pauseTo : "Meals paused")
    : "";

  function actionLabel(intent) {
    if (intent === "pause_meals") return "Pause Meals";
    if (intent === "resume_meals") return "Resume Meals";
    if (intent === "meal_change") return "Meal Change";
    if (intent === "address_change") return "Address Change";
    return "Unsupported";
  }

  function dateLine(extraction) {
    if (!extraction) return "";
    if (extraction.intent === "pause_meals") {
      return (extraction.startDate || "-") + " to " + (extraction.endDate || "-");
    }
    return extraction.effectiveDate || extraction.resumeDate || extraction.startDate || "-";
  }

  function requestedLine(extraction) {
    if (!extraction) return "";
    if (extraction.intent === "meal_change") return extraction.mealPreference || "-";
    if (extraction.intent === "address_change") return extraction.address || "-";
    if (extraction.intent === "pause_meals") return "Pause meals";
    return "Resume meals";
  }

  async function sendAiMessage() {
    var text = aiInput.trim();
    if (!text || aiBusy || !extractMaaAiIntent) return;
    setAiBusy(true);
    setAiErr("");
    setAiPending("");
    setAiDraft(null);
    setAiMessages(function(prev){ return prev.concat([{ role: "user", text: text }]); });
    try {
      var result = await extractMaaAiIntent(text);
      if (!result || result.supported === false) {
        setAiMessages(function(prev){ return prev.concat([{ role: "assistant", text: (result && result.message) || "This request is not supported yet." }]); });
        return;
      }
      if (result.needsClarification) {
        setAiMessages(function(prev){ return prev.concat([{ role: "assistant", text: result.clarificationQuestion || "Please clarify this request." }]); });
        return;
      }
      var draft = Object.assign({}, result.extraction, {
        originalText: text,
        confirmationText: result.confirmationText,
      });
      setAiDraft(draft);
      setAiMessages(function(prev){ return prev.concat([{ role: "assistant", text: result.confirmationText || "Please confirm this request." }]); });
    } catch (error) {
      setAiErr(error.message || "Could not understand that message.");
    } finally {
      setAiInput("");
      setAiBusy(false);
    }
  }

  async function confirmAiDraft() {
    if (!aiDraft || aiBusy || !confirmMaaAiAction) return;
    setAiBusy(true);
    setAiErr("");
    try {
      var result = await confirmMaaAiAction({
        text: aiDraft.originalText,
        extraction: aiDraft,
      });
      setAiPending((result && result.approvalId) || "pending");
      setAiMessages(function(prev){ return prev.concat([{ role: "assistant", text: (result && result.customerMessage) || "Sent to the manager for approval." }]); });
      setAiDraft(null);
    } catch (error) {
      setAiErr(error.message || "Could not send this for approval.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-50" style={{fontFamily:"'Inter', system-ui, sans-serif"}}>
      <div className="bg-amber-500 px-4 pt-5 pb-5 flex-shrink-0 relative">
        <button onClick={logout} className="absolute top-5 right-4 text-xs font-bold text-amber-200 border border-amber-400 px-2 py-1 rounded-lg">Logout</button>
        <p className="text-amber-100 text-sm">Welcome back</p>
        <p className="text-white text-2xl font-black mt-0.5">Hi, {customer.name.split(" ")[0]}!</p>
        <p className="text-amber-200 text-xs mt-0.5 truncate pr-16">{customer.group || "Maa Sharda"} · {customer.address}</p>
      </div>

      <div className="bg-white border-b border-stone-100 flex flex-shrink-0 shadow-sm">
        {[
          { id: "home", label: "Home" },
          { id: "menu", label: "Menu" },
          { id: "chat", label: "Chat" },
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

             {pauseText && (
               <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 shadow-sm">
                 <p className="text-xs font-bold text-red-700">{pauseText}</p>
                 {customer.resumeDate && <p className="text-xs text-red-400 mt-0.5">Resume date: {customer.resumeDate}</p>}
               </div>
             )}

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

         {tab === "chat" && (
           <div className="space-y-3">
             <div className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm space-y-3">
               {aiMessages.map(function(message, index) {
                 return (
                   <div key={index} className={message.role === "user" ? "text-right" : "text-left"}>
                     <div className={"inline-block max-w-[92%] rounded-2xl px-4 py-3 text-sm font-medium whitespace-pre-wrap " + (message.role === "user" ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-700")}>{message.text}</div>
                   </div>
                 );
               })}
               {aiDraft && (
                 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                   <div className="grid grid-cols-2 gap-2 text-xs text-stone-700">
                     <div className="bg-white rounded-xl p-2">Intent: <span className="font-bold">{actionLabel(aiDraft.intent)}</span></div>
                     <div className="bg-white rounded-xl p-2">Confidence: <span className="font-bold">{Math.round((aiDraft.confidence || 0) * 100)}%</span></div>
                     <div className="bg-white rounded-xl p-2 col-span-2">Requested: <span className="font-bold">{requestedLine(aiDraft)}</span></div>
                     <div className="bg-white rounded-xl p-2 col-span-2">Effective: <span className="font-bold">{dateLine(aiDraft)}</span></div>
                     <div className="bg-white rounded-xl p-2 col-span-2">Reason: <span className="font-bold">{aiDraft.reason || "-"}</span></div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={function(){setAiDraft(null);}} disabled={aiBusy} className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 text-sm font-black disabled:opacity-50">Cancel</button>
                     <button onClick={confirmAiDraft} disabled={aiBusy} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-black disabled:opacity-50">Confirm</button>
                   </div>
                 </div>
               )}
               {aiPending && (
                 <div className="rounded-2xl bg-green-50 border border-green-100 p-3 text-sm text-green-700 font-semibold">Waiting for manager approval.</div>
               )}
               {aiErr && <p className="text-xs text-red-600 font-semibold">{aiErr}</p>}
               <div className="flex gap-2">
                 <input className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50" placeholder="Message Maa AI" value={aiInput} onChange={function(e){setAiInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")sendAiMessage();}} />
                 <button onClick={sendAiMessage} disabled={aiBusy || !aiInput.trim()} className="px-4 rounded-xl font-black text-sm bg-amber-500 text-white disabled:opacity-50">Send</button>
               </div>
             </div>
           </div>
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
