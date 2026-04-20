import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AudioLines, CheckCircle2, Mic2, SlidersVertical } from 'lucide-react';
import { requestTranscription } from '../api/client.js';
import CueCard from '../components/CueCard.jsx';
import { pageTransition, staggerContainer } from '../lib/motion.js';

function AudioWave({ active }) {
  return (
    <div className="flex h-16 items-center justify-center gap-2">
      {[0, 1, 2, 3, 4].map((bar) => (
        <motion.span
          className="w-2 rounded-full bg-gradient-to-t from-cue-purple to-cue-cyan shadow-[0_0_16px_rgba(0,240,255,0.45)]"
          key={bar}
          animate={{ height: active ? [18, 48 - Math.abs(2 - bar) * 6, 22] : [18, 24, 18], opacity: active ? [0.65, 1, 0.65] : 0.42 }}
          transition={{ duration: 0.74 + bar * 0.06, repeat: Infinity, ease: 'easeInOut', delay: bar * 0.08 }}
        />
      ))}
    </div>
  );
}

export default function StageScreen({ attempt, cueCards, intent, onComplete }) {
  const { t } = useTranslation();
  const [assist, setAssist] = useState(82);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(t('stage.readyStatus'));
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const cueMode = assist > 68 ? 'full' : assist > 35 ? 'compact' : 'keyword';

  const startRecording = async () => {
    setError('');
    setStatus(t('stage.listeningStatus'));
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setProcessing(true);
        setStatus(t('stage.processingStatus'));
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const response = await requestTranscription(blob);
          onComplete(response.transcript);
        } catch {
          setError(t('stage.sttError'));
          setStatus(t('stage.readyStatus'));
        } finally {
          setProcessing(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError(t('stage.micError'));
      setRecording(false);
      setProcessing(false);
      setStatus(t('stage.readyStatus'));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <motion.section
      className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 pt-5"
      {...pageTransition}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cue-cyan">
            <AudioLines size={13} />
            {t('stage.eyebrow', { attempt })}
          </p>
          <h2 className="mt-2 text-[31px] font-black leading-tight tracking-tight text-gray-100">{t('stage.title')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{intent || t('stage.defaultPrompt')}</p>
        </div>
        <div className="flex h-44 w-16 shrink-0 flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-2 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <SlidersVertical className="text-cue-cyan" size={16} />
          <span className="mt-1 text-[10px] font-black text-gray-400">{t('stage.assist')}</span>
          <input
            aria-label={t('stage.assist')}
            className="vertical-range mt-4"
            max="100"
            min="0"
            onChange={(event) => setAssist(Number(event.target.value))}
            type="range"
            value={assist}
          />
        </div>
      </div>

      <motion.div className="mt-4 grid max-h-56 gap-2 overflow-y-auto pr-1" variants={staggerContainer} initial="hidden" animate="show">
        {cueCards.map((card, index) => (
          <CueCard card={card} index={index} key={card.id || `${card.keyword}-${index}`} mode={cueMode} />
        ))}
      </motion.div>

      <div className="mt-auto flex flex-col items-center pb-4 pt-6">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-cue-cyan/30 bg-cue-cyan/5"
            animate={{ scale: recording ? [1, 1.18, 1] : [1, 1.08, 1], opacity: [0.25, 0.75, 0.25] }}
            transition={{ duration: recording ? 1.1 : 2.4, repeat: Infinity }}
          />
          <div className="absolute h-40 w-40 rounded-[42px] border border-white/10 bg-[#18181B]/82 shadow-[0_0_48px_rgba(157,78,221,0.2)] backdrop-blur-xl" />
          <div className="relative flex flex-col items-center">
            <AudioWave active={recording || processing} />
            <p className="mt-2 max-w-[150px] text-center text-sm font-black leading-snug text-gray-100">{status}</p>
          </div>
        </div>

        {!recording ? (
          <motion.button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cue-purple to-cue-cyan py-4 text-sm font-black text-black shadow-neon disabled:opacity-40"
            disabled={processing}
            onClick={startRecording}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            <Mic2 size={17} />
            {processing ? t('stage.processingButton') : t('stage.start')}
          </motion.button>
        ) : (
          <motion.button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cue-pink to-cue-purple py-4 text-sm font-black text-white shadow-purple" onClick={stopRecording} type="button" whileTap={{ scale: 0.97 }}>
            <CheckCircle2 size={17} />
            {t('stage.finish')}
          </motion.button>
        )}
        {error && <p className="mt-3 text-center text-xs font-bold text-cue-pink">{error}</p>}
      </div>
    </motion.section>
  );
}
