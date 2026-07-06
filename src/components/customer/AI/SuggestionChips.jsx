import { AI_SUGGESTIONS } from "../customerUtils";

export function SuggestionChips({ onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {AI_SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="flex-shrink-0 rounded-full border border-border bg-secondary hover:bg-secondary/80 text-foreground px-4.5 py-1.5 text-xs font-medium transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
