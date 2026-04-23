import { uiTheme } from '../lib/uiTheme.js';

export default function PhoneFrame({ children, overlay }) {
  return (
    <div className="relative h-[860px] w-full max-w-[398px] rounded-[46px] bg-gradient-to-b from-[#2a2a30] via-[#17171b] to-[#0a0a0d] p-[6px] shadow-[0_34px_90px_rgba(15,23,42,0.28),0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="pointer-events-none absolute inset-0 rounded-[46px] ring-1 ring-inset ring-white/10" />
      <div className="pointer-events-none absolute inset-0 rounded-[46px] bg-gradient-to-br from-white/10 via-transparent to-black/40 opacity-60" />
      <div className={`relative h-full w-full overflow-hidden rounded-[40px] ${uiTheme.background.frame}`}>
        <div className={`pointer-events-none absolute inset-0 ${uiTheme.background.frameWash}`} />
        <div className="pointer-events-none absolute left-1/2 top-[10px] z-30 h-[30px] w-[118px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />
        <div className="relative z-40 flex h-full flex-col overflow-hidden">{children}</div>
        {overlay}
      </div>
    </div>
  );
}
