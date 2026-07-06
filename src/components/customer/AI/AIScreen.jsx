import { CheckCircle2, Sparkles } from "lucide-react";
import { actionLabel, dateLine, requestedLine } from "../customerUtils";
import { AiThinkingSkeleton } from "../Shared/Skeletons";
import { ChatBubble } from "./ChatBubble";
import { Composer } from "./Composer";
import { MiniDetail } from "./MiniDetail";
import { SuggestionChips } from "./SuggestionChips";

export function AIScreen({ aiMessages, aiDraft, aiPending, aiBusy, aiErr, aiInput, setAiInput, sendAiMessage, confirmAiDraft, clearAiDraft }) {
  return (
    <div className="flex flex-col gap-5 px-5">
      <section className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 text-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
            <span className="text-lg" aria-hidden="true">🍛</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Chat with Maa Sharda</p>
            <h2 className="truncate text-base font-semibold text-foreground">Maa Sharda</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
            Online
          </span>
        </div>

        {/* Chat log */}
        <div className="flex h-[420px] flex-col bg-background/50">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
            {aiMessages.map((message, index) => (
              <ChatBubble key={index} role={message.role} text={message.text} time={message.time} />
            ))}

            {aiBusy && <AiThinkingSkeleton />}

            {aiDraft && (
              <div className="rounded-2xl border border-border bg-accent p-4 shadow-sm">
                <div className="flex items-center gap-2 text-accent-foreground">
                  <Sparkles size={16} />
                  <p className="text-sm font-semibold">Confirm request</p>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-accent-foreground/90 sm:grid-cols-2">
                  <MiniDetail label="Intent" value={actionLabel(aiDraft.intent)} />
                  <MiniDetail label="Confidence" value={Math.round((aiDraft.confidence || 0) * 100) + "%"} />
                  <MiniDetail label="Requested" value={requestedLine(aiDraft)} className="sm:col-span-2" />
                  <MiniDetail label="Effective" value={dateLine(aiDraft)} className="sm:col-span-2" />
                  <MiniDetail label="Reason" value={aiDraft.reason || "-"} className="sm:col-span-2" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={clearAiDraft} disabled={aiBusy} className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary disabled:opacity-50">Cancel</button>
                  <button onClick={confirmAiDraft} disabled={aiBusy} className="flex-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50">Confirm</button>
                </div>
              </div>
            )}

            {aiPending && (
              <div className="rounded-2xl border border-border bg-accent px-4 py-3 text-xs font-medium text-accent-foreground shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Waiting for manager approval.
                </div>
              </div>
            )}

            {aiErr && <p className="text-xs font-semibold text-red-600">{aiErr}</p>}
          </div>

          <div className="border-t border-border bg-card p-3">
            <SuggestionChips onSelect={setAiInput} />
            <Composer aiBusy={aiBusy} aiInput={aiInput} setAiInput={setAiInput} sendAiMessage={sendAiMessage} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-foreground">How it works</h3>
        <p className="mt-1 text-xs text-muted-foreground">Simple, direct, and human</p>
        <div className="mt-3 flex flex-col gap-2.5 text-sm text-foreground">
          <div className="flex items-start gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">1</span>
            <p className="text-sm">Write your request naturally in English or Hindi.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">2</span>
            <p className="text-sm">Review the extracted actions (e.g. pause, extra chapati).</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">3</span>
            <p className="text-sm">Confirm and the request is instantly updated on your manager's dashboard.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
