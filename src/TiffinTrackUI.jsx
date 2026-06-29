import { useState } from "react";
import {
  MapPin, Package, CheckCircle2, ChevronDown, ChevronUp,
  Phone, Bell, CreditCard, Home, Building2, UtensilsCrossed,
  Users, AlertCircle, Bike, BriefcaseBusiness
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────
const INIT_COLS = [
  {
    id: "c1", name: "Shankar Nagar", area: "Civil Lines", landmark: "near Gate 2",
    members: [
      { id: "m1", houseNo: "H-12", name: "Rahul Sharma",  food: "Dal Tadka · Jeera Rice · Roti ×4", status: "packed" },
      { id: "m2", houseNo: "H-15", name: "Priya Verma",   food: "Rajma · Rice · Paratha ×3",        status: "pending" },
      { id: "m3", houseNo: "H-23", name: "Mohan Gupta",   food: "Kadhi Chawal · Roti ×4",           status: "delivered" },
      { id: "m4", houseNo: "H-45", name: "Deepa Singh",   food: "Dal Makhani · Rice · Naan ×2",     status: "pending" },
    ],
  },
  {
    id: "c2", name: "MIG Colony", area: "Pandri", landmark: "near Main Chowk",
    members: [
      { id: "m5", houseNo: "B-7",  name: "Suresh Yadav",  food: "Chole · Puri · Salad",             status: "pending" },
      { id: "m6", houseNo: "B-11", name: "Kavita Mishra", food: "Paneer Bhurji · Rice · Roti ×3",   status: "pending" },
    ],
  },
];

const INIT_INDIVS = [
  { id: "i1", name: "Anjali Tiwari",  address: "42 Gandhi Nagar, Sector 7", food: "Dal Tadka · Rice · Roti ×4",  status: "packed" },
  { id: "i2", name: "Vikram Sahu",    address: "7 Telibandha, Ring Road",   food: "Rajma · Roti ×3",             status: "pending" },
  { id: "i3", name: "Sunita Agarwal", address: "15 Nehru Nagar, Block C",   food: "Dal Makhani · Paratha ×2",    status: "delivered" },
];

const WEEK = [
  { day: "Mon", date: "23", items: "Dal Tadka · Jeera Rice · Roti ×4",      past: true },
  { day: "Tue", date: "24", items: "Rajma · Rice · Paratha ×3",             past: true },
  { day: "Wed", date: "25", items: "Chole · Puri · Salad",                  past: true },
  { day: "Thu", date: "26", items: "Kadhi · Rice · Roti ×4",               past: true },
  { day: "Fri", date: "27", items: "Paneer Bhurji · Rice · Roti ×3",       past: true },
  { day: "Sat", date: "28", items: "Dal Makhani · Rice · Naan ×2",         past: true },
  { day: "Sun", date: "29", items: "Dal Makhani · Jeera Rice · Roti ×4 · Raita", today: true },
];

// ─── Atoms ─────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { label: "Pending",   bg: "bg-red-100",   text: "text-red-700",   dot: "bg-red-400" },
  packed:    { label: "On way",    bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  delivered: { label: "Delivered", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
};

function Pill({ status }) {
  const s = STATUS[status];
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
      className="flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg">
      <Package size={11} /> Packed
    </button>
  ) : (
    <button onClick={onDelivered}
      className="flex items-center gap-1 text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg">
      <CheckCircle2 size={11} /> Delivered
    </button>
  );
}

function HouseTag({ no, done }) {
  return (
    <div className={`flex-shrink-0 rounded-md text-center px-2.5 py-1.5 min-w-[52px] ${done ? "bg-stone-100" : "bg-amber-900"}`}>
      <span className={`text-xs font-black font-mono tracking-wide ${done ? "text-stone-400" : "text-amber-100"}`}>
        {no}
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">{children}</p>
  );
}

// ─── Delivery View ──────────────────────────────────────────────────────
function DeliveryView({ cols, indivs, setCols, setIndivs }) {
  const [exp, setExp] = useState({ c1: true, c2: false });

  const setMember = (cid, mid, s) =>
    setCols(cs => cs.map(c => c.id !== cid ? c : {
      ...c, members: c.members.map(m => m.id !== mid ? m : { ...m, status: s }),
    }));

  const setIndiv = (id, s) =>
    setIndivs(is => is.map(i => i.id !== id ? i : { ...i, status: s }));

  const all = [...cols.flatMap(c => c.members), ...indivs];
  const done = all.filter(x => x.status === "delivered").length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats header */}
      <div className="bg-white border-b border-stone-100 px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">Today · Sun 29 Jun</p>
            <p className="text-xs text-stone-400 mt-0.5">{cols.length} colonies · {indivs.length} individual</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-stone-900 leading-none">
              {done}<span className="text-stone-300 font-normal text-base">/{total}</span>
            </p>
            <p className="text-xs text-stone-400">delivered</p>
          </div>
        </div>
        <div className="mt-2.5 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-6 space-y-2.5">
        <SectionLabel>Colonies</SectionLabel>

        {cols.map(col => {
          const colDone = col.members.filter(m => m.status === "delivered").length;
          const allDone = colDone === col.members.length;
          const open = exp[col.id];

          return (
            <div key={col.id}
              className={`rounded-2xl overflow-hidden border-2 ${allDone ? "border-green-200" : "border-amber-200"}`}>
              {/* Colony header */}
              <button
                onClick={() => setExp(e => ({ ...e, [col.id]: !open }))}
                className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-left ${allDone ? "bg-green-50" : "bg-amber-50"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${allDone ? "bg-green-100" : "bg-amber-100"}`}>
                  <Building2 size={18} className={allDone ? "text-green-600" : "text-amber-700"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${allDone ? "text-green-800" : "text-stone-800"}`}>{col.name}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={10} />{col.area} · {col.landmark}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allDone ? "bg-green-200 text-green-800" : "bg-amber-200 text-amber-900"}`}>
                    {colDone}/{col.members.length}
                  </span>
                  {open ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                </div>
              </button>

              {/* Member rows */}
              {open && (
                <div className="bg-white divide-y divide-stone-50">
                  {col.members.map(m => {
                    const isDone = m.status === "delivered";
                    return (
                      <div key={m.id} className={`px-3.5 py-3 transition-opacity ${isDone ? "opacity-40" : ""}`}>
                        <div className="flex items-start gap-2.5">
                          <HouseTag no={m.houseNo} done={isDone} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-stone-800">{m.name}</p>
                              <Pill status={m.status} />
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{m.food}</p>
                            {!isDone && (
                              <div className="mt-2 flex gap-2">
                                <MarkBtn
                                  status={m.status}
                                  onPacked={() => setMember(col.id, m.id, "packed")}
                                  onDelivered={() => setMember(col.id, m.id, "delivered")}
                                />
                                <button className="flex items-center gap-1 text-xs text-stone-400 border border-stone-200 px-2 py-1 rounded-lg">
                                  <Phone size={10} /> WA
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <SectionLabel>Individual</SectionLabel>

        {indivs.map(ind => {
          const isDone = ind.status === "delivered";
          return (
            <div key={ind.id}
              className={`bg-white rounded-2xl border border-stone-200 px-3.5 py-3 transition-opacity ${isDone ? "opacity-40" : ""}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Home size={17} className="text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold text-stone-800">{ind.name}</p>
                    <Pill status={ind.status} />
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="flex-shrink-0" />{ind.address}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">{ind.food}</p>
                  {!isDone && (
                    <div className="mt-2 flex gap-2">
                      <MarkBtn
                        status={ind.status}
                        onPacked={() => setIndiv(ind.id, "packed")}
                        onDelivered={() => setIndiv(ind.id, "delivered")}
                      />
                      <button className="flex items-center gap-1 text-xs text-stone-400 border border-stone-200 px-2 py-1 rounded-lg">
                        <Phone size={10} /> WA
                      </button>
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

// ─── Owner View ─────────────────────────────────────────────────────────
function OwnerView({ cols }) {
  const [tab, setTab] = useState("customers");
  const [exp, setExp] = useState({ c1: true, c2: false });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-stone-100 px-3 py-2 flex gap-1 flex-shrink-0">
        {["overview", "customers", "payments", "menu"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs font-bold py-1.5 rounded-lg capitalize transition-all ${tab === t ? "bg-stone-900 text-white" : "text-stone-400"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-6 space-y-2.5">

        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "10", l: "Customers", icon: <Users size={15} className="text-stone-500" />, bg: "bg-stone-50 border-stone-100" },
                { v: "6",  l: "Pending",   icon: <AlertCircle size={15} className="text-red-500" />, bg: "bg-red-50 border-red-100" },
                { v: "4",  l: "Delivered", icon: <CheckCircle2 size={15} className="text-green-500" />, bg: "bg-green-50 border-green-100" },
              ].map(s => (
                <div key={s.l} className={`rounded-xl p-3 text-center border ${s.bg}`}>
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="text-xl font-black text-stone-900">{s.v}</p>
                  <p className="text-xs text-stone-500">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs font-bold text-amber-900 mb-3">Colony progress today</p>
              {cols.map(c => {
                const done = c.members.filter(m => m.status === "delivered").length;
                const pct = Math.round((done / c.members.length) * 100);
                return (
                  <div key={c.id} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-stone-700">{c.name}</span>
                      <span className="font-bold text-amber-900">{done}/{c.members.length}</span>
                    </div>
                    <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-xl p-4 border border-stone-100">
              <p className="text-xs text-stone-400 font-medium mb-2">June 2026</p>
              <div className="flex justify-between">
                <div><p className="text-xl font-black text-stone-900">₹18,500</p><p className="text-xs text-stone-400">collected</p></div>
                <div className="text-right"><p className="text-xl font-black text-red-500">₹3,200</p><p className="text-xs text-stone-400">pending</p></div>
              </div>
            </div>
          </>
        )}

        {tab === "customers" && (
          <>
            <div className="flex gap-2">
              {[
                { v: "2", l: "Colonies",       cl: "bg-amber-50 border-amber-200 text-amber-900" },
                { v: "6", l: "Colony members", cl: "bg-stone-50 border-stone-100 text-stone-900" },
                { v: "3", l: "Individual",     cl: "bg-stone-50 border-stone-100 text-stone-900" },
              ].map(s => (
                <div key={s.l} className={`flex-1 rounded-xl px-2 py-2.5 text-center border ${s.cl.split(" ").slice(0,2).join(" ")}`}>
                  <p className={`text-xl font-black ${s.cl.split(" ")[2]}`}>{s.v}</p>
                  <p className="text-xs text-stone-400 leading-tight mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>

            <SectionLabel>Colonies</SectionLabel>

            {cols.map(col => (
              <div key={col.id} className="rounded-2xl overflow-hidden border-2 border-amber-100">
                <button onClick={() => setExp(e => ({ ...e, [col.id]: !e[col.id] }))}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 bg-amber-50 text-left">
                  <Building2 size={18} className="text-amber-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 text-sm">{col.name}</p>
                    <p className="text-xs text-stone-400 truncate">{col.area} · {col.members.length} members · {col.landmark}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="text-xs bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full"
                      onClick={e => e.stopPropagation()}>+ Add</button>
                    {exp[col.id] ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                  </div>
                </button>

                {exp[col.id] && (
                  <div className="bg-white">
                    <div className="px-3.5 py-1.5 bg-stone-50 border-b border-stone-100 flex gap-3">
                      <p className="text-xs font-bold text-stone-400 w-14">House</p>
                      <p className="text-xs font-bold text-stone-400 flex-1">Customer</p>
                      <p className="text-xs font-bold text-stone-400">Food</p>
                    </div>
                    {col.members.map(m => (
                      <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-stone-50 last:border-0">
                        <span className="text-xs font-black text-amber-900 font-mono bg-amber-50 px-2 py-0.5 rounded w-14 text-center flex-shrink-0">{m.houseNo}</span>
                        <p className="text-sm font-medium text-stone-800 flex-1">{m.name}</p>
                        <p className="text-xs text-stone-400">{m.food.split("·")[0].trim()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <SectionLabel>Individual</SectionLabel>

            {[
              { name: "Anjali Tiwari",  addr: "42 Gandhi Nagar, Sector 7" },
              { name: "Vikram Sahu",    addr: "7 Telibandha, Ring Road" },
              { name: "Sunita Agarwal", addr: "15 Nehru Nagar, Block C" },
            ].map(p => (
              <div key={p.name} className="bg-white rounded-xl border border-stone-100 px-3.5 py-3 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Home size={15} className="text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800">{p.name}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1 truncate"><MapPin size={10} />{p.addr}</p>
                </div>
              </div>
            ))}

            <button className="w-full border-2 border-dashed border-stone-200 rounded-2xl py-3 text-sm font-bold text-stone-400">
              + Add customer
            </button>
          </>
        )}

        {tab === "payments" && (
          <>
            {[
              { name: "Rahul Sharma",  sub: "H-12, Shankar Nagar", due: 2000, paid: 1500 },
              { name: "Priya Verma",   sub: "H-15, Shankar Nagar", due: 1800, paid: 1800 },
              { name: "Anjali Tiwari", sub: "42 Gandhi Nagar",      due: 2000, paid: 2000 },
              { name: "Vikram Sahu",   sub: "7 Telibandha",         due: 1600, paid: 800 },
              { name: "Suresh Yadav",  sub: "B-7, MIG Colony",      due: 1800, paid: 900 },
            ].map(p => {
              const full = p.paid >= p.due;
              const pct = Math.round((p.paid / p.due) * 100);
              return (
                <div key={p.name} className="bg-white rounded-xl border border-stone-100 px-3.5 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-stone-800">{p.name}</p>
                      <p className="text-xs text-stone-400">{p.sub}</p>
                    </div>
                    {full
                      ? <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Paid</span>
                      : <span className="text-xs font-bold text-red-600">₹{(p.due - p.paid).toLocaleString()} due</span>
                    }
                  </div>
                  <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${full ? "bg-green-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-stone-400 mt-1">₹{p.paid.toLocaleString()} of ₹{p.due.toLocaleString()}</p>
                </div>
              );
            })}
          </>
        )}

        {tab === "menu" && (
          <>
            {WEEK.map(d => (
              <div key={d.day}
                className={`flex gap-3 items-center rounded-xl px-3.5 py-2.5 ${d.today ? "bg-amber-500" : d.past ? "bg-stone-50 opacity-30" : "bg-stone-50"}`}>
                <div className="w-10 text-center flex-shrink-0">
                  <p className={`text-xs font-bold ${d.today ? "text-amber-100" : "text-stone-500"}`}>{d.day}</p>
                  <p className={`text-xs ${d.today ? "text-amber-200" : "text-stone-400"}`}>{d.date} Jun</p>
                </div>
                <p className={`text-sm flex-1 ${d.today ? "text-white font-semibold" : "text-stone-700"}`}>{d.items}</p>
                {!d.past && (
                  <span className={`text-xs ${d.today ? "text-amber-200" : "text-stone-400"}`}>Edit</span>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Customer View ──────────────────────────────────────────────────────
function CustomerView() {
  const [tab, setTab] = useState("home");
  const delivStatus = "packed";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Flat amber header */}
      <div className="bg-amber-500 px-4 pt-5 pb-5 flex-shrink-0">
        <p className="text-amber-100 text-sm">Good afternoon</p>
        <p className="text-white text-2xl font-black mt-0.5">Hi, Rahul!</p>
        <p className="text-amber-200 text-xs mt-0.5">Annapurna Tiffins · H-12, Shankar Nagar</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-100 flex flex-shrink-0">
        {[
          { id: "home", label: "Home" },
          { id: "menu", label: "Menu" },
          { id: "payment", label: "Payment" },
          { id: "alerts", label: "Alerts  2", badge: true },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-xs font-bold py-2.5 border-b-2 transition-all relative ${tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400"}`}>
            {t.id === "alerts" ? (
              <span className="flex items-center justify-center gap-1">
                Alerts
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">2</span>
              </span>
            ) : t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-6 space-y-3">

        {tab === "home" && (
          <>
            {/* Menu hero */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UtensilsCrossed size={17} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Today's menu</p>
                  <p className="text-xs text-amber-500">Sun, 29 Jun 2026</p>
                </div>
              </div>
              <p className="text-stone-800 font-bold text-base leading-snug">
                Dal Makhani · Jeera Rice · Roti ×4 · Raita
              </p>
            </div>

            {/* 2-step tracker */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-4">Delivery</p>
              <div className="flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${delivStatus !== "pending" ? "bg-amber-500" : "bg-stone-100"}`}>
                    {delivStatus !== "pending"
                      ? <Package size={22} className="text-white" />
                      : <span className="text-stone-300 font-black">1</span>}
                  </div>
                  <p className={`text-xs font-bold mt-2 ${delivStatus !== "pending" ? "text-amber-600" : "text-stone-300"}`}>Packed</p>
                </div>

                <div className="flex-1 mx-2 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-amber-500 rounded-full transition-all ${delivStatus === "delivered" ? "w-full" : "w-0"}`} />
                </div>

                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${delivStatus === "delivered" ? "bg-green-500" : "bg-stone-100"}`}>
                    {delivStatus === "delivered"
                      ? <CheckCircle2 size={22} className="text-white" />
                      : <span className="text-stone-300 font-black">2</span>}
                  </div>
                  <p className={`text-xs font-bold mt-2 ${delivStatus === "delivered" ? "text-green-600" : "text-stone-300"}`}>Delivered</p>
                </div>
              </div>

              <div className={`mt-4 rounded-xl py-2.5 px-3 text-center ${delivStatus === "packed" ? "bg-amber-50" : "bg-stone-50"}`}>
                <p className={`text-sm font-bold ${delivStatus === "packed" ? "text-amber-700" : "text-stone-400"}`}>
                  {delivStatus === "pending" ? "Being prepared in the kitchen" : null}
                  {delivStatus === "packed" ? "Your tiffin is on the way!" : null}
                  {delivStatus === "delivered" ? "Delivered! Enjoy your meal" : null}
                </p>
              </div>
            </div>

            {/* Payment nudge */}
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-700">₹500 due this month</p>
                <p className="text-xs text-red-400">June 2026</p>
              </div>
              <button className="text-xs font-bold text-red-600 border border-red-200 bg-white px-2.5 py-1 rounded-lg">View</button>
            </div>
          </>
        )}

        {tab === "menu" && (
          <>
            {/* Today featured */}
            <div className="bg-amber-500 rounded-2xl p-4 text-white">
              <p className="text-xs font-bold text-amber-100 uppercase tracking-wide">Today · Sun 29 Jun</p>
              <p className="text-lg font-black mt-1.5 leading-snug">Dal Makhani · Jeera Rice · Roti ×4 · Raita</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Dal Makhani", "Jeera Rice", "Roti ×4", "Raita"].map(i => (
                  <span key={i} className="text-xs bg-white bg-opacity-20 text-white px-2 py-0.5 rounded-full">{i}</span>
                ))}
              </div>
            </div>
            {WEEK.filter(d => !d.today).map(d => (
              <div key={d.day} className={`flex gap-3 items-center rounded-xl px-3.5 py-2.5 ${d.past ? "opacity-30" : "bg-stone-50"}`}>
                <div className="w-10 text-center flex-shrink-0">
                  <p className="text-xs font-bold text-stone-500">{d.day}</p>
                  <p className="text-xs text-stone-400">{d.date} Jun</p>
                </div>
                <div className="w-0.5 h-7 bg-amber-200 rounded-full flex-shrink-0" />
                <p className="text-sm text-stone-600 flex-1">{d.items}</p>
              </div>
            ))}
          </>
        )}

        {tab === "payment" && (
          <>
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-stone-400">June 2026</p>
                  <p className="text-3xl font-black text-stone-900 mt-1">₹1,500</p>
                  <p className="text-xs text-stone-400">paid of ₹2,000</p>
                </div>
                <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">₹500 due</span>
              </div>
              <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: "75%" }} />
              </div>
              <p className="text-xs text-stone-400 mt-1 text-right">75% paid</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
              {[{ date: "18 Jun", amt: "₹500" }, { date: "05 Jun", amt: "₹1,000" }].map(p => (
                <div key={p.date} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={15} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-800">{p.date}</p>
                    <p className="text-xs text-stone-400">Confirmed by owner</p>
                  </div>
                  <p className="text-sm font-bold text-stone-800">{p.amt}</p>
                </div>
              ))}
            </div>

            <button className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2">
              <Phone size={16} /> Send "I've paid" to owner
            </button>
          </>
        )}

        {tab === "alerts" && (
          <>
            {[
              { icon: <Package size={18} className="text-amber-600" />,   msg: "Your tiffin is packed and on the way!", time: "Today, 12:15 PM",   unread: true },
              { icon: <CreditCard size={18} className="text-green-600" />, msg: "Payment of ₹500 confirmed",             time: "27 Jun, 6:00 PM",   unread: true },
              { icon: <CheckCircle2 size={18} className="text-stone-400" />, msg: "Tiffin delivered! Enjoy your meal.",  time: "26 Jun, 1:15 PM",   unread: false },
              { icon: <CreditCard size={18} className="text-stone-400" />, msg: "Payment of ₹1,000 confirmed",           time: "05 Jun, 3:00 PM",   unread: false },
            ].map((n, i) => (
              <div key={i} className={`flex gap-3 rounded-2xl px-4 py-3 border ${n.unread ? "bg-amber-50 border-amber-100" : "bg-white border-stone-100 opacity-50"}`}>
                <div className="w-9 h-9 rounded-full bg-white border border-stone-100 flex items-center justify-center flex-shrink-0">
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800">{n.msg}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{n.time}</p>
                </div>
                {n.unread && <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────
export default function TiffinTrackUI() {
  const [role, setRole] = useState("delivery");
  const [cols, setCols] = useState(INIT_COLS);
  const [indivs, setIndivs] = useState(INIT_INDIVS);

  const roles = [
    { id: "delivery", label: "Rider",    icon: <Bike size={13} /> },
    { id: "owner",    label: "Owner",    icon: <BriefcaseBusiness size={13} /> },
    { id: "customer", label: "Customer", icon: <Users size={13} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "1.5rem 1rem" }}>
      <h2 className="sr-only">TiffinTrack UI — interactive mockup of rider, owner, and customer dashboards</h2>

      {/* Role switcher */}
      <div style={{ display: "flex", gap: "8px", background: "var(--surface-1)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "6px" }}>
        {roles.map(r => (
          <button key={r.id} onClick={() => setRole(r.id)} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "500",
            border: "none", cursor: "pointer",
            background: role === r.id ? "var(--surface-2)" : "transparent",
            color: role === r.id ? "var(--text-primary)" : "var(--text-muted)",
            boxShadow: role === r.id ? "0 0 0 0.5px var(--border-strong)" : "none",
          }}>
            {r.icon}{r.label}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div style={{
        width: "100%", maxWidth: "360px",
        background: "#F9F9F7",
        borderRadius: "2rem",
        border: "0.5px solid var(--border-strong)",
        overflow: "hidden",
        height: "660px",
        display: "flex",
        flexDirection: "column",
      }}>
        {role === "delivery" && (
          <DeliveryView cols={cols} indivs={indivs} setCols={setCols} setIndivs={setIndivs} />
        )}
        {role === "owner" && <OwnerView cols={cols} />}
        {role === "customer" && <CustomerView />}
      </div>

      <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
        Interactive · tap Packed / Delivered buttons in the Rider view to see state update live
      </p>
    </div>
  );
}
