import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Film, Play, Sparkles } from 'lucide-react';
import { requestPerfectAudio, requestReview } from '../api/client.js';
import RadarScore from '../components/RadarScore.jsx';
import { pageTransition } from '../lib/motion.js';

export default function ReviewScreen({ cueCards, transcript, intent, onTakeTwo }) {
  const { t } = useTranslation();
  const [review, setReview] = useState(null);
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    let alive = true;

    const loadReview = async () => {
      setLoading(true);
      setError('');
      const reviewResponse = await requestReview({ transcript, cueCards, intent });
      if (!alive) return;
      setReview(reviewResponse);
      const audioResponse = await requestPerfectAudio({ text: reviewResponse.perfect });
      if (!alive) return;
      setAudio(audioResponse);
      setLoading(false);
    };

    loadReview().catch(() => {
      setError(t('review.error'));
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [cueCards, intent, transcript]);

  const playPerfect = () => {
    audioRef.current?.play?.();
  };

  const highlightedPerfect = review?.perfect?.split(' ').map((word, index) => {
    const isAccent = ['Actually,', 'turning', 'mass', 'production', 'harsh', 'changed', 'forever.'].some((token) =>
      word.toLowerCase().includes(token.toLowerCase().replace('.', '').replace(',', ''))
    );

    return (
      <span className={isAccent ? 'text-cue-cyan drop-shadow-[0_0_12px_rgba(0,240,255,0.45)]' : ''} key={`${word}-${index}`}>
        {word}{' '}
      </span>
    );
  });

  return (
    <motion.section
      className="relative flex min-h-0 flex-1 flex-col px-5 pb-0 pt-5"
      {...pageTransition}
    >
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cue-cyan">
          <Sparkles size={13} />
          {t('review.eyebrow')}
        </p>
        <h2 className="mt-2 text-[34px] font-black leading-tight tracking-tight text-gray-100">{t('review.title')}</h2>
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-32 pr-1">
        {loading && (
          <div className="rounded-3xl border border-cue-cyan/20 bg-cue-cyan/10 p-4 text-center text-sm font-bold text-cue-cyan backdrop-blur-xl">
            {t('review.loading')}
          </div>
        )}
        {error && (
          <div className="rounded-3xl border border-cue-pink/20 bg-cue-pink/10 p-4 text-center text-sm font-bold text-cue-pink backdrop-blur-xl">
            {error}
          </div>
        )}

        {review && (
          <>
            <RadarScore scores={review.scores} />
            <div className="rounded-3xl border border-white/5 bg-[#18181B]/78 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cue-pink">{t('review.clunky')}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{review.original}</p>
              <div className="my-4 h-px bg-white/10" />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cue-cyan">{t('review.native')}</p>
              <p className="mt-2 text-base leading-relaxed tracking-tight text-gray-100">{highlightedPerfect}</p>
            </div>
            <div className="rounded-2xl border border-cue-purple/20 bg-cue-purple/10 p-3 text-sm leading-relaxed text-gray-300 backdrop-blur-xl">
              {review.feedback}
            </div>

            <div className="rounded-[28px] border border-white/5 bg-[linear-gradient(135deg,rgba(157,78,221,0.24),rgba(24,24,27,0.92)_44%,rgba(0,240,255,0.16))] p-4 shadow-purple backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <motion.button
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-black shadow-[0_0_32px_rgba(255,255,255,0.16)] disabled:opacity-40"
                  disabled={!audio || !review}
                  onClick={playPerfect}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                >
                  <Play size={26} fill="currentColor" />
                </motion.button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cue-cyan">Perfect Track</p>
                  <p className="mt-1 truncate text-lg font-black tracking-tight text-gray-100">{t('review.title')}</p>
                  <div className="mt-3 flex h-7 items-end gap-1">
                    {[18, 26, 14, 28, 20, 32, 16, 24, 12].map((height, index) => (
                      <span className="w-1.5 rounded-full bg-cue-cyan/80" key={`${height}-${index}`} style={{ height }} />
                    ))}
                  </div>
                </div>
              </div>
              <button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-black text-gray-100 backdrop-blur-xl disabled:opacity-40"
                disabled={!audio || !review}
                onClick={playPerfect}
                type="button"
              >
                <Play size={15} fill="currentColor" />
                {t('review.playPerfect')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/5 bg-black/45 px-5 pb-5 pt-3 backdrop-blur-xl">
        <audio ref={audioRef} src={audio?.audioUrl} />
        <motion.button className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-cue-purple via-cue-pink to-cue-cyan py-4 text-base font-black tracking-tight text-white shadow-[0_18px_54px_rgba(255,45,149,0.28)]" onClick={onTakeTwo} type="button" whileTap={{ scale: 0.97 }}>
          <Film size={18} />
          {t('review.takeTwo')}
        </motion.button>
      </div>
    </motion.section>
  );
}
