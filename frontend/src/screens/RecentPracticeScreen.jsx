import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronRight, History } from 'lucide-react';
import { pageTransition } from '../lib/motion.js';
import { uiTheme } from '../lib/uiTheme.js';
import { RecentCoverThumb } from '../components/RecentCover.jsx';

function RecentPracticeRow({ item, onClick }) {
  return (
    <motion.button
      className="flex min-h-[86px] w-full items-center gap-3 rounded-[22px] border border-[#F0E4D8]/80 bg-white/84 p-3 text-left shadow-[0_10px_22px_rgba(91,92,126,0.07)] backdrop-blur-xl transition hover:bg-white/94 active:translate-y-0.5"
      onClick={onClick}
      type="button"
      whileTap={{ scale: 0.985 }}
    >
      <RecentCoverThumb cover={item.coverPayload} />
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded-full border border-[#F0E4D8]/80 bg-[#FFF9F2]/86 px-2 py-1 text-[10px] font-black text-slate-500">
            {item.modeLabel}
          </span>
          {item.updatedLabel && (
            <span className="truncate text-[11px] font-bold text-slate-400">{item.updatedLabel}</span>
          )}
        </span>
        <span className="line-clamp-2 text-[15px] font-black leading-tight tracking-tight text-slate-900">
          {item.title}
        </span>
        <span className="mt-1 block truncate text-[12px] font-bold text-slate-400">{item.detail}</span>
      </span>
      <ChevronRight className="shrink-0 text-slate-300" size={18} strokeWidth={2.6} />
    </motion.button>
  );
}

function EmptyState({ t }) {
  return (
    <div className="mt-4 flex min-h-[180px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/58 px-5 py-8 text-center backdrop-blur-sm">
      <span className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${uiTheme.accent.iconSoft}`}>
        <History size={20} />
      </span>
      <p className="mt-3 text-[15px] font-black text-slate-800">{t('home.recentEmptyTitle')}</p>
      <p className="mt-1 max-w-[240px] text-[12px] font-bold leading-snug text-slate-400">{t('home.recentEmptyBody')}</p>
    </div>
  );
}

export default function RecentPracticeScreen({ items = [], onOpenRecent }) {
  const { t } = useTranslation();

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-6 pt-2" {...pageTransition}>
      <div className={`pointer-events-none absolute -right-20 top-24 h-52 w-52 rounded-full blur-3xl ${uiTheme.background.warmGlow}`} />
      <div className={`pointer-events-none absolute -left-24 bottom-20 h-48 w-48 rounded-full blur-3xl ${uiTheme.background.softGlow}`} />

      {items.length > 0 ? (
        <div className="relative min-h-0 flex-1 overflow-y-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-3">
            {items.map((item) => (
              <RecentPracticeRow item={item} key={item.id} onClick={() => onOpenRecent?.(item)} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState t={t} />
      )}
    </motion.section>
  );
}
