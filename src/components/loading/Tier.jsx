export function Tier({ style }) {
  return (
    <div style={style} className="relative w-full h-[60px] flex justify-center mt-[-10px]">
      <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tierGrad" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8A95A5" />
            <stop offset="20%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="80%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="tierRim" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="20%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="80%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        
        {/* Main Body */}
        <path d="M5,10 C5,10 5,60 10,65 C20,70 120,70 130,65 C135,60 135,10 135,10 Z" fill="url(#tierGrad)" />
        
        {/* Top Rim */}
        <ellipse cx="70" cy="10" rx="65" ry="8" fill="url(#tierRim)" />
        <ellipse cx="70" cy="10" rx="63" ry="6" fill="url(#tierGrad)" />
        
        {/* Bottom Curve highlight */}
        <path d="M10,65 C20,70 120,70 130,65" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}
