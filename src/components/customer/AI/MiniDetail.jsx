export function MiniDetail({ label, value, className = "" }) {
  return (
    <div className={"rounded-[20px] bg-white p-3 shadow-sm ring-1 ring-white/70 " + className}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-black text-stone-800">{value}</p>
    </div>
  );
}
