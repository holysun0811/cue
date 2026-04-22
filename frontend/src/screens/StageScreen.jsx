import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AudioLines } from 'lucide-react';
import { submitPractice } from '../api/client.js';
import SegmentedControl from '../components/common/SegmentedControl.jsx';
import StickyCTA from '../components/common/StickyCTA.jsx';
import { blobToBase64 } from '../lib/media.js';
import { pageTransition } from '../lib/motion.js';

const HINT_LEVELS = ['outline', 'phrases', 'keywords'];

function hintsForLevel(plan, level) {
  if (!plan?.length || level === 'off') return [];
  if (level === 'keywords') return plan.map((item) => item.keyword).filter(Boolean).slice(0, 3);
  if (level === 'outline') return plan.map((item) => item.id.replaceAll('_', ' ')).slice(0, 3);
  return plan.map((item) => item.text).slice(0, 3);
}

export default function StageScreen({ onAttempt, onSessionPatch, session }) {
  const { t } = useTranslation();
  const rawLevel = session.hintLevel || (session.round > 1 ? 'keywords' : 'phrases');
  const [hintLevel, setHintLevel] = useState(rawLevel === 'off' ? 'keywords' : rawLevel);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);

  const hints = hintsForLevel(session.speakingPlan, hintLevel);

  const startRecording = async () => {
    setError('');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setState('processing');
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const audioBase64 = await blobToBase64(blob);
          const attempt = await submitPractice({
            speakSessionId: session.sessionId,
            round: session.round,
            targetLanguage: session.targetLanguage,
            audioBase64,
            hintLevel,
            durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
          });
          onSessionPatch({ hintLevel });
          onAttempt(attempt);
        } catch {
          setError(t('practice.submitError'));
          setState('idle');
        }
      };
      recorder.start();
      setState('recording');
    } catch {
      setError(t('practice.micError'));
      setState('idle');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const handleCta = () => {
    if (state === 'idle') startRecording();
    if (state === 'recording') stopRecording();
  };

  const ctaLabel =
    state === 'recording'
      ? t('practice.finish')
      : state === 'processing'
        ? t('practice.processing')
        : t('practice.start');

  const ctaHelper = state === 'recording' ? t('practice.guidanceRecording') : (session.take2Goal || undefined);

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden" {...pageTransition}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5">
        {/* Round eyebrow + prompt */}
        <div>
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-500">
            <AudioLines size={13} />
            {t('practice.round', { round: session.round })}
          </p>
          <p className="mt-2 text-[15px] font-bold leading-snug text-slate-900">
            {session.promptSummary || t('practice.noPrompt')}
          </p>
        </div>

        {/* Hint mode selector */}
        <div className="mt-4">
          <SegmentedControl
            onChange={(value) => {
              setHintLevel(value);
              onSessionPatch({ hintLevel: value });
            }}
            options={HINT_LEVELS.map((level) => ({ value: level, label: t(`hintLevels.${level}`) }))}
            value={hintLevel}
          />
          <p className="mt-1.5 text-center text-[11px] font-bold text-slate-400">
            {t(`practice.hintDesc.${hintLevel}`)}
          </p>
        </div>

        {/* Hint content */}
        <motion.div
          animate={{ opacity: state === 'recording' ? 0.72 : 1 }}
          className="mt-3 rounded-[22px] border border-white bg-white/82 p-3 shadow-[0_10px_24px_rgba(99,102,241,0.09)] backdrop-blur-xl"
        >
          {hints.length ? (
            <div className="space-y-2">
              {hints.map((hint, index) => (
                <p
                  className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm leading-snug text-slate-800"
                  key={`${hint}-${index}`}
                >
                  {hint}
                </p>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-400">
              {t('practice.noHints')}
            </p>
          )}
        </motion.div>

        {error && <p className="mt-3 text-center text-xs font-bold text-rose-500">{error}</p>}
      </div>

      <StickyCTA disabled={state === 'processing'} helper={ctaHelper} onClick={handleCta}>
        {ctaLabel}
      </StickyCTA>
    </motion.section>
  );
}
