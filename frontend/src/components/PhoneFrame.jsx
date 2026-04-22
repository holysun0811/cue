export default function PhoneFrame({ children, overlay }) {
  return (
    <div className="relative h-[844px] w-full max-w-[390px] overflow-hidden rounded-[38px] border border-white bg-[#F7F5FF] shadow-[0_34px_90px_rgba(87,76,130,0.24),0_0_0_1px_rgba(255,255,255,0.85)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(139,92,246,0.16),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,245,255,0.82)_45%,rgba(239,246,255,0.74))]" />
      <div className="pointer-events-none absolute left-1/2 top-[14px] z-30 h-[34px] w-[124px] -translate-x-1/2 rounded-full bg-black shadow-[0_10px_22px_rgba(15,23,42,0.28),inset_0_1px_1px_rgba(255,255,255,0.08)]" />
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[38px] ring-1 ring-inset ring-white/80" />
      <div className="relative z-40 flex h-full flex-col overflow-hidden">{children}</div>
      {overlay}
    </div>
  );
}
