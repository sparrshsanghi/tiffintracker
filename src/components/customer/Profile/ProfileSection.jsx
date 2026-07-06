export function ProfileSection({ title, icon: Icon, body, helper }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary border border-border">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground leading-snug">{body}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{helper}</p>
      </div>
    </div>
  );
}
