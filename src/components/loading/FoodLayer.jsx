export function FoodLayer({ style }) {
  return (
    <div style={style} className="absolute inset-0 flex justify-center mt-[-5px]">
      <svg width="130" height="20" viewBox="0 0 130 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="foodGrad" x1="0" y1="0" x2="130" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C2410C" />
            <stop offset="50%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>
        </defs>
        {/* Simple stylized food representation inside the tier */}
        <ellipse cx="65" cy="10" rx="60" ry="6" fill="url(#foodGrad)" />
        {/* Subtle garnish/details */}
        <circle cx="50" cy="9" r="1.5" fill="#4ADE80" />
        <circle cx="80" cy="11" r="1.5" fill="#4ADE80" />
        <circle cx="60" cy="12" r="1" fill="#FDE047" />
        <circle cx="70" cy="8" r="1.5" fill="#FDE047" />
      </svg>
    </div>
  );
}
