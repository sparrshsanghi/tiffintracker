import { UserRound } from "lucide-react";

export function ProfileHeader({ customer, pauseText }) {
  return (
    <section className="mx-5 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary border border-border">
          <UserRound size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Profile</p>
          <h2 className="mt-0.5 truncate font-serif text-xl font-semibold text-foreground">{customer.name}</h2>
          <p className="truncate text-xs text-muted-foreground">{customer.group || "Maa Sharda customer"}</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Manage your subscription, payment, address, and phone details in one calm place.
      </p>

      <div className="mt-4 rounded-2xl bg-accent px-4 py-3 text-accent-foreground">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">Status</p>
        <p className="mt-1 text-sm font-semibold">{pauseText || "Your account is active and ready."}</p>
        <p className="mt-0.5 text-xs opacity-75">{customer.plan || "Meal plan"} · {customer.food || "Preferences saved"}</p>
      </div>
    </section>
  );
}
