import { INP, fmt } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// AI INBOX TAB
// ══════════════════════════════════════════════════════════════════════════════
export function AiInboxTab({
  onboardingQueue,
  aiActionQueue,
  loadAiInbox,
  onboardingQueueLoading,
  managerPin,
  managerAuthenticated,
  onboardingQueuePin,
  setOnboardingQueuePin,
  onboardingQueueError,
  onboardingPromptVersion,
  aiActionNotes,
  setAiActionNotes,
  onboardingNotes,
  setOnboardingNotes,
  aiActionBusyId,
  onboardingBusyId,
  resolveMaaAiItem,
  resolveOnboardingItem
}) {
  const totalPending = onboardingQueue.length + aiActionQueue.length;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="mgr-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Manager AI Inbox</p>
            <p className="text-lg font-black text-foreground mt-1">
              {totalPending} pending approval{totalPending !== 1 ? "s" : ""}
            </p>
            {totalPending > 0 && (
              <div className="flex gap-3 mt-1">
                {aiActionQueue.length > 0 && <span className="text-xs text-muted-foreground">{aiActionQueue.length} AI action{aiActionQueue.length !== 1 ? "s" : ""}</span>}
                {onboardingQueue.length > 0 && <span className="text-xs text-muted-foreground">{onboardingQueue.length} onboarding</span>}
              </div>
            )}
          </div>
          <button
            onClick={function () { loadAiInbox(); }}
            disabled={onboardingQueueLoading}
            aria-label="Refresh AI inbox"
            className="mgr-btn-primary mgr-press px-4 py-2.5 rounded-xl font-black text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {onboardingQueueLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            ) : "↻"} Refresh
          </button>
        </div>

        {!managerPin && !managerAuthenticated && (
          <div className="flex gap-2 mt-3">
            <input
              className={INP + " flex-1"}
              type="password"
              inputMode="text"
              placeholder="Manager PIN"
              value={onboardingQueuePin}
              onChange={function (e) { setOnboardingQueuePin(e.target.value); }}
              aria-label="Manager PIN for AI inbox"
            />
            <button
              onClick={function () { loadAiInbox(); }}
              className="px-4 rounded-xl bg-foreground text-background font-black text-sm mgr-press"
              aria-label="Load AI inbox with PIN"
            >
              Load
            </button>
          </div>
        )}
        {onboardingQueueError && <p className="text-xs text-destructive font-semibold mt-2" role="alert">{onboardingQueueError}</p>}
        <p className="text-xs text-muted-foreground mt-2">Prompt version: {onboardingPromptVersion}</p>
      </div>

      {/* Loading state */}
      {onboardingQueueLoading && (
        <div className="text-center py-10 flex flex-col items-center gap-3 text-stone-400">
          <span className="inline-block w-8 h-8 border-4 border-stone-200 border-t-orange-500 rounded-full animate-spin" aria-label="Loading" />
          <span className="text-sm font-semibold">Loading approvals…</span>
        </div>
      )}

      {/* Empty state */}
      {!onboardingQueueLoading && totalPending === 0 && (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-black text-stone-700">All caught up!</p>
          <p className="text-sm text-stone-400 mt-1">No pending AI actions or onboarding requests.</p>
        </div>
      )}

      {/* AI Action queue */}
      {!onboardingQueueLoading && aiActionQueue.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black text-stone-400 tracking-wider uppercase">Pending AI Actions</p>
          {aiActionQueue.map(function (item) {
            var intentLabel = item.intentLabel || (item.intent === "pause_meals" ? "Pause Meals" : item.intent === "resume_meals" ? "Resume Meals" : item.intent === "meal_change" ? "Meal Change" : "Address Change");
            var effectiveText = item.effectiveDate || item.startDate || item.resumeDate || "—";
            var currentText = item.currentValue || "—";
            var requestedText = item.requestedValue || (item.intent === "pause_meals" ? ((item.startDate || "—") + " to " + (item.endDate || "—")) : item.resumeDate || item.mealPreference || item.address || "—");
            var confidence = item.confidence != null ? Math.round(item.confidence * 100) + "%" : "—";
            return (
              <div key={item.id} className="mgr-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-foreground">{item.customerName || item.customerId || "Customer"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.customerPhone || "No phone"} · {item.source || "customer_chat"}</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[oklch(0.95_0.06_78)] text-[oklch(0.58_0.13_75)] flex-shrink-0">Pending</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
                  <div className="mgr-inset p-2">Intent: <span className="font-bold">{intentLabel}</span></div>
                  <div className="mgr-inset p-2">Confidence: <span className="font-bold">{confidence}</span></div>
                  <div className="mgr-inset p-2 col-span-2">Current: <span className="font-bold">{currentText}</span></div>
                  <div className="mgr-inset p-2 col-span-2">Requested: <span className="font-bold">{requestedText}</span></div>
                  <div className="mgr-inset p-2 col-span-2">Effective: <span className="font-bold">{effectiveText}</span></div>
                  <div className="mgr-inset p-2 col-span-2">Reason: <span className="font-bold">{item.reason || "—"}</span></div>
                  {item.sourceMessage && <div className="mgr-inset p-2 col-span-2">Message: <span className="font-bold">{item.sourceMessage}</span></div>}
                </div>
                <textarea
                  className={INP + " resize-none"}
                  rows={2}
                  placeholder="Manager note (optional)"
                  aria-label="Manager note for this action"
                  value={aiActionNotes[item.id] || ""}
                  onChange={function (e) { setAiActionNotes(function (prev) { var next = Object.assign({}, prev); next[item.id] = e.target.value; return next; }); }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={function () { resolveMaaAiItem(item.id, "approve"); }}
                    disabled={aiActionBusyId === item.id}
                    className="flex-1 py-2.5 rounded-xl mgr-btn-success mgr-press text-sm font-black disabled:opacity-50"
                  >
                    {aiActionBusyId === item.id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={function () { resolveMaaAiItem(item.id, "reject"); }}
                    disabled={aiActionBusyId === item.id}
                    className="flex-1 py-2.5 rounded-xl border border-[oklch(0.88_0.06_27)] bg-[oklch(0.97_0.03_27)] text-destructive text-sm font-black disabled:opacity-50 mgr-press"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboarding queue */}
      <div className="space-y-3">
        {onboardingQueue.length > 0 && <p className="text-xs font-black text-stone-400 tracking-wider uppercase">Onboarding Approvals</p>}
        {onboardingQueue.map(function (item) {
          var draft = item.draft || {};
          return (
            <div key={item.id} className="mgr-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-foreground">{draft.name || "New customer"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{draft.phone || "No phone"} · {item.source || "chat"}</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[oklch(0.95_0.06_78)] text-[oklch(0.58_0.13_75)] flex-shrink-0">Pending</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
                <div className="mgr-inset p-2">Plan: <span className="font-bold">{draft.plan || "—"}</span></div>
                <div className="mgr-inset p-2">Rate: <span className="font-bold">{draft.rate ? fmt(draft.rate) : "—"}</span></div>
                <div className="mgr-inset p-2">Food: <span className="font-bold">{draft.food || "—"}</span></div>
                <div className="mgr-inset p-2">Group: <span className="font-bold">{draft.group || "—"}</span></div>
                <div className="mgr-inset p-2 col-span-2">Address: <span className="font-bold">{draft.address || "—"}</span></div>
                {draft.notes && <div className="mgr-inset p-2 col-span-2">Notes: <span className="font-bold">{draft.notes}</span></div>}
              </div>
              <textarea
                className={INP + " resize-none"}
                rows={2}
                placeholder="Manager note (optional)"
                aria-label="Manager note for this onboarding request"
                value={onboardingNotes[item.id] || ""}
                onChange={function (e) { setOnboardingNotes(function (prev) { var next = Object.assign({}, prev); next[item.id] = e.target.value; return next; }); }}
              />
              <div className="flex gap-2">
                <button
                  onClick={function () { resolveOnboardingItem(item.id, "approve"); }}
                  disabled={onboardingBusyId === item.id}
                  className="flex-1 py-2.5 rounded-xl mgr-btn-success mgr-press text-sm font-black disabled:opacity-50"
                >
                  {onboardingBusyId === item.id ? "…" : "Approve"}
                </button>
                <button
                  onClick={function () { resolveOnboardingItem(item.id, "reject"); }}
                  disabled={onboardingBusyId === item.id}
                  className="flex-1 py-2.5 rounded-xl border border-[oklch(0.88_0.06_27)] bg-[oklch(0.97_0.03_27)] text-destructive text-sm font-black disabled:opacity-50 mgr-press"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
