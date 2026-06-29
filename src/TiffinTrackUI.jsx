import { useState, useMemo } from "react";
import {
  LayoutDashboard, Users, Wallet, UtensilsCrossed, LogOut, ChevronDown, ChevronUp,
  Phone, Package, CheckCircle2, Home, Bell, Truck, TrendingUp, IndianRupee, MapPin,
  Plus, MessageCircle, Bike, Soup, AlertCircle, Navigation, PackageCheck,
} from "lucide-react";

/* ------------------------------- Mock data -------------------------------- */
type Status = "pending" | "packed" | "delivered";

interface Customer {
  id: string; house: string; name: string; food: string;
  status: Status; phone: string; qty: number; dueAmount?: number;
}
interface Colony { id: string; name: string; lat: number; lng: number; customers: Customer[]; }

const initialColonies: Colony[] = [
  {
    id: "shankar", name: "Shankar Nagar", lat: 21.1458, lng: 79.0882,
    customers: [
      { id: "s1", house: "H-12", name: "Rahul Sharma", food: "Roti, Rice, Daal", status: "delivered", phone: "+919876543210", qty: 2, dueAmount: 500 },
      { id: "s2", house: "H-14", name: "Priya Patel", food: "Roti, Rice, Daal", status: "delivered", phone: "+919876543211", qty: 1 },
      { id: "s3", house: "H-22", name: "Amit Kumar", food: "Roti, Rice, Daal", status: "packed", phone: "+919876543212", qty: 3 },
      { id: "s4", house: "H-31", name: "Sneha Reddy", food: "Roti, Rice, Daal (Jain)", status: "pending", phone: "+919876543213", qty: 1 },
      { id: "s5", house: "H-45", name: "Vikram Singh", food: "Roti, Rice, Daal", status: "pending", phone: "+919876543214", qty: 2 },
    ],
  },
  {
    id: "gokul", name: "Gokul Park", lat: 21.1500, lng: 79.0950,
    customers: [
      { id: "g1", house: "B-3", name: "Anjali Mehta", food: "Roti, Rice, Daal", status: "delivered", phone: "+919876543215", qty: 2 },
      { id: "g2", house: "B-7", name: "Rohan Iyer", food: "Roti, Rice, Daal", status: "packed", phone: "+919876543216", qty: 1 },
      { id: "g3", house: "B-12", name: "Kavya Nair", food: "Roti, Rice, Daal", status: "packed", phone: "+919876543217", qty: 4 },
    ],
  },
  {
    id: "model", name: "Model Town", lat: 21.1370, lng: 79.0750,
    customers: [
      { id: "m1", house: "A-5", name: "Deepak Joshi", food: "Roti, Rice, Daal", status: "packed", phone: "+919876543218", qty: 2 },
      { id: "m2", house: "A-9", name: "Meera Kapoor", food: "Roti, Rice, Daal", status: "packed", phone: "+919876543219", qty: 1 },
      { id: "m3", house: "A-18", name: "Suresh Yadav", food: "Roti, Rice, Daal", status: "packed", phone: "+919876543220", qty: 1 },
      { id: "m4", house: "A-21", name: "Pooja Verma", food: "Roti, Rice, Daal", status: "packed", phone: "+919876543221", qty: 3 },
    ],
  },
];

const weekMenu = [
  { day: "Monday", lunch: "Roti, Rice, Daal, Aloo Gobi" },
  { day: "Tuesday", lunch: "Roti, Rice, Daal, Bhindi Masala" },
  { day: "Wednesday", lunch: "Roti, Rice, Daal, Rajma" },
  { day: "Thursday", lunch: "Roti, Rice, Daal, Mix Veg" },
  { day: "Friday", lunch: "Roti, Rice, Daal, Chole" },
  { day: "Saturday", lunch: "Roti, Rice, Daal, Paneer Curry" },
  { day: "Sunday", lunch: "Special — Pav Bhaji" },
];

/* ------------------------------- Shell ----------------------------------- */
type Role = "manager" | "delivery" | "customer";

export default function TiffinTrackApp() {
  const [role, setRole] = useState<Role>("manager");
  const [colonies, setColonies] = useState<Colony[]>(initialColonies);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <RoleSwitcher role={role} setRole={setRole} />
      <div className="mx-auto max-w-md pb-28">
        {role === "manager" && <ManagerView colonies={colonies} setColonies={setColonies} />}
        {role === "delivery" && <DeliveryView colonies={colonies} setColonies={setColonies} />}
        {role === "customer" && <CustomerView colonies={colonies} />}
      </div>
    </div>
  );
}

/* ------------------------- Role switcher (demo) -------------------------- */
function RoleSwitcher({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  const roles: { key: Role; label: string; icon: typeof Home }[] = [
    { key: "manager", label: "Manager", icon: LayoutDashboard },
    { key: "delivery", label: "Rider", icon: Bike },
    { key: "customer", label: "Customer", icon: Home },
  ];
  return (
    <div className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-white shadow-sm"><Soup size={18} /></div>
          <span className="text-sm font-bold tracking-tight">TiffinTrack</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-stone-100 p-1">
          {roles.map((r) => {
            const Icon = r.icon;
            const active = role === r.key;
            return (
              <button key={r.key} onClick={() => setRole(r.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>
                <Icon size={13} />{r.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================ MANAGER VIEW ============================== */
function ManagerView({ colonies, setColonies }: { colonies: Colony[]; setColonies: (c: Colony[]) => void; }) {
  const [tab, setTab] = useState<"overview" | "packing" | "customers" | "payments" | "menu">("overview");

  const totals = useMemo(() => {
    const all = colonies.flatMap((c) => c.customers);
    const tiffins = all.reduce((s, c) => s + c.qty, 0);
    const packedTiffins = all.filter((c) => c.status === "packed" || c.status === "delivered").reduce((s, c) => s + c.qty, 0);
    const deliveredTiffins = all.filter((c) => c.status === "delivered").reduce((s, c) => s + c.qty, 0);
    return {
      total: all.length,
      delivered: all.filter((c) => c.status === "delivered").length,
      pending: all.filter((c) => c.status !== "delivered").length,
      tiffins, packedTiffins, deliveredTiffins,
    };
  }, [colonies]);

  return (
    <>
      {tab === "overview" && <ManagerOverview colonies={colonies} totals={totals} />}
      {tab === "packing" && <ManagerPacking colonies={colonies} setColonies={setColonies} totals={totals} />}
      {tab === "customers" && <ManagerCustomers colonies={colonies} />}
      {tab === "payments" && <ManagerPayments colonies={colonies} />}
      {tab === "menu" && <ManagerMenu />}
      <BottomNav
        items={[
          { key: "overview", label: "Overview", icon: LayoutDashboard },
          { key: "packing", label: "Packing", icon: Package },
          { key: "customers", label: "Customers", icon: Users },
          { key: "payments", label: "Payments", icon: Wallet },
          { key: "menu", label: "Menu", icon: UtensilsCrossed },
        ]}
        active={tab}
        onChange={(k) => setTab(k as typeof tab)}
      />
    </>
  );
}

function ManagerOverview({ colonies, totals }: {
  colonies: Colony[];
  totals: { total: number; delivered: number; pending: number; tiffins: number; packedTiffins: number; deliveredTiffins: number; };
}) {
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500">Good afternoon</p>
          <h1 className="text-2xl font-bold tracking-tight">Hey, Owner 👋</h1>
        </div>
        <button className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm">
          <LogOut size={13} /> Logout
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <KpiCard label="Tiffins" value={totals.tiffins} icon={Soup} tone="stone" />
        <KpiCard label="Packed" value={totals.packedTiffins} icon={Package} tone="amber" />
        <KpiCard label="Delivered" value={totals.deliveredTiffins} icon={CheckCircle2} tone="green" />
      </div>

      <p className="mt-3 text-[11px] font-medium text-stone-400">
        {totals.total} customers · {totals.tiffins} tiffins today
      </p>

      <Card className="mt-5">
        <CardHeader icon={<MapPin size={16} className="text-amber-600" />} title="Colony Progress" subtitle="Today's dispatch" />
        <div className="mt-4 space-y-4">
          {colonies.map((c) => {
            const tiff = c.customers.reduce((s, x) => s + x.qty, 0);
            const done = c.customers.filter((x) => x.status === "delivered").reduce((s, x) => s + x.qty, 0);
            const pct = tiff ? Math.round((done / tiff) * 100) : 0;
            return (
              <div key={c.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-stone-800">{c.name}</span>
                  <span className="text-xs font-medium text-stone-500">{done}/{tiff} tiffins</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-amber-50/90">Revenue · June 2026</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">₹84,500</p>
            <p className="mt-0.5 text-xs text-amber-50/80">collected so far</p>
          </div>
          <div className="rounded-xl bg-white/15 p-2 backdrop-blur"><TrendingUp size={20} /></div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-white/15 p-3 backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-amber-50/80">Collected</p>
            <p className="mt-1 text-lg font-bold">₹84,500</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/15 p-3 backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-amber-50/80">Pending</p>
            <p className="mt-1 text-lg font-bold">₹12,300</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- Manager Packing ---------------------------- */
function ManagerPacking({ colonies, setColonies, totals }: {
  colonies: Colony[]; setColonies: (c: Colony[]) => void; totals: { tiffins: number; packedTiffins: number };
}) {
  const togglePacked = (custId: string) => {
    setColonies(colonies.map((c) => ({
      ...c,
      customers: c.customers.map((x) => {
        if (x.id !== custId) return x;
        if (x.status === "delivered") return x;
        return { ...x, status: x.status === "packed" ? "pending" : "packed" };
      }),
    })));
  };

  const packAll = (colonyId: string) => {
    setColonies(colonies.map((c) =>
      c.id === colonyId
        ? { ...c, customers: c.customers.map((x) => x.status === "delivered" ? x : { ...x, status: "packed" as Status }) }
        : c
    ));
  };

  const pct = totals.tiffins ? Math.round((totals.packedTiffins / totals.tiffins) * 100) : 0;

  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Kitchen · Packing</h1>
      <p className="mt-1 text-sm text-stone-500">Tick tiffins as they leave the kitchen</p>

      <Card className="mt-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-amber-50/90">Packed today</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {totals.packedTiffins}<span className="text-base font-medium text-amber-50/80"> / {totals.tiffins}</span>
            </p>
            <p className="mt-0.5 text-xs text-amber-50/80">tiffins ready for dispatch</p>
          </div>
          <div className="rounded-xl bg-white/15 p-2 backdrop-blur"><PackageCheck size={20} /></div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <div className="mt-4 space-y-3">
        {colonies.map((c) => {
          const colonyTiff = c.customers.reduce((s, x) => s + x.qty, 0);
          const colonyPacked = c.customers.filter((x) => x.status === "packed" || x.status === "delivered").reduce((s, x) => s + x.qty, 0);
          const allDone = colonyPacked === colonyTiff;
          return (
            <Card key={c.id} className="!p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-stone-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-700"><MapPin size={18} /></div>
                  <div>
                    <p className="font-bold text-stone-900">{c.name}</p>
                    <p className="text-xs font-medium text-stone-500">{colonyPacked}/{colonyTiff} tiffins packed</p>
                  </div>
                </div>
                <button onClick={() => packAll(c.id)} disabled={allDone}
                  className="rounded-full bg-stone-900 px-3 py-2 text-[11px] font-bold text-white disabled:bg-stone-200 disabled:text-stone-400">
                  Pack all
                </button>
              </div>
              <div className="divide-y divide-stone-100">
                {c.customers.map((cust) => {
                  const isPacked = cust.status === "packed" || cust.status === "delivered";
                  const locked = cust.status === "delivered";
                  return (
                    <button key={cust.id} onClick={() => togglePacked(cust.id)} disabled={locked}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left active:bg-stone-50 disabled:opacity-60">
                      <div className="flex items-center gap-3">
                        <div className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-extrabold ${isPacked ? "bg-green-500 text-white" : "bg-stone-100 text-stone-600"}`}>
                          {isPacked ? <CheckCircle2 size={20} /> : cust.house}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900">{cust.name}</p>
                          <p className="text-xs text-stone-500">{cust.house} · {cust.food}</p>
                        </div>
                      </div>
                      <QtyBadge qty={cust.qty} packed={isPacked} />
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function QtyBadge({ qty, packed }: { qty: number; packed: boolean }) {
  return (
    <div className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold ${packed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
      <Soup size={13} />×{qty}
    </div>
  );
}

function ManagerCustomers({ colonies }: { colonies: Colony[] }) {
  const [open, setOpen] = useState<string | null>(colonies[0]?.id ?? null);
  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
      <p className="mt-1 text-sm text-stone-500">Grouped by colony</p>

      <div className="mt-4 space-y-3">
        {colonies.map((c) => (
          <Card key={c.id} className="!p-0 overflow-hidden">
            <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex w-full items-center justify-between p-4">
              <div className="text-left">
                <p className="font-semibold text-stone-900">{c.name}</p>
                <p className="text-xs text-stone-500">{c.customers.length} customers · {c.customers.reduce((s, x) => s + x.qty, 0)} tiffins</p>
              </div>
              {open === c.id ? <ChevronUp size={18} className="text-stone-500" /> : <ChevronDown size={18} className="text-stone-500" />}
            </button>
            {open === c.id && (
              <div className="divide-y divide-stone-100 border-t border-stone-100">
                {c.customers.map((cust) => (
                  <div key={cust.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-xs font-bold text-amber-700">{cust.house}</div>
                      <div>
                        <p className="text-sm font-semibold">
                          {cust.name}
                          {cust.qty > 1 && (
                            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">×{cust.qty}</span>
                          )}
                        </p>
                        <p className="text-xs text-stone-500">{cust.phone}</p>
                      </div>
                    </div>
                    <StatusPill status={cust.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-stone-900/10">
        <Plus size={16} /> Enter Edit Mode (Add/Edit Customers)
      </button>
    </div>
  );
}

function ManagerPayments({ colonies }: { colonies: Colony[] }) {
  const dues = colonies.flatMap((c) => c.customers.filter((x) => x.dueAmount).map((x) => ({ ...x, colony: c.name })));
  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-stone-500">Outstanding dues this month</p>

      <Card className="mt-4 bg-gradient-to-br from-stone-900 to-stone-800 text-white">
        <p className="text-xs font-medium text-stone-300">Total Outstanding</p>
        <p className="mt-1 flex items-center text-3xl font-bold"><IndianRupee size={22} />12,300</p>
        <p className="mt-0.5 text-xs text-stone-400">across 8 customers</p>
      </Card>

      <div className="mt-4 space-y-2">
        {dues.map((d) => (
          <Card key={d.id} className="!p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{d.name}</p>
              <p className="text-xs text-stone-500">{d.colony} · {d.house}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">₹{d.dueAmount}</span>
              <button className="rounded-full bg-amber-500 p-2 text-white shadow-sm"><MessageCircle size={14} /></button>
            </div>
          </Card>
        ))}
        {dues.length === 0 && <p className="py-10 text-center text-sm text-stone-400">All caught up 🎉</p>}
      </div>
    </div>
  );
}

function ManagerMenu() {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Weekly Menu</h1>
      <p className="mt-1 text-sm text-stone-500">Planned dispatch for the week</p>
      <div className="mt-4 space-y-2">
        {weekMenu.map((m) => (
          <Card key={m.day} className="!p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">{m.day}</p>
              <p className="mt-0.5 text-sm font-semibold text-stone-800">{m.lunch}</p>
            </div>
            <UtensilsCrossed size={18} className="text-stone-300" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================ DELIVERY VIEW ============================= */
function DeliveryView({ colonies, setColonies }: { colonies: Colony[]; setColonies: (c: Colony[]) => void; }) {
  const dispatchable = useMemo(
    () => colonies.map((c) => ({ ...c, customers: c.customers.filter((x) => x.status !== "pending") })).filter((c) => c.customers.length > 0),
    [colonies],
  );

  const [activeColonyId, setActiveColonyId] = useState<string>(dispatchable[0]?.id ?? colonies[0].id);
  const activeColony = dispatchable.find((c) => c.id === activeColonyId) ?? dispatchable[0] ?? colonies[0];

  const allCust = dispatchable.flatMap((c) => c.customers);
  const totalTiff = allCust.reduce((s, x) => s + x.qty, 0);
  const deliveredTiff = allCust.filter((x) => x.status === "delivered").reduce((s, x) => s + x.qty, 0);
  const pct = totalTiff ? Math.round((deliveredTiff / totalTiff) * 100) : 0;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  const markDelivered = (custId: string) => {
    setColonies(colonies.map((c) => ({
      ...c,
      customers: c.customers.map((x) => x.id === custId ? { ...x, status: "delivered" as Status } : x),
    })));
  };

  const markAllInColony = (colonyId: string) => {
    setColonies(colonies.map((c) =>
      c.id === colonyId
        ? { ...c, customers: c.customers.map((x) => x.status === "packed" ? { ...x, status: "delivered" as Status } : x) }
        : c
    ));
  };

  const colonyPending = activeColony ? activeColony.customers.filter((x) => x.status === "packed") : [];
  const colonyDelivered = activeColony ? activeColony.customers.filter((x) => x.status === "delivered") : [];
  const colonyTiff = activeColony ? activeColony.customers.reduce((s, x) => s + x.qty, 0) : 0;
  const colonyDoneTiff = colonyDelivered.reduce((s, x) => s + x.qty, 0);

  const mapsUrl = activeColony
    ? `https://www.google.com/maps/dir/?api=1&destination=${activeColony.lat},${activeColony.lng}`
    : "#";

  return (
    <>
      <div className="sticky top-[49px] z-30 border-b border-amber-100 bg-amber-50/95 backdrop-blur-md">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">{today} · Run</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-stone-900">
                {deliveredTiff}/{totalTiff} <span className="text-sm font-medium text-stone-500">tiffins delivered</span>
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30"><Truck size={22} /></div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/70">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dispatchable.map((c) => {
            const done = c.customers.every((x) => x.status === "delivered");
            const active = c.id === activeColonyId;
            return (
              <button key={c.id} onClick={() => setActiveColonyId(c.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                  active ? "bg-stone-900 text-white" : done ? "bg-green-100 text-green-700" : "bg-white text-stone-700 border border-stone-200"
                }`}>
                <MapPin size={12} />{c.name}{done && <CheckCircle2 size={12} />}
              </button>
            );
          })}
          {dispatchable.length === 0 && <p className="text-sm text-stone-500">Nothing packed yet. Ask the kitchen.</p>}
        </div>
      </div>

      {activeColony && dispatchable.length > 0 && (
        <div className="space-y-4 px-4 pt-4">
          <div className="overflow-hidden rounded-3xl border-2 border-stone-200 bg-white">
            <ColonyMap colony={activeColony} />
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-base font-bold text-stone-900">{activeColony.name}</p>
                <p className="text-xs font-medium text-stone-500">{colonyDoneTiff}/{colonyTiff} tiffins delivered</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => markAllInColony(activeColony.id)} disabled={colonyPending.length === 0}
                  className={`flex items-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-bold shadow-md active:scale-[0.98] transition ${
                    colonyPending.length === 0 ? "bg-green-100 text-green-700 shadow-none" : "bg-green-600 text-white shadow-green-600/30"
                  }`}>
                  {colonyPending.length === 0 ? (<><CheckCircle2 size={14} /> All Done</>) : (<><CheckCircle2 size={14} /> Deliver All</>)}
                </button>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/30 active:scale-[0.98]">
                  <Navigation size={14} /> Navigate
                </a>
              </div>
            </div>
          </div>

          <button onClick={() => markAllInColony(activeColony.id)} disabled={colonyPending.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-5 text-base font-extrabold text-white shadow-lg shadow-green-600/30 transition active:scale-[0.99] disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
            <CheckCircle2 size={20} />
            {colonyPending.length === 0 ? `${activeColony.name} — All Done` : `Mark all ${colonyPending.length} stops Delivered`}
          </button>

          <div className="overflow-hidden rounded-3xl border-2 border-stone-200 bg-white">
            <div className="border-b border-stone-100 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Stops</p>
            </div>
            {activeColony.customers.map((cust) => {
              const done = cust.status === "delivered";
              return (
                <div key={cust.id} className={`border-b border-stone-100 p-4 transition ${done ? "bg-green-50/40" : ""} last:border-b-0`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`grid h-12 w-12 place-items-center rounded-2xl text-sm font-extrabold ${done ? "bg-green-500 text-white" : "bg-stone-100 text-stone-700"}`}>
                        {done ? <CheckCircle2 size={22} /> : cust.house}
                      </div>
                      <div>
                        <p className="text-base font-bold text-stone-900">{cust.name}</p>
                        <p className="text-xs text-stone-500">{cust.house} · {cust.qty} tiffin{cust.qty > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <a href={`tel:${cust.phone}`} className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm">
                      <Phone size={16} />
                    </a>
                  </div>
                  <button onClick={() => markDelivered(cust.id)} disabled={done}
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.98] ${
                      done ? "bg-green-100 text-green-700" : "bg-stone-900 text-white shadow-md shadow-stone-900/20"
                    }`}>
                    {done ? (<><CheckCircle2 size={16} /> Delivered</>) : (<>Mark Delivered · {cust.qty} tiffin{cust.qty > 1 ? "s" : ""}</>)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------- Mini Map (mock) ---------------------------- */
function ColonyMap({ colony }: { colony: Colony }) {
  const stops = colony.customers.map((c, i) => {
    const angle = (i / colony.customers.length) * Math.PI * 2;
    const radius = 28 + (i % 2) * 8;
    return { ...c, x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius * 0.7 };
  });
  return (
    <div className="relative h-44 w-full overflow-hidden bg-[linear-gradient(135deg,#fef3c7_0%,#fde68a_100%)]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(180,140,60,0.18)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        <path d="M0,55 Q40,40 100,60" stroke="rgba(255,255,255,0.85)" strokeWidth="3" fill="none" />
        <path d="M55,0 Q45,50 60,100" stroke="rgba(255,255,255,0.85)" strokeWidth="3" fill="none" />
      </svg>
      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-stone-700 shadow">
        <Bike size={11} className="text-amber-600" /> You
      </div>
      {stops.map((s) => {
        const done = s.status === "delivered";
        return (
          <div key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <div className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[10px] font-extrabold shadow-md ${done ? "bg-green-500 text-white" : "bg-stone-900 text-white"}`}>
              {done ? "✓" : s.house.replace(/[^0-9]/g, "")}
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-stone-600 shadow">
        {colony.customers.length} stops
      </div>
    </div>
  );
}

/* ============================ CUSTOMER VIEW ============================= */
function CustomerView({ colonies }: { colonies: Colony[] }) {
  const [tab, setTab] = useState<"home" | "menu" | "payment" | "alerts">("home");
  const me = colonies[0].customers[0];

  return (
    <>
      {tab === "home" && <CustomerHome me={me} />}
      {tab === "menu" && <CustomerMenuTab />}
      {tab === "payment" && <CustomerPayment me={me} />}
      {tab === "alerts" && <CustomerAlerts />}
      <BottomNav
        items={[
          { key: "home", label: "Home", icon: Home },
          { key: "menu", label: "Menu", icon: UtensilsCrossed },
          { key: "payment", label: "Payment", icon: Wallet },
          { key: "alerts", label: "Alerts", icon: Bell },
        ]}
        active={tab}
        onChange={(k) => setTab(k as typeof tab)}
      />
    </>
  );
}

function CustomerHome({ me }: { me: Customer }) {
  const isSunday = new Date().getDay() === 0;
  const mealToday = isSunday ? "Special — Pav Bhaji" : "Roti, Rice, Daal";
  const step = me.status === "delivered" ? 2 : me.status === "packed" ? 1 : 0;

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-5 pt-6 pb-10 text-white">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs font-medium text-amber-50/90">Welcome back</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Hi, Rahul! 👋</h1>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-50/90"><MapPin size={12} /> H-12, Shankar Nagar</div>
      </div>

      <div className="-mt-6 space-y-4 px-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Today's Tiffin</p>
              <p className="mt-1 text-xl font-bold text-stone-900">{mealToday}</p>
              <p className="mt-0.5 text-xs text-stone-500">Lunch · 12:30 – 1:30 PM</p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <div className="flex flex-col items-center leading-none">
                <Soup size={20} />
                <span className="mt-0.5 text-[10px] font-extrabold text-amber-700">×{me.qty}</span>
              </div>
            </div>
          </div>
          {me.qty > 1 && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
              You have {me.qty} tiffins on subscription
            </p>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Delivery Status</p>
          <div className="mt-4 flex items-center">
            <TrackStep icon={Package} label="Packed" active={step >= 1} />
            <div className={`mx-2 h-1 flex-1 rounded-full ${step >= 2 ? "bg-green-500" : step >= 1 ? "bg-amber-400" : "bg-stone-200"}`} />
            <TrackStep icon={CheckCircle2} label="Delivered" active={step >= 2} done={step >= 2} />
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
            step >= 2 ? "bg-green-50 text-green-700" : step >= 1 ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600"
          }`}>
            <Truck size={16} />
            {step >= 2 ? "Delivered. Enjoy your meal!" : step >= 1 ? "Your tiffin is on the way!" : "We're preparing your tiffin"}
          </div>
        </Card>

        {me.dueAmount && (
          <Card className="border-red-100 bg-red-50/60">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600"><AlertCircle size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-red-700">₹{me.dueAmount} due this month</p>
                  <p className="text-xs text-red-600/80">Please clear by 30th June</p>
                </div>
              </div>
              <button className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm">Pay</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function TrackStep({ icon: Icon, label, active, done }: { icon: typeof Package; label: string; active: boolean; done?: boolean; }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`grid h-14 w-14 place-items-center rounded-2xl transition ${
        done ? "bg-green-500 text-white shadow-md shadow-green-500/30"
        : active ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
        : "bg-stone-100 text-stone-400"
      }`}>
        <Icon size={22} />
      </div>
      <p className={`text-xs font-semibold ${active ? "text-stone-900" : "text-stone-400"}`}>{label}</p>
    </div>
  );
}

function CustomerMenuTab() {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">This Week's Menu</h1>
      <p className="mt-1 text-sm text-stone-500">View only — no changes here</p>
      <div className="mt-4 space-y-2">
        {weekMenu.map((m) => (
          <Card key={m.day} className="!p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">{m.day}</p>
              <p className="mt-0.5 text-sm font-semibold text-stone-800">{m.lunch}</p>
            </div>
            <UtensilsCrossed size={18} className="text-stone-300" />
          </Card>
        ))}
      </div>
    </div>
  );
}

function CustomerPayment({ me }: { me: Customer }) {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-stone-500">Your monthly summary · {me.qty} tiffin/day plan</p>

      <Card className="mt-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <p className="text-xs font-medium text-amber-50/90">June 2026</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-amber-50/80">Paid</p>
            <p className="mt-1 text-xl font-bold">₹{2500 * me.qty}</p>
          </div>
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-amber-50/80">Due</p>
            <p className="mt-1 text-xl font-bold">₹{me.dueAmount ?? 0}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Recent activity</p>
        <div className="mt-3 space-y-3">
          {[
            { label: "May 2026", amount: 3000 * me.qty, paid: true },
            { label: "April 2026", amount: 3000 * me.qty, paid: true },
            { label: "March 2026", amount: 3000 * me.qty, paid: true },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">{r.label}</p>
                <p className="text-xs text-stone-500">Monthly subscription · ×{me.qty}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-stone-800">₹{r.amount}</span>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">PAID</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-green-600/20 active:scale-[0.99]">
        <MessageCircle size={16} /> Send "I've Paid" via WhatsApp
      </button>
    </div>
  );
}

function CustomerAlerts() {
  const alerts = [
    { title: "Sunday Special!", body: "Pav Bhaji this Sunday. Stay tuned.", time: "2h ago", tone: "amber" as const },
    { title: "Payment reminder", body: "₹500 pending for June. Please clear soon.", time: "1d ago", tone: "red" as const },
    { title: "Delivery delayed", body: "Today's tiffin running 15 min late.", time: "2d ago", tone: "stone" as const },
  ];
  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
      <p className="mt-1 text-sm text-stone-500">Messages from your kitchen</p>
      <div className="mt-4 space-y-2">
        {alerts.map((a, i) => (
          <Card key={i} className="!p-4">
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                a.tone === "amber" ? "bg-amber-100 text-amber-700"
                : a.tone === "red" ? "bg-red-100 text-red-600"
                : "bg-stone-100 text-stone-600"
              }`}>
                <Bell size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-stone-900">{a.title}</p>
                  <span className="text-[10px] font-medium text-stone-400">{a.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-stone-600">{a.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================= Primitives =============================== */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm shadow-stone-900/[0.03] ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50">{icon}</div>
        <div>
          <p className="text-sm font-bold text-stone-900">{title}</p>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: "amber" | "green" | "stone"; }) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
    stone: "bg-stone-100 text-stone-700",
  } as const;
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-sm shadow-stone-900/[0.03]">
      <div className={`grid h-8 w-8 place-items-center rounded-xl ${tones[tone]}`}><Icon size={16} /></div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-stone-900">{value}</p>
      <p className="text-[11px] font-medium text-stone-500">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const cfg = {
    pending: { label: "Pending", cls: "bg-stone-100 text-stone-600" },
    packed: { label: "Packed", cls: "bg-amber-100 text-amber-700" },
    delivered: { label: "Delivered", cls: "bg-green-100 text-green-700" },
  }[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>
  );
}

function BottomNav({ items, active, onChange }: { items: { key: string; label: string; icon: typeof Home }[]; active: string; onChange: (k: string) => void; }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active2 = it.key === active;
          return (
            <button key={it.key} onClick={() => onChange(it.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-bold transition ${active2 ? "text-amber-600" : "text-stone-400"}`}>
              <Icon size={20} strokeWidth={active2 ? 2.4 : 2} />
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
