// ══════════════════════════════════════════════════════════════════════════════
// MANAGER NAV
// Sticky top tab bar with icon + label + optional badge.
// Uses the mgr-nav / mgr-nav-item design tokens from index.css.
// Props:
//   tabs   — array of {id, icon, label, badge?}
//   active — current tab id string
//   onTab  — function(tabId) called on tab press
// ══════════════════════════════════════════════════════════════════════════════
export function ManagerNav({ tabs, active, onTab }) {
  return (
    <nav className="mgr-nav flex sticky top-0 z-20" role="tablist" aria-label="Manager sections">
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
            className={"mgr-nav-item flex-1 flex flex-col items-center py-2.5 text-[10px] font-semibold gap-0.5 " + (isActive ? "text-primary" : "text-muted-foreground")}
          >
            <span className="text-sm relative" aria-hidden="true">
              {t.icon}
              {t.badge > 0 && (
                <span className="mgr-nav-badge absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-primary-foreground text-[9px] leading-4 font-bold">
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
