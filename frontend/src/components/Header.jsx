import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

function resolveUserName(t) {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem('cue-user-name') : '';
  return saved || t('home.defaultUserName');
}

export default function Header({ onBack, rightSlot, step, titleOverride }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isTopicLoading = location.pathname === '/explore/topic-loading';
  const title = isHome ? '' : titleOverride || t(`steps.${step}`);
  const userName = resolveUserName(t);
  const userInitial = (userName || '?').trim().charAt(0).toUpperCase() || '?';
  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (location.pathname === '/learn' || location.pathname.startsWith('/learn/')) {
      navigate('/');
      return;
    }
    navigate(-1);
  };

  if (isTopicLoading) {
    return <header className="relative z-20 h-[56px] shrink-0 bg-transparent pt-[48px]" />;
  }

  return (
    <header
      className={`relative z-20 grid shrink-0 items-center gap-2 bg-transparent px-5 pb-0 pt-[48px] ${
        isHome ? 'h-[112px] grid-cols-[1fr_auto]' : 'h-[104px] grid-cols-[76px_1fr_76px]'
      }`}
    >
      {isHome ? (
        <>
          <motion.div
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="min-w-0"
            initial={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
            key="home-header"
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <span className="flex items-center gap-1 text-[13px] font-semibold text-slate-500">
              {t(greetingKey())}
              <span aria-hidden="true">👋</span>
            </span>
            <span className="mt-0.5 block truncate text-[26px] font-black leading-tight tracking-tight text-slate-950">
              {userName}
            </span>
          </motion.div>
          <div className="flex justify-end">
            <motion.button
              aria-label={t('nav.settings')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#FF8A5B] to-[#EF4C2F] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(239,76,47,0.3)] transition active:scale-95"
              onClick={() => navigate('/settings')}
              type="button"
              whileTap={{ scale: 0.94 }}
            >
              {userInitial}
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
          {rightSlot ? (
            <div className="flex justify-end">{rightSlot}</div>
          ) : (
            <div aria-hidden="true" className="h-10 w-10" />
          )}
        </>
      )}
    </header>
  );
}
