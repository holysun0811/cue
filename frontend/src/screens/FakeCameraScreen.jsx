import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus, ScanLine } from 'lucide-react';
import { pageTransition } from '../lib/motion.js';
import { uiTheme } from '../lib/uiTheme.js';

export default function FakeCameraScreen() {
  const { t } = useTranslation();

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-4" {...pageTransition}>
      <div className={`pointer-events-none absolute -right-28 top-2 h-56 w-56 rounded-full blur-3xl ${uiTheme.background.warmGlow}`} />
      <div className={`pointer-events-none absolute -left-24 bottom-24 h-52 w-52 rounded-full blur-3xl ${uiTheme.background.softGlow}`} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="mb-3 px-1">
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${uiTheme.accent.eyebrow}`}>{t('fakeCamera.eyebrow')}</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-slate-500">{t('fakeCamera.subtitle')}</p>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] border border-[#4A3528]/20 bg-[#2C2824] shadow-[0_24px_50px_rgba(104,80,53,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(255,138,91,0.16),transparent_32%),radial-gradient(circle_at_70%_72%,rgba(255,214,170,0.12),transparent_34%),linear-gradient(145deg,#1F1B18,#2C2824_58%,#3A3028)]" />
          <div className="absolute inset-x-5 top-5 flex items-center justify-between text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-md">
              {t('fakeCamera.previewLabel')}
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.85)]" />
          </div>

          <div className="absolute inset-8 top-16 rounded-[22px] border border-white/18">
            <span className="absolute -left-1 -top-1 h-8 w-8 border-l-2 border-t-2 border-white/60" />
            <span className="absolute -right-1 -top-1 h-8 w-8 border-r-2 border-t-2 border-white/60" />
            <span className="absolute -bottom-1 -left-1 h-8 w-8 border-b-2 border-l-2 border-white/60" />
            <span className="absolute -bottom-1 -right-1 h-8 w-8 border-b-2 border-r-2 border-white/60" />
            <div className="flex h-full flex-col items-center justify-center text-center text-white/78">
              <ScanLine size={34} />
              <p className="mt-3 max-w-[12rem] text-sm font-black leading-snug">{t('fakeCamera.previewTitle')}</p>
              <p className="mt-1 max-w-[13rem] text-xs font-semibold leading-relaxed text-white/46">{t('fakeCamera.previewHint')}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[64px_1fr_64px] items-center gap-4 px-2">
          <button
            aria-label={t('fakeCamera.gallery')}
            className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${uiTheme.button.secondary}`}
            type="button"
          >
            <ImagePlus size={22} />
          </button>
          <button
            aria-label={t('fakeCamera.shutter')}
            className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full border-[6px] border-white bg-[#C6531A] text-white shadow-[0_18px_38px_rgba(239,76,47,0.2)]"
            type="button"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950">
              <Camera size={24} />
            </span>
          </button>
          <div aria-hidden="true" className="h-14 w-14" />
        </div>

        <div className="mt-3 grid grid-cols-[64px_1fr_64px] px-2 text-center text-[11px] font-black text-slate-400">
          <span>{t('fakeCamera.gallery')}</span>
          <span>{t('fakeCamera.shutter')}</span>
          <span />
        </div>
      </div>
    </motion.section>
  );
}
