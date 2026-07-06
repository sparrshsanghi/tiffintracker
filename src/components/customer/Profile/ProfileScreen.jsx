import { MapPin, Phone, Settings } from "lucide-react";
import { formatMoney } from "../customerUtils";
import { PaymentCard } from "./PaymentCard";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileSection } from "./ProfileSection";
import { SubscriptionCard } from "./SubscriptionCard";

export function ProfileScreen({ customer, paid, amountDue, isPaid, cRate, curMonLabel, pauseText }) {
  return (
    <div className="flex flex-col gap-5 px-5">
      <ProfileHeader customer={customer} pauseText={pauseText} />

      <SubscriptionCard customer={customer} pauseText={pauseText} />

      <PaymentCard paid={paid} amountDue={amountDue} isPaid={isPaid} cRate={cRate} curMonLabel={curMonLabel} />

      {amountDue > 0 && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent("Hi! I've paid " + formatMoney(amountDue) + " for " + curMonLabel + ". Please confirm. - " + customer.name + " (" + customer.phone + ")")}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-between gap-4 rounded-3xl bg-success px-5 py-4 text-success-foreground shadow-sm transition-colors hover:bg-success/90"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-85">Payment CTA</p>
            <p className="mt-0.5 font-serif text-lg font-semibold leading-tight">Send payment note</p>
            <p className="mt-0.5 text-xs opacity-80">Message Maa Sharda on WhatsApp</p>
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-card text-success border border-border/10">
            <Phone size={18} />
          </div>
        </a>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileSection title="Address" icon={MapPin} body={customer.address || "No address added"} helper={customer.group || "Delivery address"} />
        <ProfileSection title="Phone" icon={Phone} body={customer.phone || "No phone added"} helper={customer.phone ? "Primary contact" : "Add a number for updates"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileSection title="Settings" icon={Settings} body="Account preferences" helper={customer.notes || "Special instructions"} />
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Payment snapshot</p>
          <p className="mt-1 font-serif text-xl font-semibold text-foreground">{formatMoney(amountDue)} due</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">A quiet reminder for the current cycle, shown here so it is easy to act on.</p>
        </div>
      </div>
    </div>
  );
}
