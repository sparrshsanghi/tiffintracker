// ══════════════════════════════════════════════════════════════════════════════
// MANAGER NAV
// Sticky bottom tab bar with icon + label + optional badge.
// Props:
//   tabs   — array of {id, icon, label, badge?}
//   active — current tab id string
//   onTab  — function(tabId) called on tab press
// ══════════════════════════════════════════════════════════════════════════════
export function ManagerNav({ tabs, active, onTab }) {
  return (
    <nav className="flex bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm" role="tablist" aria-label="Manager sections">
      {tabs.map(function(t) {
        var isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={function() { onTab(t.id); }}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            aria-label={t.label + (t.badge > 0 ? " (" + t.badge + " pending)" : "")}
            className={"flex-1 flex flex-col items-center py-2 text-[10px] font-semibold gap-0.5 " + (isActive ? "text-orange-600 border-b-2 border-orange-600" : "text-stone-400 border-b-2 border-transparent")}
          >
            <span className="text-sm relative" aria-hidden="true">
              {t.icon}
              {t.badge > 0 && (
                <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] leading-4">
                  {t.badge}
                </span>
              )}
            </span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
