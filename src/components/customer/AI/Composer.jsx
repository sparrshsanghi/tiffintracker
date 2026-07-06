import { Send } from "lucide-react";

export function Composer({ aiBusy, aiInput, setAiInput, sendAiMessage }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-3 shadow-sm">
      <textarea
        className="min-h-[80px] w-full resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Message Maa..."
        value={aiInput}
        onChange={(event) => setAiInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendAiMessage();
          }
        }}
        aria-label="Type a request"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Shift + Enter for a new line</p>
        <button
          onClick={() => sendAiMessage()}
          disabled={aiBusy || !aiInput.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={15} />
          Send
        </button>
      </div>
    </div>
  );
}
