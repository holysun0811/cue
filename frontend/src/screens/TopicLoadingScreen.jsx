import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { pageTransition } from '../lib/motion.js';
import { uiTheme } from '../lib/uiTheme.js';

const STEP_MARKS = [0.38, 0.72, 1];
const MIN_DURATION_MS = 1800;

export default function TopicLoadingScreen({ onPrepareTopic }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const topic = location.state?.topic;
  const [progress, setProgress] = useState(0);
  const [errorKey, setErrorKey] = useState('');
  const startedRef = useRef(false);

  const steps = useMemo(
    () => [t('topicLoading.step1'), t('topicLoading.step2'), t('topicLoading.step3')],
    [t]
  );

  useEffect(() => {
    if (!topic) {
      navigate('/', { replace: true });
      return undefined;
    }
    if (startedRef.current) return undefined;
    startedRef.current = true;

    const start = performance.now();
    const duration = MIN_DURATION_MS;
    let raf = 0;
    const tick = (now) => {
      const ratio = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - ratio, 2.2);
      setProgress(eased);
      if (ratio < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_DURATION_MS));
    let cancelled = false;

    (async () => {
      try {
        const preparePromise = onPrepareTopic ? onPrepareTopic(topic) : Promise.resolve(null);
        const [, sessionId] = await Promise.all([minDelay, preparePromise]);
        if (cancelled) return;
        if (sessionId) {
          navigate(`/learn/${sessionId}`, { replace: true });
        } else {
          navigate('/learn', { replace: true });
        }
      } catch {
        if (cancelled) return;
        setErrorKey('topicLoading.fallbackError');
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [navigate, onPrepareTopic, topic]);

  if (!topic) return null;

  const percent = Math.round(progress * 100);

  return (
    <motion.section
      className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-10 pt-4"
      {...pageTransition}
    >
      <div className={`pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full blur-3xl ${uiTheme.background.warmGlow}`} />
      <div className={`pointer-events-none absolute -left-24 bottom-24 h-52 w-52 rounded-full blur-3xl ${uiTheme.background.softGlow}`} />

      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`relative flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-[26px] bg-gradient-to-br ${topic.gradient} text-[48px] shadow-[0_24px_48px_rgba(15,23,42,0.22)] ring-1 ring-white/30`}
        initial={{ opacity: 0, y: 12, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 12px)'
          }}
        />
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          className="relative"
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {topic.emoji}
        </motion.span>
      </motion.div>

      <motion.h2
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center text-[1.7rem] font-black leading-tight tracking-tight text-slate-950"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 320, damping: 28 }}
      >
        {t('topicLoading.title')}
      </motion.h2>
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 max-w-[20rem] text-center text-[14px] leading-snug text-slate-500"
        initial={{ opacity: 0, y: 8 }}
        transition={{ delay: 0.16 }}
      >
        {t('topicLoading.subtitle')}
      </motion.p>

      <div className="mt-8 w-full max-w-[300px]">
        <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-orange-100/70">
          <motion.div
            animate={{ width: `${percent}%` }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF8A5B] to-[#EF4C2F] shadow-[0_4px_12px_rgba(239,76,47,0.35)]"
            initial={{ width: '0%' }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.08 }}
          />
        </div>
        <p className="mt-3 text-center text-[12px] font-black tracking-wide text-slate-400">
          {t('topicLoading.progress', { percent })}
        </p>
      </div>

      <ul className="mt-8 w-full max-w-[300px] space-y-4">
        {steps.map((label, index) => {
          const completed = progress >= STEP_MARKS[index];
          const active = !completed && progress >= (STEP_MARKS[index - 1] ?? 0);
          return (
            <li className="flex items-center gap-3" key={label}>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                  completed
                    ? 'bg-[#EF4C2F] text-white shadow-[0_4px_10px_rgba(239,76,47,0.28)]'
                    : active
                      ? 'bg-[#FFE2D4] text-[#EF4C2F]'
                      : 'bg-slate-100 text-slate-300'
                }`}
              >
                {completed ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <span className={`h-2 w-2 rounded-full ${active ? 'bg-[#EF4C2F]' : 'bg-slate-300'}`} />
                )}
              </span>
              <span
                className={`text-[14px] font-black tracking-tight transition ${
                  completed ? 'text-slate-950' : active ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>

      {errorKey && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-center text-[13px] font-bold text-rose-500">{t(errorKey)}</p>
          <button
            className={`rounded-full px-4 py-2 text-[13px] font-black ${uiTheme.button.primary}`}
            onClick={() => navigate('/', { replace: true })}
            type="button"
          >
            {t('nav.home')}
          </button>
        </div>
      )}
    </motion.section>
  );
}
