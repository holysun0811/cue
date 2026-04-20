export default function PhoneFrame({ children }) {
  return (
    <div className="relative h-[844px] w-full max-w-[390px] overflow-hidden rounded-[38px] border border-white/10 bg-black shadow-phone">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_0%,rgba(157,78,221,0.24),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent_16%,transparent_82%,rgba(0,240,255,0.08))]" />
      <div className="pointer-events-none absolute inset-x-28 top-2 z-30 h-6 rounded-full border border-white/5 bg-black/90 shadow-[0_12px_24px_rgba(0,0,0,0.45)]" />
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[38px] ring-1 ring-inset ring-white/10" />
      <div className="relative z-10 flex h-full flex-col overflow-hidden">{children}</div>
    </div>
  );
}
