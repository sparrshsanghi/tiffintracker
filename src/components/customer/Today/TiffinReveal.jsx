import { useEffect, useMemo, useRef, useState } from "react";

const TIMELINE = [
  { stage: 'unlock', after: 700 },
  { stage: 'open-top', after: 700 },
  { stage: 'open-middle', after: 950 },
  { stage: 'open-bottom', after: 950 },
  { stage: 'revealed', after: 1000 },
];

const TIERS = [
  { src: '/images/tier-dal.png', alt: 'Arhar dal tadka with ghee and jeera' },
  { src: '/images/tier-sabzi.png', alt: 'Jeera aloo with soft phulkas' },
  { src: '/images/tier-rice.png', alt: 'Steamed rice with kachumber salad' },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Steam({ className }) {
  return (
    <div className={cn('pointer-events-none absolute flex gap-2', className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-6 w-1.5 rounded-full bg-foreground/15 blur-[3px]"
          style={{
            animation: `ms-steam 1.6s ease-out ${i * 0.35}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function TiffinReveal({ heroSrc, heroAlt, phase = "open" }) {
  const reduced = usePrefersReducedMotion();
  const [stage, setStage] = useState(reduced ? 'revealed' : (phase === 'opening' ? 'closed' : 'revealed'));
  const started = useRef(false);

  useEffect(() => {
    if (stage === 'revealed') return;
    if (started.current) return;
    started.current = true;
    if (reduced) {
      setStage('revealed');
      return;
    }
    let cancelled = false;
    let elapsed = 400; 
    const timers = [];
    for (const step of TIMELINE) {
      elapsed += step.after;
      timers.push(
        setTimeout(() => {
          if (!cancelled) setStage(step.stage);
        }, elapsed)
      );
    }
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced, stage]);

  const order = useMemo(
    () => ['closed', 'unlock', 'open-top', 'open-middle', 'open-bottom', 'revealed'],
    []
  );
  const at = (s) => order.indexOf(stage) >= order.indexOf(s);

  if (stage === 'revealed') {
    return (
      <figure
        className="relative mx-5 overflow-hidden rounded-3xl shadow-lg shadow-primary/10"
        style={{ animation: reduced ? undefined : 'ms-settle 0.7s cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        <img
          src={heroSrc || "/images/todays-thali.png"}
          alt={heroAlt || "Today's meal"}
          className="aspect-[4/3] w-full object-cover"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-5 pb-4 pt-12">
          <p className="font-serif text-lg font-medium text-white text-balance">
            Fresh from Maa's kitchen, still warm
          </p>
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="relative mx-5" role="img" aria-label="Your tiffin is being opened to reveal today's meal">
      <div className="relative mx-auto flex w-56 flex-col items-center gap-1.5 py-6">
        {/* Handle + clasp */}
        <div
          aria-hidden
          className={cn(
            'h-5 w-16 rounded-t-full border-2 border-b-0 border-border transition-transform duration-500',
            at('unlock') && 'translate-y-1 rotate-6'
          )}
        />

        {/* Three tiers: lid animates away, food circle beneath */}
        {TIERS.map((tier, i) => {
          const openStage = i === 0 ? 'open-top' : i === 1 ? 'open-middle' : 'open-bottom';
          const open = at(openStage);
          return (
            <div key={tier.src} className="relative w-full">
              {open && <Steam className="-top-5 left-1/2 -translate-x-1/2" />}
              <div className="relative overflow-hidden rounded-xl border border-border/70 shadow-sm">
                <img
                  src={tier.src}
                  alt={tier.alt}
                  className={cn(
                    'h-20 w-full object-cover transition-all duration-700',
                    open ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                  )}
                />
                {/* Metal lid overlays the food until its stage arrives */}
                <div
                  aria-hidden
                  className={cn(
                    'absolute inset-0 bg-gradient-to-b from-secondary via-card to-muted transition-all duration-700 ease-out',
                    open && 'pointer-events-none -translate-y-full opacity-0'
                  )}
                >
                  <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-border" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Base */}
        <div aria-hidden className="h-2.5 w-[60%] rounded-b-2xl bg-muted shadow-inner" />

        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {stage === 'closed' && 'Your tiffin has arrived...'}
          {stage === 'unlock' && 'Opening...'}
          {(stage === 'open-top' || stage === 'open-middle' || stage === 'open-bottom') &&
            'Freshly packed this morning'}
        </p>
      </div>
    </div>
  );
}
