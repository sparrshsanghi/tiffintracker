import { Clock, MapPin, UserRound, UtensilsCrossed } from 'lucide-react';

export function DeliveryInfoCard({ info }) {
  const rows = [
    { icon: Clock, label: 'Delivery window', value: info.windowLabel || '12:30 – 1:15 PM' },
    { icon: MapPin, label: 'Delivering to', value: info.address || 'Address on file' },
    ...(info.deliveryPartner
      ? [{ icon: UserRound, label: 'Delivered by', value: info.deliveryPartner }]
      : []),
    {
      icon: UtensilsCrossed,
      label: 'Dabbas',
      value: `${info.dabbaCount || 1} tiffin${(info.dabbaCount || 1) > 1 ? 's' : ''}`,
    },
  ];

  return (
    <section aria-labelledby="delivery-heading" className="mx-5">
      <h2 id="delivery-heading" className="font-serif text-xl font-semibold text-foreground px-1">
        Delivery
      </h2>
      <dl className="mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
