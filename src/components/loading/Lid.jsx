export function Lid({ style, showLogo = true }) {
  return (
    <div style={style} className="relative w-full h-[40px] flex justify-center z-10">
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lidGrad" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8A95A5" />
            <stop offset="20%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="80%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="lidTopGrad" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        
        {/* Lid Body */}
        <path d="M10,25 C10,25 20,10 70,10 C120,10 130,25 130,25 C130,25 135,35 135,35 L5,35 C5,35 10,25 10,25 Z" fill="url(#lidGrad)" />
        
        {/* Lid Handle */}
        <path d="M55,10 L55,4 C55,2 60,2 70,2 C80,2 85,2 85,4 L85,10" stroke="url(#lidTopGrad)" strokeWidth="3" fill="none" />
        
        {/* Rim */}
        <ellipse cx="70" cy="35" rx="65" ry="4" fill="url(#lidTopGrad)" />
        
        {/* Maa Sharda Engraved Logo */}
        {showLogo && (
          <g transform="translate(62, 16) scale(0.16)">
            <path d="M 50 4 A 46 46 0 0 0 50 96" stroke="rgba(0,0,0,0.15)" strokeWidth="6" fill="none" />
            <path d="M 50 4 A 46 46 0 0 1 50 96" stroke="rgba(0,0,0,0.15)" strokeWidth="6" fill="none" />
            <text x="50" y="65" fill="rgba(0,0,0,0.2)" fontSize="40" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">माँ</text>
          </g>
        )}
      </svg>
    </div>
  );
}
