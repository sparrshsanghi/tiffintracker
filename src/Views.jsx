import { useEffect, useState } from "react";
import {
  Bell,
  History as HistoryIcon,
  LogOut,
  MessageCircle,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { AIScreen } from "./components/customer/AI/AIScreen";
import { HistoryScreen } from "./components/customer/History/HistoryScreen";
import { ProfileScreen } from "./components/customer/Profile/ProfileScreen";
import { NotificationsSheet } from "./components/customer/Shared/NotificationsSheet";
import { ProfileLoadingSkeleton } from "./components/customer/Shared/Skeletons";
import { TodayScreen } from "./components/customer/Today/TodayScreen";
import {
  firstName,
  getDeliveryCopy,
  getGreeting,
  getMealPresentation,
  timelineGroupLabel,
} from "./components/customer/customerUtils";

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

export function CustomerView(props) {
  const customer = props.customer;
  const order = props.order;
  const paid = props.paid || 0;
  const notifs = props.notifs || [];
  const onRead = props.onRead;
  const curMonLabel = props.curMonLabel;
  const logout = props.logout;
  const todayMenu = props.todayMenu;
  const extractMaaAiIntent = props.extractMaaAiIntent;
  const confirmMaaAiAction = props.confirmMaaAiAction;
  const timeline = props.timeline || [];
  const timelineLoading = props.timelineLoading === true;
  const loadTimeline = props.loadTimeline;
  const customerLoading = props.customerLoading === true;
  const todayMenuLoading = props.todayMenuLoading === true;
  const notificationsLoading = props.notificationsLoading === true;

  const [tab, setTab] = useState("today");
  const [showNotifications, setShowNotifications] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", text: "Hi Maa. Tell me what you need in your own words and I will understand it.", time: Date.now() },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiDraft, setAiDraft] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [aiPending, setAiPending] = useState("");

  const meal = getMealPresentation(todayMenu, customer);
  const delivStatus = order ? order.status : "pending";
  const deliveryCopy = getDeliveryCopy(delivStatus);
  const cRate = customer?.rate || 0;
  const amountDue = Math.max(0, cRate - paid);
  const isPaid = cRate > 0 && amountDue <= 0;
  const pauseText = customer?.paused || customer?.active === false
    ? (customer?.pauseTo ? "Meals paused until " + customer.pauseTo : "Meals paused")
    : "";
  const lastRead = customer?.lastReadAt ? (customer.lastReadAt.seconds || new Date(customer.lastReadAt).getTime() / 1000) : 0;
  const unread = notifs.filter((item) => item.createdAt > lastRead).length;
  const timelineItems = timeline
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const timelineGroups = timelineItems.reduce((groups, item) => {
    const label = timelineGroupLabel(item.createdAt);
    groups[label] = groups[label] || [];
    groups[label].push(item);
    return groups;
  }, {});
  const groupedTimeline = Object.entries(timelineGroups);

  useEffect(() => {
    if (tab === "history" && loadTimeline) {
      loadTimeline();
    }
  }, [tab, loadTimeline]);

  if (customerLoading && !customer) {
    return <ProfileLoadingSkeleton />;
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f7f1e7] flex flex-col items-center justify-center p-6 text-center text-stone-900" style={{ fontFamily: "system-ui,sans-serif" }}>
        <div className="w-16 h-16 rounded-[28px] bg-white/90 border border-white/80 flex items-center justify-center shadow-[0_16px_40px_rgba(92,62,31,0.1)]">
          <UserRound className="text-stone-300" size={28} />
        </div>
        <p className="font-black text-stone-700 mt-4">Profile not found</p>
        <button onClick={logout} className="mt-6 text-[#8f3f23] font-black">Go back</button>
      </div>
    );
  }

  async function sendAiMessage(textOverride) {
    const text = String(textOverride || aiInput).trim();
    if (!text || aiBusy || !extractMaaAiIntent) return;
    const userTime = Date.now();
    setAiBusy(true);
    setAiErr("");
    setAiPending("");
    setAiDraft(null);
    setAiMessages((prev) => prev.concat([{ role: "user", text, time: userTime }]));
    try {
      const result = await extractMaaAiIntent(text);
      if (!result || result.supported === false) {
        setAiMessages((prev) => prev.concat([{ role: "assistant", text: (result && result.message) || "This request is not supported yet.", time: Date.now() }]));
        return;
      }
      if (result.needsClarification) {
        setAiMessages((prev) => prev.concat([{ role: "assistant", text: result.clarificationQuestion || "Please clarify this request.", time: Date.now() }]));
        return;
      }
      const draft = Object.assign({}, result.extraction, {
        originalText: text,
        confirmationText: result.confirmationText,
      });
      setAiDraft(draft);
      setAiMessages((prev) => prev.concat([{ role: "assistant", text: result.confirmationText || "Please confirm this request.", time: Date.now() }]));
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
      const result = await confirmMaaAiAction({
        text: aiDraft.originalText,
        extraction: aiDraft,
      });
      setAiPending((result && result.approvalId) || "pending");
      setAiMessages((prev) => prev.concat([{ role: "assistant", text: (result && result.customerMessage) || "Sent to the manager for approval.", time: Date.now() }]));
      setAiDraft(null);
    } catch (error) {
      setAiErr(error.message || "Could not send this for approval.");
    } finally {
      setAiBusy(false);
    }
  }

  function openNotifications() {
    if (onRead) onRead();
    setShowNotifications(true);
  }

  function openAiWith(text) {
    setTab("ai");
    setAiInput(text);
  }

  const navItems = [
    { id: "today", label: "Today", icon: UtensilsCrossed },
    { id: "ai", label: "AI", icon: MessageCircle },
    { id: "history", label: "History", icon: HistoryIcon },
    { id: "profile", label: "Profile", icon: UserRound },
  ];

  const cn = (...classes) => classes.filter(Boolean).join(' ');

  return (
    <div className="customer-shell min-h-screen bg-background text-foreground flex flex-col mx-auto max-w-md w-full relative shadow-2xl border-x border-border pb-24" style={{ fontFamily: "var(--font-sans)" }}>
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Maa Sharda</p>
          <h1 className="font-serif text-2xl font-semibold leading-tight text-balance text-foreground">
            {getGreeting()}, {firstName(customer)}
          </h1>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground truncate max-w-[240px]">
            {customer.group || "Maa Sharda"} · {customer.address || "Address on file"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openNotifications}
            className={cn(
              "relative mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary",
              unread > 0 && "bell-attention"
            )}
            aria-label="Notifications"
          >
            <Bell className="size-5" strokeWidth={1.75} aria-hidden />
            {unread > 0 && (
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" aria-hidden />
            )}
          </button>
          <button
            onClick={logout}
            className="relative mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary"
            aria-label="Log out"
          >
            <LogOut className="size-4.5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pt-3">
        {tab === "today" && (
          <TodayScreen
            meal={meal}
            deliveryCopy={deliveryCopy}
            pauseText={pauseText}
            customer={customer}
            amountDue={amountDue}
            openAiWith={openAiWith}
            onRefreshMeal={() => setTab("today")}
            onGoProfile={() => setTab("profile")}
            mealLoading={todayMenuLoading}
          />
        )}

        {tab === "ai" && (
          <AIScreen
            aiMessages={aiMessages}
            aiDraft={aiDraft}
            aiPending={aiPending}
            aiBusy={aiBusy}
            aiErr={aiErr}
            aiInput={aiInput}
            setAiInput={setAiInput}
            sendAiMessage={sendAiMessage}
            confirmAiDraft={confirmAiDraft}
            clearAiDraft={() => setAiDraft(null)}
          />
        )}

        {tab === "history" && (
          <HistoryScreen
            timelineLoading={timelineLoading}
            groupedTimeline={groupedTimeline}
          />
        )}

        {tab === "profile" && (
          <ProfileScreen
            customer={customer}
            paid={paid}
            amountDue={amountDue}
            isPaid={isPaid}
            cRate={cRate}
            curMonLabel={curMonLabel}
            pauseText={pauseText}
          />
        )}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  active
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon
                  className={cn('size-5', active && 'fill-primary/10')}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showNotifications && <NotificationsSheet notifs={notifs} onClose={() => setShowNotifications(false)} loading={notificationsLoading} />}
    </div>
  );
}
