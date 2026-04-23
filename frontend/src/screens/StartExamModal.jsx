import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Camera, ChevronRight, Mic, Sparkles, X } from 'lucide-react';
import { createSpeechRecognition, fileToDataUrl } from '../lib/media.js';

export default function StartExamModal({ errorKey, loading, onClose, onStartExam, settings }) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [sourceType, setSourceType] = useState('text');
  const [imageBase64, setImageBase64] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const photoRef = useRef(null);
  const recognitionRef = useRef(null);
  const canStartExam = inputText.trim().length >= 2 || Boolean(imageBase64);

  const attachPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageBase64(await fileToDataUrl(file));
    setSourceType('material');
    setLocalError('');
    event.target.value = '';
  };

  const startVoiceInput = () => {
    if (loading || voiceActive) return;
    const recognition = createSpeechRecognition(
      settings.uiLanguage,
      (spokenText) => {
        setSourceType('voice');
        setInputText((current) => [current, spokenText].filter(Boolean).join(' '));
      },
      () => {
        setVoiceActive(false);
        setLocalError(t('examSetup.voiceError'));
      },
      () => setVoiceActive(false)
    );

    if (!recognition) {
      setLocalError(t('examSetup.voiceUnsupported'));
      return;
    }

    setLocalError('');
    setVoiceActive(true);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setVoiceActive(false);
  };

  const startExam = () => {
    if (!canStartExam || loading) return;
    setLocalError('');
    onStartExam({
      text: inputText.trim(),
      imageBase64,
      sourceType
    });
  };

  const visibleError = localError || (errorKey ? t(errorKey) : '');

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute inset-0 z-[160] flex flex-col overflow-hidden rounded-[38px] bg-[#F7F5FF]"
      exit={{ opacity: 0, y: 32, scale: 0.985 }}
      initial={{ opacity: 0, y: 42, scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_7%,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,245,255,0.86)_50%,rgba(239,246,255,0.78))]" />
      <div className="pointer-events-none absolute left-1/2 top-[14px] z-10 h-[34px] w-[124px] -translate-x-1/2 rounded-full bg-black shadow-[0_10px_22px_rgba(15,23,42,0.28)]" />

      <header className="relative z-20 grid h-[104px] shrink-0 grid-cols-[56px_1fr_auto] items-center gap-2 px-5 pb-0 pt-[48px]">
        <button
          aria-label={t('examSetup.close')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/72 text-slate-700 shadow-[0_10px_24px_rgba(99,102,241,0.12)] backdrop-blur-md transition active:scale-95"
          onClick={onClose}
          type="button"
        >
          <X size={20} strokeWidth={2.8} />
        </button>
        <h1 className="truncate text-center text-base font-black tracking-tight text-slate-950">{t('examSetup.stepTitle')}</h1>
        <button
          className="min-w-[72px] justify-self-end whitespace-nowrap rounded-full bg-slate-950 px-4 py-2.5 text-[13px] font-black leading-none text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)] transition disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-95"
          disabled={!canStartExam || loading}
          onClick={startExam}
          type="button"
        >
          Start
        </button>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-7 pt-12">
        <section className="relative flex min-h-[430px] flex-col rounded-[32px] border border-white/90 bg-white/94 px-7 pb-20 pt-9 shadow-[0_24px_54px_rgba(91,92,126,0.12)] backdrop-blur-xl">
          <Sparkles className="mb-10 text-violet-100" size={38} strokeWidth={2.6} />
          <div>
            <p className="text-[1.65rem] font-black leading-tight tracking-tight text-slate-950">{t('examSetup.inputTitle')}</p>
            <p className="mt-1 text-[13px] font-bold leading-snug text-slate-400">{t('examSetup.inputHint')}</p>
          </div>

          <textarea
            className="mt-5 min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-[20px] font-bold leading-relaxed text-slate-800 outline-none placeholder:text-slate-300 focus:ring-0"
            onChange={(event) => {
              setSourceType('text');
              setInputText(event.target.value);
            }}
            placeholder={t('examSetup.inputPlaceholder')}
            value={inputText}
          />
          <button
            aria-label={voiceActive ? t('examSetup.voiceListening') : t('examSetup.voiceLabel')}
            className={`absolute bottom-7 right-7 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_14px_30px_rgba(99,102,241,0.18)] transition active:scale-95 ${
              voiceActive
                ? 'bg-slate-950 text-white'
                : 'bg-gradient-to-br from-violet-500 to-sky-400 text-white'
            }`}
            onClick={() => (voiceActive ? stopVoiceInput() : startVoiceInput())}
            type="button"
          >
            <Mic size={22} />
          </button>
        </section>

        <button
          className="mt-10 grid min-h-[92px] w-full grid-cols-[56px_1fr_24px] items-center gap-4 rounded-[28px] border border-white/88 bg-white/82 px-4 py-3 text-left shadow-[0_18px_36px_rgba(91,92,126,0.11)] backdrop-blur-xl transition active:scale-[0.99]"
          onClick={() => photoRef.current?.click()}
          type="button"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-sky-50 text-sky-600">
            <Camera size={22} />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black tracking-tight text-slate-950">
              {imageBase64 ? t('examSetup.materialReady') : t('examSetup.photoTitle')}
            </span>
            <span className="mt-1 block text-[13px] font-bold leading-snug text-slate-500">{t('examSetup.photoSubtitle')}</span>
          </span>
          <ChevronRight className="justify-self-end text-slate-400" size={22} />
        </button>
        <input ref={photoRef} accept="image/*" className="hidden" onChange={attachPhoto} type="file" />

        {visibleError && <p className="mt-3 text-center text-xs font-bold text-rose-500">{visibleError}</p>}
      </div>
    </motion.div>
  );
}
