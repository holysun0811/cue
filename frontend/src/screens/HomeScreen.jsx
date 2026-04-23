import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ScanLine, ScrollText } from 'lucide-react';
import { pageTransition, springPop, staggerContainer } from '../lib/motion.js';
import { PRESET_TOPICS } from '../lib/homeTopics.js';
import { RecentCoverThumb } from '../components/RecentCover.jsx';

function PrimaryEntryCard({ accent, description, icon: Icon, label, onClick, title }) {
  const styles =
    accent === 'oral'
      ? {
          card: 'from-[#FF7C5A] via-[#F25A3A] to-[#E0432A]',
          iconBg: 'bg-white/30',
          glow: 'bg-white/28'
        }
      : {
          card: 'from-[#FFB366] via-[#FF8A3D] to-[#F46A1F]',
          iconBg: 'bg-white/30',
          glow: 'bg-white/28'
        };

  return (
    <motion.button
      aria-label={label}
      className={`group relative flex aspect-square min-h-[140px] w-full flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br ${styles.card} p-4 text-left text-white shadow-[0_18px_36px_rgba(239,76,47,0.28)] ring-1 ring-white/20`}
      onClick={onClick}
      type="button"
      variants={springPop}
      whileTap={{ scale: 0.97 }}
    >
      <div className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full ${styles.glow} blur-2xl`} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 28%, rgba(255,255,255,0.9) 0.5px, transparent 1px), radial-gradient(circle at 76% 62%, rgba(255,255,255,0.7) 0.5px, transparent 1px), radial-gradient(circle at 42% 82%, rgba(255,255,255,0.6) 0.5px, transparent 1px)',
          backgroundSize: '14px 14px, 22px 22px, 18px 18px'
        }}
      />
      <span className={`relative flex h-14 w-14 items-center justify-center rounded-[14px] ${styles.iconBg} text-white backdrop-blur-[2px]`}>
        <Icon size={28} strokeWidth={2.4} />
      </span>
      <div className="relative">
        <h3 className="text-[1.3rem] font-black leading-tight tracking-tight">{title}</h3>
        <p className="mt-0.5 text-[13px] font-medium leading-snug text-white/88">{description}</p>
      </div>
    </motion.button>
  );
}

function RecentPracticeCard({ item, onClick }) {
  return (
    <motion.button
      className="relative flex h-[126px] w-[154px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[22px] border border-white/35 p-3 text-left text-white shadow-[0_6px_14px_rgba(91,92,126,0.1)] transition active:translate-y-0.5"
      onClick={onClick}
      type="button"
      whileTap={{ scale: 0.97 }}
    >
      <span className="relative flex items-start justify-between gap-2">
        <RecentCoverThumb cover={item.coverPayload} />
        <span className="max-w-[80px] truncate rounded-full border border-[#F0E4D8]/80 bg-[#FFF9F2]/86 px-2 py-1 text-[10px] font-black text-slate-500">
          {item.modeLabel}
        </span>
      </span>
      <div className="relative min-w-0">
        <h4 className="line-clamp-2 text-[14px] font-black leading-tight tracking-tight text-slate-900">{item.title}</h4>
        <p className="mt-1 truncate text-[11px] font-bold text-slate-400">{item.secondaryMeta}</p>
      </div>
    </motion.button>
  );
}

function RecentEmpty({ t }) {
  return (
    <div className="flex min-h-[104px] flex-1 flex-col justify-center rounded-[22px] border border-dashed border-slate-200 bg-white/50 px-4 py-3 backdrop-blur-sm">
      <p className="text-[13px] font-black text-slate-700">{t('home.recentEmptyTitle')}</p>
      <p className="mt-0.5 text-[12px] leading-snug text-slate-400">{t('home.recentEmptyBody')}</p>
    </div>
  );
}

function TopicCard({ onClick, topic }) {
  const { t } = useTranslation();
  return (
    <motion.button
      className={`group relative flex aspect-[1.3] w-full flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-br ${topic.gradient} p-3.5 text-left text-white shadow-[0_14px_28px_rgba(91,92,126,0.16)] ring-1 ring-white/20`}
      onClick={onClick}
      type="button"
      variants={springPop}
      whileTap={{ scale: 0.96 }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 12px)'
        }}
      />
      <div className="relative flex justify-end">
        <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-white/22 text-2xl backdrop-blur-sm">
          {topic.emoji}
        </span>
      </div>
      <div className="relative">
        <h4 className="text-[1.05rem] font-black leading-tight tracking-tight">{t(topic.titleKey)}</h4>
        <p className="mt-0.5 text-[12px] font-medium leading-snug text-white/88">{t(topic.subtitleKey)}</p>
      </div>
    </motion.button>
  );
}

export default function HomeScreen({
  onOpenRecent,
  onOpenRecentAll,
  onStartLearn,
  onStartSpeak,
  onStartTopic,
  recentItems = []
}) {
  const { t } = useTranslation();

  return (
    <motion.section
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      {...pageTransition}
    >
      <div className="pointer-events-none absolute -right-24 top-6 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-48 h-52 w-52 rounded-full bg-rose-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-[480px] h-56 w-56 rounded-full bg-amber-100/50 blur-3xl" />

      <motion.div
        animate="show"
        className="relative mt-2 grid grid-cols-2 gap-3"
        initial="hidden"
        variants={staggerContainer}
      >
        <PrimaryEntryCard
          accent="oral"
          description={t('home.oralDescription')}
          icon={ScrollText}
          label={t('home.oralLabel')}
          onClick={onStartSpeak}
          title={t('home.oralTitle')}
        />
        <PrimaryEntryCard
          accent="explore"
          description={t('home.exploreDescription')}
          icon={ScanLine}
          label={t('home.exploreLabel')}
          onClick={onStartLearn}
          title={t('home.exploreTitle')}
        />
      </motion.div>

      <section className="relative mt-7">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-black tracking-tight text-slate-950">{t('home.recentTitle')}</h3>
          {recentItems.length > 0 && (
            <button
              className="flex items-center gap-0.5 text-[13px] font-black text-[#F46A1F] transition active:translate-y-0.5"
              onClick={onOpenRecentAll}
              type="button"
            >
              {t('home.recentSeeAll')}
              <ChevronRight size={14} strokeWidth={2.8} />
            </button>
          )}
        </div>
        <div className="-mr-5 mt-3">
          {recentItems.length > 0 ? (
            <div className="relative">
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-0 pr-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recentItems.map((item) => (
                  <RecentPracticeCard item={item} key={item.id} onClick={() => onOpenRecent?.(item)} />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-9 bg-gradient-to-l from-[#FFF7EE] to-transparent" />
            </div>
          ) : (
            <RecentEmpty t={t} />
          )}
        </div>
      </section>

      <section className="relative mt-7">
        <h3 className="text-[17px] font-black tracking-tight text-slate-950">{t('home.topicsTitle')}</h3>
        <motion.div
          animate="show"
          className="mt-3 grid grid-cols-2 gap-3"
          initial="hidden"
          variants={staggerContainer}
        >
          {PRESET_TOPICS.map((topic) => (
            <TopicCard key={topic.id} onClick={() => onStartTopic?.(topic)} topic={topic} />
          ))}
        </motion.div>
      </section>
    </motion.section>
  );
}
