import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Target } from 'lucide-react';
import { generateReview } from '../api/client.js';
import AudioButton from '../components/common/AudioButton.jsx';
import StickyCTA from '../components/common/StickyCTA.jsx';
import { pageTransition } from '../lib/motion.js';

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

function LoadingView({ promptSummary, t }) {
  return (
    <div className="space-y-3">
      {promptSummary && (
        <div className="rounded-2xl border border-slate-100 bg-white/70 px-3 py-2.5">
          <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-500">{promptSummary}</p>
        </div>
      )}
      <div className="rounded-[22px] border border-sky-100 bg-sky-50/80 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
          <div>
            <p className="text-sm font-black text-sky-700">{t('review.loadingTitle')}</p>
            <p className="mt-0.5 text-xs font-bold text-sky-500">{t('review.loadingHint')}</p>
          </div>
        </div>
      </div>
      <Skeleton className="h-[88px]" />
      <Skeleton className="h-[72px]" />
      <Skeleton className="h-[52px]" />
    </div>
  );
}

function ScoreRow({ label, value }) {
  return (
    <div className="grid grid-cols-[88px_1fr_28px] items-center gap-2">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
          style={{ width: `${value || 0}%` }}
        />
      </div>
      <span className="text-right text-xs font-black text-sky-600">{value || 0}</span>
    </div>
  );
}

export default function ReviewScreen({ onReviewPatch, onTakeTwo, session }) {
  const { t } = useTranslation();
  const [review, setReview] = useState(session.latestReview);
  const [loading, setLoading] = useState(!session.latestReview);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!session.latestAttempt || session.latestReview) return;
      setLoading(true);
      setError('');

      try {
        const response = await generateReview({
          speakSessionId: session.sessionId,
          attemptId: session.latestAttempt.attemptId,
          taskType: session.taskType,
          promptSummary: session.promptSummary,
          appLanguage: session.appLanguage,
          targetLanguage: session.targetLanguage,
          speakingPlan: session.speakingPlan,
          transcript: session.latestAttempt.transcript,
          round: session.round
        });

        if (!alive) return;
        setReview(response);
        onReviewPatch({ latestReview: response, take2Goal: response.take2Goal });
      } catch {
        if (!alive) return;
        setError(t('review.error'));
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [onReviewPatch, session, t]);

  const primaryFix = review?.topIssues?.[0];
  const otherFixes = review?.topIssues?.slice(1) ?? [];
  const scoreItems = ['fluency', 'vocabulary', 'pronunciation', 'structure'];

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden" {...pageTransition}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5">
        {/* Title — icon + main title only, no separate eyebrow row */}
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="shrink-0 text-violet-500" size={15} />
          <h2 className="text-xl font-black tracking-tight text-slate-950">{t('review.title')}</h2>
        </div>

        {/* State A: loading */}
        {loading && <LoadingView promptSummary={session.promptSummary} t={t} />}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-center text-sm font-black text-rose-500">
            {error}
          </div>
        )}

        {/* State B: loaded */}
        {review && (
          <div className="space-y-3">
            {/* Prompt context */}
            {session.promptSummary && (
              <div className="rounded-2xl border border-slate-100 bg-white/70 px-3 py-2.5">
                <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-500">
                  {session.promptSummary}
                </p>
              </div>
            )}

            {/* Primary fix */}
            {primaryFix && (
              <div className="rounded-[22px] border border-violet-100 bg-gradient-to-br from-violet-50 to-sky-50 p-4 shadow-[0_10px_22px_rgba(99,102,241,0.1)]">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-violet-500">
                  <Target size={12} />
                  {t('review.topFixLabel')}
                </p>
                <p className="text-[15px] font-black leading-snug text-slate-900">{primaryFix}</p>
                {review.summary && (
                  <p className="mt-2.5 text-xs font-bold leading-relaxed text-slate-600">{review.summary}</p>
                )}
              </div>
            )}

            {/* Better Version */}
            <div className="rounded-[22px] border border-white bg-white/82 p-4 shadow-[0_10px_24px_rgba(99,102,241,0.09)] backdrop-blur-xl">
              <p className="mb-2.5 text-sm font-black tracking-tight text-slate-900">{t('review.betterVersion')}</p>
              <p className="text-sm leading-relaxed text-slate-700">{review.betterVersion?.text}</p>
              {review.betterVersion?.audioUrl && (
                <div className="mt-3">
                  <AudioButton audioUrl={review.betterVersion.audioUrl} label={t('review.playBetter')} />
                </div>
              )}
            </div>

            {/* Other fixes — always expanded */}
            {otherFixes.length > 0 && (
              <div className="rounded-[22px] border border-white bg-white/82 p-4 shadow-[0_10px_24px_rgba(99,102,241,0.08)] backdrop-blur-xl">
                <p className="mb-2.5 text-sm font-black tracking-tight text-slate-900">{t('review.otherNotes')}</p>
                <div className="space-y-2">
                  {otherFixes.map((fix, i) => (
                    <p
                      className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm font-bold leading-snug text-slate-700"
                      key={i}
                    >
                      {i + 2}. {fix}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Top Version + scores — always expanded */}
            <div className="rounded-[22px] border border-white bg-white/82 p-4 shadow-[0_10px_24px_rgba(99,102,241,0.08)] backdrop-blur-xl">
              <p className="mb-2.5 text-sm font-black tracking-tight text-slate-900">{t('review.topVersion')}</p>
              <p className="text-sm leading-relaxed text-slate-700">{review.topVersion?.text}</p>
              {review.topVersion?.audioUrl && (
                <div className="mt-3">
                  <AudioButton audioUrl={review.topVersion.audioUrl} label={t('review.playTop')} />
                </div>
              )}
              {review.scores && (
                <div className="mt-4 space-y-2">
                  <p className="mb-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                    {t('review.scores')}
                  </p>
                  {scoreItems.map((item) => (
                    <ScoreRow key={item} label={t(`review.metrics.${item}`)} value={review.scores[item]} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA — only appears after review loads, no helper text */}
      {review && (
        <StickyCTA onClick={onTakeTwo}>
          {t('review.takeTwo')}
        </StickyCTA>
      )}
    </motion.section>
  );
}
