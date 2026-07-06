export function HeroIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[30px] bg-white/85 p-3 shadow-[0_16px_32px_rgba(92,62,31,0.09)] ring-1 ring-white/90">
      <img src="/hero-illustration.svg" alt="Premium homemade lunch illustration" className="hero-illustration w-full rounded-[24px] object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,248,238,0.14))]" />
    </div>
  );
}
