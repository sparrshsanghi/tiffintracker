import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin, Package, CheckCircle2, ChevronDown, ChevronUp,
  Phone, Bell, CreditCard, Home, Building2, UtensilsCrossed,
  Users, AlertCircle
} from "lucide-react";
import {
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
  signInWithCustomToken,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { CustomerView, BrandLogo } from "./src/Views.jsx";
import { getDefaultFood } from "./src/components/customer/customerUtils.js";
import { AuthScreen } from "./src/components/auth/AuthScreen.jsx";
import { OnboardingScreen } from "./src/components/onboarding/OnboardingScreen.jsx";
import { MenuPlanner } from "./src/components/manager/MenuPlanner.jsx";
import { ManagerHeader } from "./src/components/manager/ManagerHeader.jsx";
import { ManagerNav } from "./src/components/manager/ManagerNav.jsx";
import { DashboardTab } from "./src/components/manager/DashboardTab.jsx";
import { DeliveryTab } from "./src/components/manager/DeliveryTab.jsx";
import { CustomersTab } from "./src/components/manager/CustomersTab.jsx";
import { AiInboxTab } from "./src/components/manager/AiInboxTab.jsx";
import { PaymentsTab } from "./src/components/manager/PaymentsTab.jsx";
import { SettingsTab } from "./src/components/manager/SettingsTab.jsx";
import { DeleteConfirmModal } from "./src/components/manager/DeleteConfirmModal.jsx";
import { CustomerFormModal } from "./src/components/manager/CustomerFormModal.jsx";
import {
  TODAY, CUR_MON, TODAY_STR, DATE_STR, TODAY_IDX, DAYS,
  THIS_WEEK, fmt, waTo, makeOrders, emptyWeek, DST, PST, INP,
  getMonday, weekDates, weekRange, monLabel, prevMon, nextMon
} from "./src/components/manager/managerUtils.js";
import {
  db, auth, BUSINESS_ID,
  confirmPaymentCallable,
  startOnboardingCallable,
  saveOnboardingDraftCallable,
  confirmOnboardingCallable,
  listOnboardingQueueCallable,
  resolveOnboardingApprovalCallable,
  extractMaaAiIntentCallable,
  createMaaAiPendingActionCallable,
  listMaaAiPendingActionsCallable,
  resolveMaaAiPendingActionCallable,
  listCustomerTimelineCallable,
  createManagerTokenCallable,
  createCustomerTokenCallable,
  changePINCallable
} from "./src/firebase";

// Browser-compatible SHA-256 hash helper
async function hashPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(pin));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}


// ─── Seed data (DEV only) ─────────────────────────────────────────────────────
var SEED_C = import.meta.env.DEV ? [
  { id:"dev1", name:"Priya Sharma",  phone:"9876543210", address:"Sector 5, Near Park",   plan:"monthly", food:"Veg Thali + Roti",      rate:2500, active:true },
  { id:"dev2", name:"Rahul Verma",   phone:"9812345678", address:"MG Road, Flat 3B",      plan:"daily",   food:"Dal Chawal + Sabzi",    rate:3000, active:true },
] : [];
var SEED_P = {};
var SEED_MENU = {};

// AuthScreen, OnboardingScreen, and MenuPlanner have been extracted to src/components/


function ManagerView(props) {
  var customers=props.customers, setCustomers=props.setCustomers;
  var orders=props.orders, setOrders=props.setOrders;
  var payments=props.payments, menu=props.menu, setMenuWeek=props.setMenuWeek;
  var stats=props.stats, payStats=props.payStats;
  var getPaid=props.getPaid, getPayStat=props.getPayStat;
  var addPayment=props.addPayment, removePayment=props.removePayment;
  var resetDay=props.resetDay, advanceStatus=props.advanceStatus;
  var curMonth=props.curMonth;
  var setMgrPin=props.setMgrPin;
  var onboardingPromptVersion=props.onboardingPromptVersion || "onboarding.v1";
  var saveOnboardingPromptVersion=props.saveOnboardingPromptVersion;
  var managerPin=props.managerPin || "";
  var managerAuthenticated=props.managerAuthenticated === true;
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
  var nmS=useState(""); var newMP=nmS[0],setNewMP=nmS[1];
  var psS=useState(false); var pinSaved=psS[0],setPinSaved=psS[1];
  var dcS=useState(null); var delConfirm=dcS[0],setDelConfirm=dcS[1];
  var wgS=useState(props.whatsappGroup||""); var wg=wgS[0],setWg=wgS[1];
  var opvS=useState(onboardingPromptVersion); var onboardingVersion=opvS[0],setOnboardingVersion=opvS[1];
  var oqS=useState([]); var onboardingQueue=oqS[0],setOnboardingQueue=oqS[1];
  var oqLoadS=useState(false); var onboardingQueueLoading=oqLoadS[0],setOnboardingQueueLoading=oqLoadS[1];
  var oqErrS=useState(""); var onboardingQueueError=oqErrS[0],setOnboardingQueueError=oqErrS[1];
  var oqPinS=useState(managerPin); var onboardingQueuePin=oqPinS[0],setOnboardingQueuePin=oqPinS[1];
  var oqNoteS=useState({}); var onboardingNotes=oqNoteS[0],setOnboardingNotes=oqNoteS[1];
  var oqBusyS=useState(""); var onboardingBusyId=oqBusyS[0],setOnboardingBusyId=oqBusyS[1];
  var aiqS=useState([]); var aiActionQueue=aiqS[0],setAiActionQueue=aiqS[1];
  var aiqNoteS=useState({}); var aiActionNotes=aiqNoteS[0],setAiActionNotes=aiqNoteS[1];
  var aiqBusyS=useState(""); var aiActionBusyId=aiqBusyS[0],setAiActionBusyId=aiqBusyS[1];
  var oqAutoLoadRef=useRef(false);
  
  useEffect(function() { setWg(props.whatsappGroup||""); }, [props.whatsappGroup]);
  useEffect(function() { setOnboardingVersion(onboardingPromptVersion); }, [onboardingPromptVersion]);
  useEffect(function() {
    if (managerPin) {
      setOnboardingQueuePin(managerPin);
    }
  }, [managerPin]);
  useEffect(function() {
    if ((managerPin || managerAuthenticated) && !oqAutoLoadRef.current) {
      oqAutoLoadRef.current = true;
      loadAiInbox(managerPin);
    }
  }, [managerPin, managerAuthenticated]);

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

  function setTab(t) {
    if (window.history.pushState) window.history.pushState(null, null, '#' + t);
    else window.location.hash = t;
    setTabState(t);
  }
  function setShowForm(v) {
    var h = v ? "form/" + tab : tab;
    if (window.history.pushState) window.history.pushState(null, null, '#' + h);
    else window.location.hash = h;
    setShowFormState(v);
  }

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

  // togglePause: pause branches target c.id only; resume branch guards x.id === c.id
  function togglePause(c, pauseFrom, pauseTo) {
    if (c.active !== false && !c.paused) {
      // pauseFrom/pauseTo provided by inline UI in CustomersTab
      setCustomers(customers.map(function(x) {
        return x.id === c.id
          ? Object.assign({}, x, { paused: true, pauseFrom: pauseFrom || TODAY.split("T")[0], pauseTo: pauseTo || "" })
          : x;
      }));
      setOrders(orders.filter(function(o) { return o.id !== c.id; }));
    } else {
      // Resume: only update the matching customer
      setCustomers(customers.map(function(x) {
        if (x.id !== c.id) return x;
        var copy = Object.assign({}, x, { active: true, paused: false, pauseFrom: "", pauseTo: "" });
        delete copy.resumeDate;
        return copy;
      }));
      setOrders(orders.concat([{ id: c.id, status: "pending" }]));
    }
  }

  function confirmDel(id) {
    // Delegate entirely to DeleteConfirmModal — no double-click race
    setCustomers(customers.filter(function(c) { return c.id !== id; }));
    setOrders(orders.filter(function(o) { return o.id !== id; }));
    setDelConfirm(null);
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
    if(newMP.length>=4) { props.setMgrPin(newMP); saved = true; }
    if(wg !== props.whatsappGroup) { props.saveWhatsappGroup(wg); saved = true; }
    if(onboardingVersion !== onboardingPromptVersion && saveOnboardingPromptVersion) { saveOnboardingPromptVersion(onboardingVersion); saved = true; }
    if(saved) { setPinSaved(true); setTimeout(function(){setPinSaved(false);},2000); }
  }

  async function loadAiInbox(pinOverride) {
    var pin = String(pinOverride || onboardingQueuePin || "").trim();
    if (!pin && !managerAuthenticated) {
      setOnboardingQueueError("Enter the manager PIN to load AI Inbox.");
      return;
    }
    setOnboardingQueueLoading(true);
    setOnboardingQueueError("");
    try {
      const payload = pin ? { pin: pin } : {};
      const results = await Promise.all([
        listMaaAiPendingActionsCallable(payload),
        listOnboardingQueueCallable(payload),
      ]);
      setAiActionQueue(results[0].data.items || []);
      setOnboardingQueue(results[1].data.items || []);
    } catch (error) {
      setOnboardingQueueError(error.message || "Could not load AI Inbox.");
    } finally {
      setOnboardingQueueLoading(false);
    }
  }

  async function resolveOnboardingItem(approvalId, action) {
    var pin = String(onboardingQueuePin || managerPin || "").trim();
    if (!pin && !managerAuthenticated) {
      setOnboardingQueueError("Enter the manager PIN to resolve onboarding approvals.");
      return;
    }
    setOnboardingBusyId(approvalId);
    setOnboardingQueueError("");
    try {
      await resolveOnboardingApprovalCallable({
        ...(pin ? { pin: pin } : {}),
        approvalId: approvalId,
        action: action,
        managerNote: onboardingNotes[approvalId] || "",
      });
      await loadAiInbox(pin);
    } catch (error) {
      setOnboardingQueueError(error.message || "Could not resolve onboarding approval.");
    } finally {
      setOnboardingBusyId("");
    }
  }

  async function resolveMaaAiItem(approvalId, action) {
    var pin = String(onboardingQueuePin || managerPin || "").trim();
    if (!pin && !managerAuthenticated) {
      setOnboardingQueueError("Enter the manager PIN to resolve AI actions.");
      return;
    }
    setAiActionBusyId(approvalId);
    setOnboardingQueueError("");
    try {
      await resolveMaaAiPendingActionCallable({
        ...(pin ? { pin: pin } : {}),
        approvalId: approvalId,
        action: action,
        managerNote: aiActionNotes[approvalId] || "",
      });
      await loadAiInbox(pin);
    } catch (error) {
      setOnboardingQueueError(error.message || "Could not resolve AI action.");
    } finally {
      setAiActionBusyId("");
    }
  }

  var todayMenuData = menu[THIS_WEEK] ? menu[THIS_WEEK][TODAY_IDX] : null;

  // payC: customers eligible for payment tracking, filtered by payFilter
  var payC = useMemo(function() {
    var active = customers.filter(function(c) { return c.active && c.rate > 0; });
    if (payFilter === "all") return active;
    return active.filter(function(c) {
      var s = getPayStat(c.id, payMonth, c.rate);
      return s === payFilter;
    });
  }, [customers, payments, payMonth, payFilter]);

  var TABS = [
    {id:"dashboard",icon:"📊",label:"Overview"},
    {id:"orders",   icon:"🚴",label:"Delivery"},
    {id:"customers",icon:"👥",label:"Customers"},
    {id:"onboarding",icon:"💬",label:"AI Inbox",badge:onboardingQueue.length + aiActionQueue.length},
    {id:"payments", icon:"💰",label:"Payments"},
    {id:"menu",     icon:"📋",label:"Menu"},
    {id:"settings", icon:"⚙️", label:"Settings"},
  ];

  return (
    <div className="min-h-screen bg-orange-50" style={{fontFamily:"system-ui,sans-serif"}}>
      <ManagerHeader stats={stats} />

      <ManagerNav tabs={TABS} active={tab} onTab={setTab} />

      <div className="p-4 max-w-lg mx-auto pb-8">

        {tab==="dashboard" && (
          <DashboardTab
            stats={stats}
            todayMenuData={todayMenuData}
            payStats={payStats}
            setTab={setTab}
            openAdd={openAdd}
            onResetDay={props.onResetDay}
          />
        )}

        {tab==="orders" && (
          <DeliveryTab
            orders={orders}
            customers={customers}
            onResetDay={props.onResetDay}
            advanceStatus={advanceStatus}
          />
        )}

        {tab==="customers" && (
          <CustomersTab
            customers={customers}
            openAdd={openAdd}
            openEdit={openEdit}
            togglePause={togglePause}
            setDelConfirm={setDelConfirm}
          />
        )}

        {tab==="onboarding" && (
          <AiInboxTab
            onboardingQueue={onboardingQueue}
            aiActionQueue={aiActionQueue}
            loadAiInbox={loadAiInbox}
            onboardingQueueLoading={onboardingQueueLoading}
            managerPin={managerPin}
            managerAuthenticated={managerAuthenticated}
            onboardingQueuePin={onboardingQueuePin}
            setOnboardingQueuePin={setOnboardingQueuePin}
            onboardingQueueError={onboardingQueueError}
            onboardingPromptVersion={onboardingPromptVersion}
            aiActionNotes={aiActionNotes}
            setAiActionNotes={setAiActionNotes}
            onboardingNotes={onboardingNotes}
            setOnboardingNotes={setOnboardingNotes}
            aiActionBusyId={aiActionBusyId}
            onboardingBusyId={onboardingBusyId}
            resolveMaaAiItem={resolveMaaAiItem}
            resolveOnboardingItem={resolveOnboardingItem}
          />
        )}

        {tab==="payments" && (
          <PaymentsTab
            payMonth={payMonth}
            setPayMonth={setPayMonth}
            curMonth={curMonth}
            pmStats={pmStats}
            payFilter={payFilter}
            setPayFilter={setPayFilter}
            payC={payC}
            getPaid={getPaid}
            getPayStat={getPayStat}
            payments={payments}
            confirmFull={confirmFull}
            confirmPartial={confirmPartial}
            removePayment={removePayment}
            showPart={showPart}
            setShowPart={setShowPart}
            payAmt={payAmt}
            setPayAmt={setPayAmt}
          />
        )}

        {tab==="menu" && <MenuPlanner menu={menu} setMenuWeek={setMenuWeek}/>}

        {tab==="settings" && (
          <SettingsTab
            newMP={newMP}
            setNewMP={setNewMP}
            onboardingVersion={onboardingVersion}
            setOnboardingVersion={setOnboardingVersion}
            wg={wg}
            setWg={setWg}
            savePins={savePins}
            pinSaved={pinSaved}
            logout={logout}
          />
        )}
      </div>

      <DeleteConfirmModal
        delConfirm={delConfirm}
        customers={customers}
        setDelConfirm={setDelConfirm}
        confirmDel={confirmDel}
      />

      <CustomerFormModal
        showForm={showForm}
        setShowForm={setShowForm}
        editId={editId}
        form={form}
        setForm={setForm}
        save={save}
      />
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
  const [notifs, setNotifs] = useState({});
  const [customerTimeline, setCustomerTimeline] = useState([]);
  const [customerTimelineLoading, setCustomerTimelineLoading] = useState(false);
  const [custPhone, setCustPhone] = useState("");
  const [whatsappGroup, setWhatsappGroup] = useState("");
  const [onboardingPromptVersion, setOnboardingPromptVersion] = useState("onboarding.v1");
  const [onboardingPhone, setOnboardingPhone] = useState("");

  const [mgrPinHash, setMgrPinHash] = useState("");
  const [mgrSessionPin, setMgrSessionPin] = useState("");

  const [mgrInput, setMgrInput] = useState("");
  const [mgrErr, setMgrErr] = useState(false);
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

  // ─── Firebase Custom Token Auth ───────────────────────────────────────────
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [authClaims, setAuthClaims] = useState(null);
  const [claimRole, setClaimRole] = useState("");
  const [settingsReady, setSettingsReady] = useState(false);
  const [customersReady, setCustomersReady] = useState(false);

  function getRoleFromClaims(claims) {
    if (!claims) return "";
    if (claims.manager === true || claims.role === "manager") return "manager";
    if (claims.role === "customer") return "customer";
    if (claims.role === "prospect") return "prospect";
    return "";
  }

  function applyClaimSession(claims) {
    const nextRole = getRoleFromClaims(claims);
    const phone = normalizePhone(claims?.phone || claims?.phone_number || "");
    setClaimRole(nextRole);

    if (nextRole === "manager") {
      sessionStorage.setItem("tiffin_role", "manager");
      setRole("manager");
      setScreen("app");
      return;
    }

    if (nextRole === "customer") {
      if (phone) {
        sessionStorage.setItem("tiffin_phone", phone);
        setCustPhone(phone);
      }
      sessionStorage.setItem("tiffin_role", "customer");
      setRole("customer");
      setScreen("app");
      return;
    }

    if (nextRole === "prospect") {
      if (phone) {
        sessionStorage.setItem("tiffin_phone", phone);
        setOnboardingPhone(phone);
      }
      sessionStorage.setItem("tiffin_role", "prospect");
      setRole(null);
      setScreen("onboarding");
    }
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setFirebaseUid(null);
          setAuthClaims(null);
          setClaimRole("");
          setAuthReady(true);
          return;
        }

        const tokenResult = await user.getIdTokenResult();
        const claims = tokenResult.claims || {};
        setFirebaseUid(user.uid);
        setAuthClaims(claims);
        applyClaimSession(claims);
      } catch (e) {
        console.error("Firebase auth bridge failed:", e);
        setFirebaseUid(null);
        setAuthClaims(null);
        setClaimRole("");
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsubAuth();
  }, []);

  // ─── Real-time Sync ────────────────────────────────────────────────────────
  useEffect(() => {
    const activeRole = getRoleFromClaims(authClaims);
    if (!firebaseUid || !activeRole) return;

    const unsubscribers = [];
    const toCustomer = (docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        name: d.name,
        phone: d.phone,
        address: d.address,
        plan: d.plan,
        food: d.food,
        rate: d.rate,
        active: d.active,
        paused: d.paused || false,
        pauseFrom: d.pauseFrom || "",
        pauseTo: d.pauseTo || "",
        group: d.group || "",
        deliveryOrder: d.deliveryOrder,
        resumeDate: d.resumeDate,
        lastReadAt: d.lastReadAt
      };
    };

    const dateKey = TODAY;
    const orderDocRef = doc(db, "businesses", BUSINESS_ID, "orders", dateKey);
    const attachOrders = () => onSnapshot(orderDocRef, (snapshot) => {
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

    const menuQuery = collection(db, "businesses", BUSINESS_ID, "menu");
    const attachMenu = () => onSnapshot(menuQuery, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data().days || [];
      });
      setMenu(data);
    });

    if (activeRole === "manager") {
      const customersQuery = collection(db, "businesses", BUSINESS_ID, "customers");
      unsubscribers.push(onSnapshot(customersQuery, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push(toCustomer(docSnap));
        });
        setCust(list);
        setCustomersReady(true);
      }, (error) => {
        console.error("Customer sync failed:", error);
        setCust(SEED_C);
        setCustomersReady(true);
      }));

      unsubscribers.push(attachOrders());

      const paymentsQuery = collection(db, "businesses", BUSINESS_ID, "payments");
      unsubscribers.push(onSnapshot(paymentsQuery, (snapshot) => {
        const data = {};
        snapshot.forEach((docSnap) => {
          const stateKey = docSnap.id.replace("_", "-");
          data[stateKey] = docSnap.data().records || [];
        });
        setPays(data);
      }));

      unsubscribers.push(attachMenu());

      const settingsDocRef = doc(db, "businesses", BUSINESS_ID, "config", "settings");
      unsubscribers.push(onSnapshot(settingsDocRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setMgrPinHash(data.mgrPinHash || "");
          setWhatsappGroup(data.whatsappGroup || "");
          setOnboardingPromptVersion(data.onboardingPromptVersion || "onboarding.v1");
          setSettingsReady(Boolean(data.mgrPinHash));
        } else {
          const defaultMgrHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
          try {
            await setDoc(settingsDocRef, {
              mgrPinHash: defaultMgrHash,
              businessName: "Maa Sharda",
              onboardingPromptVersion: "onboarding.v1",
              createdAt: new Date()
            });
          } catch (error) {
            console.error("Settings seed failed:", error);
          }
          setMgrPinHash(defaultMgrHash);
          setOnboardingPromptVersion("onboarding.v1");
          setSettingsReady(true);
        }
      }, (error) => {
        console.error("Settings sync failed:", error);
        setMgrPinHash("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
        setOnboardingPromptVersion("onboarding.v1");
        setSettingsReady(true);
      }));
    } else if (activeRole === "customer") {
      const customerId = String(authClaims?.customerId || "");
      if (!customerId) {
        setCust([]);
        setCustomersReady(true);
        setSettingsReady(true);
        return;
      }

      const customerDocRef = doc(db, "businesses", BUSINESS_ID, "customers", customerId);
      unsubscribers.push(onSnapshot(customerDocRef, (snapshot) => {
        setCust(snapshot.exists() ? [toCustomer(snapshot)] : []);
        setCustomersReady(true);
      }, (error) => {
        console.error("Customer profile sync failed:", error);
        setCust([]);
        setCustomersReady(true);
      }));

      unsubscribers.push(attachOrders());

      const paymentDocRef = doc(db, "businesses", BUSINESS_ID, "payments", `${customerId}_${CUR_MON}`);
      unsubscribers.push(onSnapshot(paymentDocRef, (snapshot) => {
        setPays(snapshot.exists() ? { [`${customerId}-${CUR_MON}`]: snapshot.data().records || [] } : {});
      }));

      unsubscribers.push(attachMenu());
      setSettingsReady(true);
    } else if (activeRole === "prospect") {
      setCust([]);
      setOrds([]);
      setPays({});
      setSettingsReady(true);
      setCustomersReady(true);
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [firebaseUid, authClaims]);

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

  useEffect(() => {
    const customerId = String(authClaims?.customerId || "");
    if (role !== "customer" || !firebaseUid || !customerId) {
      setCustomerTimeline([]);
      return;
    }
    loadCustomerTimeline(customerId);
  }, [role, firebaseUid, authClaims?.customerId]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  async function loginMgr() {
    const lockStatus = checkLockout("tiffin_mgr_lockout");
    if (lockStatus.locked) {
      setMgrLockMsg(`Too many attempts. Try again in ${lockStatus.secs}s.`);
      setMgrErr(true);
      return;
    }
    setMgrLockMsg("");
    try {
      const result = await createManagerTokenCallable({ pin: mgrInput });
      const token = result.data?.token;
      if (!token) throw new Error("Manager token was not returned.");
      await signInWithCustomToken(auth, token);
      clearLockout("tiffin_mgr_lockout");
      setMgrErr(false);
      setMgrLockMsg("");
      sessionStorage.setItem("tiffin_role", "manager");
      sessionStorage.removeItem("tiffin_pin_hash");
      setMgrSessionPin(mgrInput);
      setMgrInput("");
      setRole("manager");
      setScreen("app");
    } catch (error) {
      const isInvalidPin = error?.code === "functions/permission-denied" || error?.details?.code === "INVALID_MANAGER_PIN";
      if (isInvalidPin) {
        recordFailedAttempt("tiffin_mgr_lockout", 5, 60000);
        const ls = checkLockout("tiffin_mgr_lockout");
        const attemptsLeft = 5 - ls.attempts;
        setMgrLockMsg(ls.locked ? `Too many attempts. Try again in ${ls.secs}s.` : `Incorrect PIN. Please try again. Attempts remaining: ${attemptsLeft}`);
      } else {
        setMgrLockMsg(error.message || "Manager login failed.");
      }
      setMgrErr(true);
    }
  }

  async function loginCust() {
    const now = Date.now();
    if (now < custLockedUntil) {
      const secs = Math.ceil((custLockedUntil - now) / 1000);
      setPhonErr(true);
      return;
    }
    const ph = normalizePhone(phoneInput);
    if (ph.length !== 10) {
      setPhonErr(true);
      return;
    }
    try {
      const result = await createCustomerTokenCallable({ phone: ph });
      const data = result.data || {};
      if (!data.token) throw new Error("Customer token was not returned.");
      await signInWithCustomToken(auth, data.token);
      setPhonErr(false);
      setCustAttempts(0);
      setCustLockedUntil(0);
      sessionStorage.setItem("tiffin_phone", ph);
      if (data.role === "customer") {
        sessionStorage.setItem("tiffin_role", "customer");
        setCustPhone(ph);
        setRole("customer");
        setScreen("app");
      } else if (data.role === "prospect") {
        sessionStorage.setItem("tiffin_role", "prospect");
        setOnboardingPhone(ph);
        setRole(null);
        setScreen("onboarding");
      } else {
        throw new Error("Unsupported customer identity.");
      }
    } catch (error) {
      console.error("Customer login failed:", error);
      setPhonErr(true);
    }
  }

  async function logout() {
    sessionStorage.removeItem("tiffin_role");
    sessionStorage.removeItem("tiffin_pin_hash");  // was: tiffin_userpin
    sessionStorage.removeItem("tiffin_phone");
    sessionStorage.removeItem("tiffin_onboard_session");
    sessionStorage.removeItem("tiffin_onboard_draft");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase sign-out failed:", error);
    }
    setFirebaseUid(null);
    setAuthClaims(null);
    setClaimRole("");
    setMgrSessionPin("");
    setRole(null);
    setScreen("roleSelect");
    setPhoneInput("");
    setCustPhone("");
    setCustomerTimeline([]);
    setOnboardingPhone("");
    setMgrInput("");
    setMgrErr(false);
    setPhonErr(false);
    setMgrLockMsg("");
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
      let pin = mgrSessionPin;
      if (!pin) {
        pin = window.prompt("Enter manager PIN to confirm payment:");
        if (!pin) return;
      }
      await confirmPaymentCallable({
        pin,
        customerId: String(cid),
        amount: amt,
      });
      setMgrSessionPin(pin);
    } catch (e) {
      console.error(e);
      alert("Error confirming payment: " + e.message);
    }
  }

  async function loadCustomerTimeline(customerId) {
    if (!customerId) return;
    setCustomerTimelineLoading(true);
    try {
      const result = await listCustomerTimelineCallable({ customerId: String(customerId) });
      const items = result.data?.items || [];
      setCustomerTimeline(items);
    } catch (error) {
      console.error("Timeline sync failed:", error);
      setCustomerTimeline([]);
    } finally {
      setCustomerTimelineLoading(false);
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
        paused: c.paused || false,
        pauseFrom: c.pauseFrom || "",
        pauseTo: c.pauseTo || "",
        resumeDate: c.resumeDate || "",
        createdAt: c.createdAt || new Date()
      }, { merge: true });
    }
  }

  async function updateMgrPin(newPin) {
    try {
      if (!mgrSessionPin) {
        alert("Please log out and log back in before changing the manager PIN.");
        return;
      }
      await changePINCallable({ currentPin: mgrSessionPin, newPin, target: "manager" });
      setMgrSessionPin(newPin);
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
      if (c.paused === true && (!c.pauseFrom || !c.pauseTo)) return false;
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

  async function openApprovedCustomer(phone) {
    const ph = normalizePhone(phone);
    setOnboardingPhone("");
    setPhoneInput(ph);
    try {
      const result = await createCustomerTokenCallable({ phone: ph });
      const data = result.data || {};
      if (!data.token || data.role !== "customer") {
        setScreen("custAuth");
        return;
      }
      await signInWithCustomToken(auth, data.token);
      setPhonErr(false);
      setCustPhone(ph);
      sessionStorage.setItem("tiffin_role", "customer");
      sessionStorage.setItem("tiffin_phone", ph);
      setRole("customer");
      setScreen("app");
    } catch (error) {
      console.error("Approved customer bridge failed:", error);
      setScreen("custAuth");
    }
  }

  if (screen === "roleSelect") {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get("role");
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6" style={{ fontFamily: "var(--font-sans)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 flex flex-col items-center">
            <BrandLogo className="w-20 h-20 mb-3" />
            <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground">Maa Sharda</h1>
            <div className="bg-secondary text-primary rounded-full px-4 py-0.5 inline-block mt-1 font-bold text-[11px]">अब पेट भरेगा, मन नहीं</div>
            <p className="text-muted-foreground mt-6 text-[10px] font-bold uppercase tracking-wider">Select your role to continue</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: "👔", title: "Business Owner", sub: "Full access dashboard", fn: function () { setScreen("mgrAuth"); }, highlight: roleParam === "manager" },
              { icon: "👤", title: "I'm a Customer", sub: "My order & payments", fn: function () { setScreen("custAuth"); }, highlight: roleParam === "customer" }
            ].map(function (r) {
              return (
                <button
                  key={r.title}
                  onClick={r.fn}
                  className={"w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-sm border border-border" + (r.highlight ? " ring-2 ring-primary" : "") + " transition-all text-left hover:bg-secondary/40"}
                >
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{r.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.sub}</p>
                  </div>
                  <span className="text-muted-foreground text-lg" aria-hidden="true">›</span>
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
  if (screen === "custAuth") {
    const isLocked = Date.now() < custLockedUntil;
    const lockSecs = isLocked ? Math.ceil((custLockedUntil - Date.now()) / 1000) : 0;
    const custErrMsg = phonErr
      ? (isLocked ? `Too many attempts. Wait ${lockSecs}s before trying again.` : "Number not registered. Contact your tiffin owner.")
      : null;
    return <AuthScreen icon="👤" title="Customer Portal" subtitle="Enter your registered phone number" hdr="bg-green-600" btn="bg-green-600 hover:bg-green-700" value={phoneInput} onChange={setPhoneInput} error={custErrMsg} onBack={function () { setScreen("roleSelect"); setPhonErr(false); setCustAttempts(0); }} onSubmit={loginCust} hint="Use the phone number you gave the business owner" isPhone={true} />;
  }
  if (screen === "onboarding") {
    return <OnboardingScreen phone={onboardingPhone} onApproved={openApprovedCustomer} onClose={function () { setOnboardingPhone(""); setScreen("custAuth"); }} />;
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
        <ManagerView customers={cust} setCustomers={updateCustomersInFirestore} orders={displayOrders} setOrders={async () => {}} payments={pays} menu={menu} setMenuWeek={setMenuWeek} stats={stats} payStats={payStats} getPaid={getPaid} getPayStat={getPayStat} addPayment={addPayment} removePayment={removePayment} onResetDay={onResetDay} advanceStatus={advanceStatus} curMonth={CUR_MON} setMgrPin={updateMgrPin} managerPin={mgrSessionPin} managerAuthenticated={claimRole === "manager"} whatsappGroup={whatsappGroup} onboardingPromptVersion={onboardingPromptVersion} saveWhatsappGroup={async function(link) { const docRef = doc(db, "businesses", BUSINESS_ID, "config", "settings"); await setDoc(docRef, { whatsappGroup: link }, { merge: true }); setWhatsappGroup(link); }} saveOnboardingPromptVersion={async function(version) { const docRef = doc(db, "businesses", BUSINESS_ID, "config", "settings"); await setDoc(docRef, { onboardingPromptVersion: version }, { merge: true }); setOnboardingPromptVersion(version); }} logout={logout} />
      </div>
    );
  }

  if (role === "customer") {
    const c = cust.find((x) => x.phone === custPhone);
    const cNotifs = notifs[custPhone] || [];
    return (
      <CustomerView
        customer={c}
        customerLoading={!customersReady || !settingsReady}
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
        todayMenuLoading={todayMenu === null}
        weekMenu={weekMenu}
        timeline={customerTimeline}
        timelineLoading={customerTimelineLoading}
        loadTimeline={async function() {
          if (c) await loadCustomerTimeline(c.id);
        }}
        notificationsLoading={!customersReady || !settingsReady}
        extractMaaAiIntent={async function(text) {
          if (!c) throw new Error("Customer profile is not ready.");
          const result = await extractMaaAiIntentCallable({ text: text, customerId: c.id });
          return result.data;
        }}
        confirmMaaAiAction={async function(payload) {
          if (!c) throw new Error("Customer profile is not ready.");
          const result = await createMaaAiPendingActionCallable({
            text: payload.text,
            extraction: payload.extraction,
            customerId: c.id,
          });
          return result.data;
        }}
      />
    );
  }

  return null;
}
