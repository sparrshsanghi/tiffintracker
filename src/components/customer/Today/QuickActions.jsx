import { CalendarX2, MessageCircleHeart, Star } from "lucide-react";

export function QuickActions({ openAiWith }) {
  return (
    <section aria-label="Quick actions" className="mx-5">
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => openAiWith("Pause meals from tomorrow.")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <CalendarX2 className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
          Skip a day
        </button>
        <button
          type="button"
          onClick={() => openAiWith("I want to rate today's meal.")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Star className="size-5 text-gold" strokeWidth={1.75} aria-hidden />
          Rate meal
        </button>
        <button
          type="button"
          onClick={() => openAiWith("")}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <MessageCircleHeart className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
          Ask Maa
        </button>
      </div>
    </section>
  );
}
