import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Target } from 'lucide-react';
import { generateReview } from '../api/client.js';
import AudioButton from '../components/common/AudioButton.jsx';
import StickyCTA from '../components/common/StickyCTA.jsx';
import { pageTransition } from '../lib/motion.js';
import { uiTheme } from '../lib/uiTheme.js';

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-2xl ${uiTheme.loading.skeleton} ${className}`} />;
}

function LoadingView({ promptSummary, t }) {
  return (
    <div className="space-y-3">
      {promptSummary && (
        <div className={`rounded-2xl px-3 py-2.5 ${uiTheme.surface.muted}`}>
          <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-500">{promptSummary}</p>
        </div>
      )}
      <div className={`rounded-[22px] p-4 ${uiTheme.selectable.selected}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#F0E4D8] border-t-[#EF4C2F]" />
          <div>
            <p className={`text-sm font-black ${uiTheme.accent.text}`}>{t('review.loadingTitle')}</p>
            <p className={`mt-0.5 text-xs font-bold ${uiTheme.accent.mutedText}`}>{t('review.loadingHint')}</p>
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
      <div className="h-1.5 overflow-hidden rounded-full bg-[#F0E8DF]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF8A5B] to-[#EF4C2F]"
          style={{ width: `${value || 0}%` }}
        />
      </div>
      <span className={`text-right text-xs font-black ${uiTheme.accent.text}`}>{value || 0}</span>
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
          conversationMessages: session.latestAttempt.conversationMessages || session.conversationMessages || [],
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
          <Sparkles className={`shrink-0 ${uiTheme.accent.icon}`} size={15} />
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
              <div className={`rounded-2xl px-3 py-2.5 ${uiTheme.surface.muted}`}>
                <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-500">
                  {session.promptSummary}
                </p>
              </div>
            )}

            {/* Primary fix */}
            {primaryFix && (
              <div className={`rounded-[22px] p-4 ${uiTheme.selectable.selected}`}>
                <p className={`mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${uiTheme.accent.text}`}>
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
            <div className={`rounded-[22px] p-4 ${uiTheme.surface.elevated}`}>
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
              <div className={`rounded-[22px] p-4 ${uiTheme.surface.elevated}`}>
                <p className="mb-2.5 text-sm font-black tracking-tight text-slate-900">{t('review.otherNotes')}</p>
                <div className="space-y-2">
                  {otherFixes.map((fix, i) => (
                    <p
                      className={`rounded-2xl px-3 py-2.5 text-sm font-bold leading-snug text-slate-700 ${uiTheme.surface.subtle}`}
                      key={i}
                    >
                      {i + 2}. {fix}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Top Version + scores — always expanded */}
            <div className={`rounded-[22px] p-4 ${uiTheme.surface.elevated}`}>
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
