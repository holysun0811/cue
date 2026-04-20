import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Languages, Sparkles } from 'lucide-react';

export default function Header({ step }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const nextLanguage = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
  const isHome = location.pathname === '/';

  return (
    <header className="relative z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-white/5 bg-black/30 px-5 pt-4 backdrop-blur-xl">
      <AnimatePresence mode="wait" initial={false}>
        {isHome ? (
          <motion.div
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            className="flex min-w-0 flex-1 items-center gap-3"
            exit={{ opacity: 0, x: -12, filter: 'blur(6px)' }}
            initial={{ opacity: 0, x: -12, filter: 'blur(6px)' }}
            key="home-header"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cue-cyan/20 bg-cue-cyan/10 text-sm font-black tracking-tight text-cue-cyan shadow-neon">
              C
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.26em] text-cue-cyan">
                <Sparkles size={11} />
                CUE
              </span>
              <span className="block truncate text-[15px] font-black leading-tight tracking-tight text-gray-100">
                {t('brand.name')}
              </span>
            </span>
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            className="grid min-w-0 flex-1 grid-cols-[44px_1fr_44px] items-center"
            exit={{ opacity: 0, x: -10, filter: 'blur(6px)' }}
            initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
            key="inner-header"
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            <motion.button
              aria-label={t('nav.back')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-100 shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-cue-cyan/40 hover:text-cue-cyan hover:shadow-neon"
              onClick={() => navigate(-1)}
              type="button"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={22} strokeWidth={2.6} />
            </motion.button>
            <div className="min-w-0 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cue-cyan">CUE</p>
              <h1 className="truncate text-sm font-black tracking-tight text-gray-100">{t(`steps.${step}`)}</h1>
            </div>
            <div />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ml-3 flex items-center gap-2">
        {isHome && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-300 backdrop-blur-xl">
            {t(`steps.${step}`)}
          </span>
        )}
        <button
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-gray-100 transition hover:border-cue-cyan/50 hover:text-cue-cyan"
          onClick={() => i18n.changeLanguage(nextLanguage)}
          type="button"
        >
          <Languages size={13} />
          {t('nav.language')}
        </button>
      </div>
    </header>
  );
}
