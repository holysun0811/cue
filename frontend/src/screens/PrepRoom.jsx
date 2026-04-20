import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlarmClockPlus, Check, Headphones, RotateCcw, TimerReset, Wand2 } from 'lucide-react';
import { requestPreviewAudio, streamCueCards } from '../api/client.js';
import CueCard from '../components/CueCard.jsx';
import { pageTransition, staggerContainer } from '../lib/motion.js';

export default function PrepRoom({ input, cueCards, intent, onCardsChange, onIntentChange, onReady }) {
  const { t, i18n } = useTranslation();
  const [nativeThought, setNativeThought] = useState(input.nativeThought);
  const [loading, setLoading] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(90);
  const [prepTotalSeconds, setPrepTotalSeconds] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const previewAudioRef = useRef(null);
  const hasAutoStarted = useRef(false);
  const hasAdvancedRef = useRef(false);

  const generateCards = async () => {
    setError('');
    setLoading(true);
    setTimerActive(false);
    setPrepSeconds(90);
    setPrepTotalSeconds(90);
    hasAdvancedRef.current = false;
    setPreview(null);
    onCardsChange([]);
    onIntentChange('');
    let generatedCardCount = 0;

    try {
      await streamCueCards(
        {
          nativeThought,
          imageHint: input.imageName,
          locale: i18n.language
        },
        {
          onEvent: (eventName, payload) => {
            if (eventName === 'intent') {
              onIntentChange(payload.intent);
            }
            if (eventName === 'card') {
              generatedCardCount += 1;
              onCardsChange((current) => [...current, payload]);
            }
          }
        }
      );
      if (generatedCardCount > 0) {
        setTimerActive(true);
      }
    } catch {
      setError(t('prep.streamError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    generateCards();
  }, []);

  useEffect(() => {
    if (!timerActive) return undefined;

    const timerId = window.setInterval(() => {
      setPrepSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [timerActive]);

  useEffect(() => {
    if (!timerActive || prepSeconds > 0 || hasAdvancedRef.current) return;

    hasAdvancedRef.current = true;
    setTimerActive(false);
    onReady();
  }, [onReady, prepSeconds, timerActive]);

  const playPreview = async () => {
    try {
      setError('');
      const response = await requestPreviewAudio({ cards: cueCards, locale: i18n.language });
      setPreview(response);

      previewAudioRef.current?.pause();
      previewAudioRef.current = new Audio(response.audioUrl);
      await previewAudioRef.current.play();
    } catch {
      setError(t('prep.audioPlayError'));
    }
  };

  return (
    <motion.section
      className="relative flex min-h-0 flex-1 flex-col bg-black/25 px-5 pb-5 pt-5"
      {...pageTransition}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
      <div className="absolute inset-x-5 top-0 h-[2px] overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cue-purple via-cue-cyan to-cue-pink shadow-[0_0_16px_rgba(0,240,255,0.9)]"
          animate={{ width: `${Math.max(0, Math.min(100, (prepSeconds / prepTotalSeconds) * 100))}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </div>

      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cue-cyan">
            <Wand2 size={13} />
            {t('prep.eyebrow')}
          </p>
          <h2 className="mt-2 max-w-[230px] text-[26px] font-black leading-[1.06] tracking-tight text-gray-100">{t('prep.title')}</h2>
        </div>
        <div className="flex h-[78px] w-[92px] shrink-0 flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-center backdrop-blur-xl">
          <p className="w-[68px] text-center text-2xl font-black tabular-nums text-cue-cyan">{prepSeconds}</p>
          <p className="text-[10px] font-bold text-gray-500">{t('prep.seconds')}</p>
        </div>
      </div>

      <textarea
        className="mt-4 h-20 resize-none rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-gray-100 outline-none backdrop-blur-xl placeholder:text-gray-600 focus:border-cue-cyan/55"
        onChange={(event) => setNativeThought(event.target.value)}
        placeholder={t('prep.thoughtPlaceholder')}
        value={nativeThought}
      />

      <div className="mt-3 flex items-center gap-2">
        <motion.button
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-100 backdrop-blur-xl"
          onClick={() => {
            setPrepSeconds((value) => value + 30);
            setPrepTotalSeconds((value) => value + 30);
          }}
          type="button"
          whileTap={{ scale: 0.95 }}
        >
          <AlarmClockPlus size={14} />
          {t('prep.addTime')}
        </motion.button>
        <motion.button className="flex items-center gap-1.5 rounded-full border border-cue-cyan/25 bg-cue-cyan/10 px-3 py-2 text-xs font-bold text-cue-cyan backdrop-blur-xl" onClick={generateCards} type="button" whileTap={{ scale: 0.95 }}>
          <RotateCcw size={13} />
          {loading ? t('prep.generating') : t('prep.regenerate')}
        </motion.button>
        <motion.button
          className="ml-auto flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cue-purple to-cue-cyan px-3 py-2 text-xs font-black text-black shadow-neon disabled:opacity-40"
          disabled={!cueCards.length}
          onClick={onReady}
          type="button"
          whileTap={{ scale: 0.95 }}
        >
          <Check size={13} />
          {t('prep.ready')}
        </motion.button>
      </div>

      <motion.div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" variants={staggerContainer} initial="hidden" animate="show">
        {intent && <p className="rounded-2xl border border-white/5 bg-white/5 p-3 text-xs leading-relaxed text-gray-400 backdrop-blur-xl">{intent}</p>}
        {cueCards.map((card, index) => (
          <CueCard card={card} index={index} key={card.id || `${card.keyword}-${index}`} />
        ))}
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-cue-cyan/20 bg-cue-cyan/10 p-4 text-center text-sm font-bold text-cue-cyan backdrop-blur-xl">
            <TimerReset className="animate-spin" size={16} />
            {t('prep.loading')}
          </div>
        )}
        {error && <p className="text-xs text-cue-pink">{error}</p>}
      </motion.div>

      <div className="mt-4 space-y-2">
        {preview && <p className="rounded-2xl border border-white/5 bg-white/5 p-3 text-xs leading-relaxed text-gray-300 backdrop-blur-xl">{preview.script}</p>}
        <motion.button
          className="flex w-full items-center justify-center gap-2 rounded-full border border-cue-cyan/35 bg-white/5 py-3.5 text-sm font-black text-cue-cyan shadow-[0_0_28px_rgba(0,240,255,0.14)] backdrop-blur-xl disabled:opacity-40"
          disabled={!cueCards.length}
          onClick={playPreview}
          type="button"
          whileTap={{ scale: 0.97 }}
        >
          <Headphones size={17} />
          {t('prep.preview')}
        </motion.button>
      </div>
    </motion.section>
  );
}
