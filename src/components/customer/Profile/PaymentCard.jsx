import { CheckCircle2, CreditCard } from "lucide-react";
import { formatMoney } from "../customerUtils";

export function PaymentCard({ paid, amountDue, isPaid, cRate, curMonLabel }) {
  const billingProgress = cRate > 0 ? Math.min(100, Math.round((paid / cRate) * 100)) : 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary border border-border">
          <CreditCard size={18} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Payment</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{isPaid ? "Up to date" : "Payment due"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{curMonLabel}</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: billingProgress + "%" }} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">This month</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{formatMoney(paid)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Paid of {formatMoney(cRate)}</p>
        </div>
        {isPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-3 py-1.5 text-xs font-semibold text-success">
            <CheckCircle2 size={13} /> Paid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            {formatMoney(amountDue)} due
          </span>
        )}
      </div>
    </div>
  );
}
