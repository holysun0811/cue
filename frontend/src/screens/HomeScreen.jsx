import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpenText, ChevronRight, Mic2, Sparkles } from 'lucide-react';
import { pageTransition, springPop } from '../lib/motion.js';

function ModeEntryCard({ accent = 'blue', cta, description, icon: Icon, label, onClick, title }) {
  const styles =
    accent === 'peach'
      ? {
          card: 'from-[#FFE9E4] via-[#FFE4D8] to-[#FFF7F1]',
          icon: 'bg-[#3A1018] text-white',
          label: 'text-[#B87A76]',
          title: 'text-[#351015]',
          body: 'text-[#785B5C]',
          glow: 'bg-[#FFB6A6]/34'
        }
      : {
          card: 'from-[#E8F8FF] via-[#DDF2FF] to-[#F3FBFF]',
          icon: 'bg-[#073E4C] text-white',
          label: 'text-[#4D9BB5]',
          title: 'text-[#07333D]',
          body: 'text-[#496B76]',
          glow: 'bg-[#9ADCF7]/34'
        };

  return (
    <motion.button
      className={`group relative min-h-[138px] overflow-hidden rounded-[30px] bg-gradient-to-br ${styles.card} p-5 text-left shadow-[0_18px_38px_rgba(91,92,126,0.13)] ring-1 ring-white/80`}
      onClick={onClick}
      type="button"
      variants={springPop}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full ${styles.glow} blur-2xl`} />
      <div className={`pointer-events-none absolute -bottom-20 left-12 h-36 w-36 rounded-full ${styles.glow} blur-3xl`} />
      <div className="relative grid min-h-[98px] grid-cols-[1fr_auto] gap-3">
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] shadow-[0_10px_20px_rgba(15,23,42,0.12)] ${styles.icon}`}>
              <Icon size={20} />
            </span>
            <span className={`text-[11px] font-black uppercase tracking-[0.18em] ${styles.label}`}>{label}</span>
          </div>
          <h2 className={`mt-4 text-[1.45rem] font-black leading-tight tracking-tight ${styles.title}`}>{title}</h2>
          <p className={`mt-1.5 max-w-[13.5rem] text-[14px] leading-snug ${styles.body}`}>{description}</p>
        </div>
        <div className="flex items-end">
          <span className="flex items-center gap-1 rounded-full bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition group-hover:-translate-y-0.5">
            {cta}
            <ChevronRight size={16} strokeWidth={2.8} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function HomeScreen({ learnSession, onContinueLearn, onStartLearn, onStartSpeak, session }) {
  const { t } = useTranslation();
  const hasRecentSpeak = Boolean(session?.sessionId);
  const hasRecentLearn = Boolean(learnSession?.learnSessionId);

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-5" {...pageTransition}>
      <div className="pointer-events-none absolute -right-24 top-4 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-28 h-48 w-48 rounded-full bg-rose-100/70 blur-3xl" />

      <div className="relative">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-500">
          <Sparkles size={13} />
          {t('home.eyebrow')}
        </p>
        <h1 className="mt-3 max-w-[18rem] text-[2.05rem] font-black leading-[1.08] tracking-tight text-slate-950">{t('home.title')}</h1>
        <p className="mt-3 max-w-[19rem] text-[15px] leading-relaxed text-slate-500">{t('home.subtitle')}</p>
      </div>

      <motion.div animate="show" className="relative mt-6 space-y-3" initial="hidden">
        <ModeEntryCard
          accent="peach"
          cta={t('home.cardCta')}
          description={t('home.learnDescription')}
          icon={BookOpenText}
          label={t('home.learnLabel')}
          onClick={onStartLearn}
          title={t('home.learnTitle')}
        />
        <ModeEntryCard
          accent="blue"
          cta={t('home.cardCta')}
          description={t('home.speakDescription')}
          icon={Mic2}
          label={t('home.speakLabel')}
          onClick={onStartSpeak}
          title={t('home.speakTitle')}
        />
      </motion.div>

      <div className="relative mt-auto space-y-3 pt-5">
        {hasRecentLearn && (
          <button
            className="flex w-full items-center justify-between rounded-[22px] border border-white/80 bg-white/64 px-4 py-3 text-left text-sm font-bold text-slate-700 shadow-[0_12px_28px_rgba(91,92,126,0.08)] backdrop-blur-xl"
            onClick={onContinueLearn}
            type="button"
          >
            <span>
              <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t('home.continueLearnLabel')}</span>
              <span className="line-clamp-1">{learnSession.title || t('home.continueLearnFallback')}</span>
            </span>
            <ChevronRight className="text-slate-400" size={18} />
          </button>
        )}
        {hasRecentSpeak && (
          <button
            className="flex w-full items-center justify-between rounded-[22px] border border-white/80 bg-white/64 px-4 py-3 text-left text-sm font-bold text-slate-700 shadow-[0_12px_28px_rgba(91,92,126,0.08)] backdrop-blur-xl"
            onClick={onStartSpeak}
            type="button"
          >
            <span>
              <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t('home.continueSpeakLabel')}</span>
              <span className="line-clamp-1">{session.promptSummary || t('home.continueFallback')}</span>
            </span>
            <ChevronRight className="text-slate-400" size={18} />
          </button>
        )}
      </div>
    </motion.section>
  );
}
