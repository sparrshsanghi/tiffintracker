import { INP } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ══════════════════════════════════════════════════════════════════════════════
export function SettingsTab({
  newMP,
  setNewMP,
  onboardingVersion,
  setOnboardingVersion,
  wg,
  setWg,
  savePins,
  pinSaved,
  logout
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Access PINs</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="settings-mgr-pin" className="text-xs font-bold text-stone-500 uppercase">New Manager PIN</label>
            <p className="text-xs text-stone-400 mb-1.5">Leave blank to keep current (min 4 digits)</p>
            <input
              id="settings-mgr-pin"
              className={INP}
              placeholder="Enter new manager PIN"
              type="password"
              inputMode="numeric"
              value={newMP}
              onChange={function (e) { setNewMP(e.target.value); }}
              maxLength={12}
              aria-describedby="settings-mgr-pin-hint"
            />
            <p id="settings-mgr-pin-hint" className="sr-only">Minimum 4 digits. Leave blank to keep the current PIN.</p>
          </div>
          <div>
            <label htmlFor="settings-prompt-version" className="text-xs font-bold text-stone-500 uppercase">Onboarding Prompt Version</label>
            <p className="text-xs text-stone-400 mb-1.5">Used by Gemini when extracting customer details</p>
            <input
              id="settings-prompt-version"
              className={INP}
              placeholder="onboarding.v1"
              value={onboardingVersion}
              onChange={function (e) { setOnboardingVersion(e.target.value); }}
            />
          </div>
          <div>
            <label htmlFor="settings-wa-group" className="text-xs font-bold text-stone-500 uppercase">WhatsApp Group Invite Link</label>
            <p className="text-xs text-stone-400 mb-1.5">For sharing the weekly menu</p>
            <input
              id="settings-wa-group"
              className={INP}
              placeholder="https://chat.whatsapp.com/..."
              value={wg}
              onChange={function (e) { setWg(e.target.value); }}
              type="url"
            />
          </div>
        </div>
        <button
          onClick={savePins}
          className={"mt-4 w-full py-3 rounded-xl text-sm font-black " + (pinSaved ? "bg-green-500 text-white" : "bg-orange-600 text-white")}
          aria-live="polite"
        >
          {pinSaved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Logout — visually separated, lower prominence */}
      <div className="pt-2 border-t border-stone-100">
        <button
          onClick={logout}
          className="w-full py-3 text-stone-400 font-semibold text-sm hover:text-stone-600 transition-colors"
          aria-label="Switch role and log out"
        >
          ← Switch Role
        </button>
      </div>
    </div>
  );
}
