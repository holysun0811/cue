import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, Sparkles } from 'lucide-react';

export default function Header({ step }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const title = isHome ? '' : t(`steps.${step}`);
  const goBack = () => {
    if (location.pathname === '/learn' || location.pathname.startsWith('/learn/')) {
      navigate('/');
      return;
    }
    navigate(-1);
  };

  return (
    <header
      className={`relative z-20 grid h-[104px] shrink-0 items-center gap-2 bg-transparent px-5 pb-0 pt-[48px] ${
        isHome ? 'grid-cols-[1fr_auto]' : 'grid-cols-[76px_1fr_76px]'
      }`}
    >
      {isHome ? (
        <>
          <motion.div
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            className="flex min-w-0 items-center gap-3"
            initial={{ opacity: 0, x: -12, filter: 'blur(6px)' }}
            key="home-header"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 text-sm font-black tracking-tight text-white shadow-[0_12px_24px_rgba(99,102,241,0.22)]">
              C
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.2em] text-violet-500">
                <Sparkles size={11} />
                CUE
              </span>
              <span className="block truncate text-[15px] font-black leading-tight tracking-tight text-slate-900">{t('brand.name')}</span>
            </span>
          </motion.div>
          <div className="flex justify-end">
            <motion.button
              aria-label={t('nav.settings')}
              className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/72 px-3 py-2 text-xs font-black text-slate-700 shadow-[0_10px_22px_rgba(91,92,126,0.1)] backdrop-blur-xl transition hover:border-violet-200 hover:text-violet-600"
              onClick={() => navigate('/settings')}
              type="button"
              whileTap={{ scale: 0.94 }}
            >
              <Settings size={14} />
              <span>{t('nav.settings')}</span>
            </motion.button>
          </div>
        </>
      ) : (
        <>
          <motion.button
            aria-label={t('nav.back')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/72 text-slate-700 shadow-[0_10px_24px_rgba(99,102,241,0.12)] backdrop-blur-md transition hover:border-violet-200 hover:text-violet-600"
            initial={{ opacity: 0, x: -10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            onClick={goBack}
            type="button"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft size={22} strokeWidth={2.6} />
          </motion.button>
          <motion.h1
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="min-w-0 self-center truncate text-center text-base font-black leading-10 tracking-tight text-slate-950"
            initial={{ opacity: 0, y: 4, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            {title}
          </motion.h1>
          <div aria-hidden="true" className="h-10 w-10" />
        </>
      )}
    </header>
  );
}
