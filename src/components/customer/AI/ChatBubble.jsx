import { chatTimeLabel } from "../customerUtils";

export function ChatBubble({ role, text, time }) {
  const isUser = role === "user";
  return (
    <div className={"flex " + (isUser ? "justify-end" : "justify-start") }>
      <div className={"max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm " + (isUser ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-card text-foreground")}>
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        <div className={"mt-2 flex items-center gap-1.5 text-[10px] " + (isUser ? "justify-end text-primary-foreground/75" : "justify-start text-muted-foreground")}>
          <span>{chatTimeLabel(time)}</span>
          {isUser && <span aria-hidden="true">✓✓</span>}
        </div>
      </div>
    </div>
  );
}
