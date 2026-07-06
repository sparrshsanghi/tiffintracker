import { Bike, CheckCircle2, CookingPot, Package, PauseCircle, Sun } from 'lucide-react';

const STATUS_META = {
  preparing: {
    label: 'Cooking now',
    sub: 'Maa is preparing your lunch fresh',
    icon: CookingPot,
    tone: 'active',
  },
  packed: {
    label: 'Packed & sealed',
    sub: 'Your tiffin is ready and waiting for pickup',
    icon: Package,
    tone: 'active',
  },
  'on-the-way': {
    label: 'On the way',
    sub: 'Your tiffin will reach you soon',
    icon: Bike,
    tone: 'active',
  },
  delivered: {
    label: 'Delivered',
    sub: 'Enjoy your meal — it is still warm',
    icon: CheckCircle2,
    tone: 'done',
  },
  skipped: {
    label: 'Skipped today',
    sub: 'We will see you tomorrow',
    icon: PauseCircle,
    tone: 'quiet',
  },
  holiday: {
    label: 'Kitchen holiday',
    sub: 'Maa Sharda is resting today',
    icon: Sun,
    tone: 'quiet',
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function MealStatusBanner({ status }) {
  const meta = STATUS_META[status] || STATUS_META.preparing;
  const Icon = meta.icon;
  return (
    <div className="mx-5 flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full',
          meta.tone === 'active' && 'bg-accent text-accent-foreground',
          meta.tone === 'done' && 'bg-success/12 text-success',
          meta.tone === 'quiet' && 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium text-foreground">
          {meta.label}
          {meta.tone === 'active' && (
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          )}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{meta.sub}</p>
      </div>
    </div>
  );
}
