import { Bike, Clock3, PauseCircle, RefreshCw, UtensilsCrossed } from "lucide-react";
import { firstName, getGreeting } from "../customerUtils";
import { HeroIllustration } from "./HeroIllustration";
import { TiffinReveal } from "./TiffinReveal";

function InfoTile({ label, value, icon: Icon }) {
  return (
    <div className="motion-card rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_10px_22px_rgba(92,62,31,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6ead8] text-[#8f3f23]">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">{label}</p>
          <p className="truncate text-sm font-black text-stone-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function TodayHero({ customer, deliveryCopy, pauseText, mainMeal, mealCount, tiffinMeal, openingCycle, isOpening, replayTiffin }) {
  return (
    <section className="reveal-card premium-card today-hero overflow-hidden p-0">
      <div className="today-hero-grid">
        <div className="today-hero-copy space-y-4 px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#a45d2d]">Today</p>
            <h2 className="max-w-2xl text-[clamp(1.8rem,4vw,2.9rem)] font-black tracking-tight text-stone-900">{getGreeting()}, {firstName(customer)}</h2>
            <p className="max-w-xl text-sm font-medium leading-6 text-stone-500">Open your homemade lunch for the day, warm and ready.</p>
          </div>

          <div className="rounded-[30px] border border-[#efd8bd] bg-[#fff7eb] p-4 shadow-[0_14px_30px_rgba(92,62,31,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#a45d2d]">Current meal status</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-stone-900">{deliveryCopy.label}</p>
                <p className="mt-1 text-sm font-medium leading-6 text-stone-600">{deliveryCopy.body}</p>
              </div>
              <div className={"rounded-[20px] px-3 py-2 text-xs font-black shadow-sm " + (deliveryCopy.tone === "green" ? "bg-[#e7f4df] text-[#2e7d32]" : deliveryCopy.tone === "amber" ? "bg-[#fff1c7] text-[#a45d2d]" : "bg-white text-stone-500")}>
                {deliveryCopy.eta}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] bg-white/85 px-4 py-3 shadow-[0_10px_24px_rgba(92,62,31,0.05)]">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">Today&apos;s meal</p>
                <p className="mt-1 text-sm font-black text-stone-900">{mainMeal}</p>
              </div>
              <div className="rounded-[22px] bg-white/85 px-4 py-3 shadow-[0_10px_24px_rgba(92,62,31,0.05)]">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">Prepared with</p>
                <p className="mt-1 text-sm font-black text-stone-900">❤️ by Maa Sharda</p>
              </div>
            </div>
          </div>

          {pauseText && (
            <div className="rounded-[26px] border border-[#efd8bd] bg-white/90 px-4 py-3 text-sm font-semibold text-[#7c2d12] shadow-[0_10px_24px_rgba(92,62,31,0.06)]">
              <div className="flex items-start gap-3">
                <PauseCircle className="mt-0.5 flex-shrink-0 text-[#a45d2d]" size={19} />
                <div>
                  <p className="font-black text-[#7c2d12]">{pauseText}</p>
                  {customer.resumeDate && <p className="mt-1 text-xs font-semibold text-[#a45d2d]">Resume date: {customer.resumeDate}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-stone-600">
            <span className="rounded-full bg-white/80 px-3 py-1.5 font-semibold shadow-sm ring-1 ring-white/80">ETA {deliveryCopy.eta}</span>
            <span className="rounded-full bg-white/80 px-3 py-1.5 font-semibold shadow-sm ring-1 ring-white/80">{mealCount || 0} items</span>
            <span className="rounded-full bg-white/80 px-3 py-1.5 font-semibold shadow-sm ring-1 ring-white/80">{customer.group || "Maa Sharda"}</span>
          </div>

          <HeroIllustration />
        </div>

        <div className="today-hero-stage relative overflow-hidden border-t border-white/70 bg-[#f8ecd9] lg:border-l lg:border-t-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(255,255,255,0)_55%)]" />
          <div className="relative flex h-full flex-col justify-between gap-4 px-4 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#a45d2d]">Tiffin</p>
                <h3 className="mt-1 text-[clamp(1.3rem,3vw,1.95rem)] font-black tracking-tight text-stone-900">The meal is the moment.</h3>
                <p className="mt-1 max-w-md text-sm font-medium leading-6 text-stone-500">Open the box visually. The lunch should feel warm, layered, and close enough to smell.</p>
              </div>
              <button onClick={replayTiffin} className="pressable inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-[#8f3f23] shadow-[0_12px_26px_rgba(92,62,31,0.08)]" aria-label="Replay tiffin opening">
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="today-tiffin-wrap rounded-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,247,235,0.62))] p-3 shadow-[0_22px_48px_rgba(92,62,31,0.12)] ring-1 ring-white/80">
              <TiffinReveal key={openingCycle} meal={tiffinMeal} phase={isOpening ? "opening" : "open"} />
            </div>

            <div className="today-status-strip grid gap-3 sm:grid-cols-3">
              <InfoTile label="Current meal" value={deliveryCopy.label} icon={UtensilsCrossed} />
              <InfoTile label="ETA" value={deliveryCopy.eta} icon={Clock3} />
              <InfoTile label="Cooked by" value="Maa Sharda" icon={Bike} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
