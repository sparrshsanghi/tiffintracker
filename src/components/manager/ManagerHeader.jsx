import { BrandLogo } from "../../Views.jsx";

import { TODAY_STR } from "./managerUtils.js";

// ══════════════════════════════════════════════════════════════════════════════
// MANAGER HEADER
// Orange top bar with logo, date, delivery counter and progress bar.
// Props: stats { delivered, total, out, pending, progress }
// ══════════════════════════════════════════════════════════════════════════════
export function ManagerHeader({ stats }) {
  return (
    <div className="bg-orange-600 text-white px-4 pt-5 pb-4 shadow-lg">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          <div className="flex items-center gap-2"><BrandLogo className="w-8 h-8" /><span className="text-xl font-black">Maa Sharda</span></div>
          <p className="text-orange-200 text-xs mt-0.5">{TODAY_STR}</p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-0.5"><span className="text-4xl font-black">{stats.delivered}</span><span className="text-orange-300 text-xl font-semibold">/{stats.total}</span></div>
          <p className="text-orange-200 text-xs">delivered</p>
        </div>
      </div>
      <div className="mt-3 max-w-lg mx-auto">
        <div className="h-2 bg-orange-800/40 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-300 to-green-400 rounded-full transition-all duration-700" style={{width:stats.progress+"%"}}></div>
        </div>
        <div className="flex justify-between text-orange-300 text-xs mt-1">
          <span>{stats.progress}% complete</span>
          <span>{stats.out>0?stats.out+" on the way · ":""}{stats.pending} pending</span>
        </div>
      </div>
    </div>
  );
}
