import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Camera, Check, FileText, Headphones, ImagePlus, Keyboard, Mic, Sparkles, UploadCloud, X } from 'lucide-react';
import { previewSampleAnswerAudio } from '../api/client.js';
import BottomSheet from '../components/common/BottomSheet.jsx';
import StickyCTA from '../components/common/StickyCTA.jsx';
import { createSpeechRecognition, fileToDataUrl } from '../lib/media.js';
import { pageTransition } from '../lib/motion.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightedPlanText(text = '', keyword = '') {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) return text;

  const directRegex = new RegExp(escapeRegExp(normalizedKeyword), /[\u4e00-\u9fff]/.test(normalizedKeyword) ? 'g' : 'gi');
  const directMatch = directRegex.exec(text);
  if (directMatch) {
    const start = directMatch.index;
    const end = start + directMatch[0].length;
    return [
      text.slice(0, start),
      <mark className="rounded-md bg-violet-100 px-1 font-black text-violet-700" key="keyword">
        {text.slice(start, end)}
      </mark>,
      text.slice(end)
    ];
  }

  const keywordParts = normalizedKeyword
    .split(/[\s,，;；/]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .sort((a, b) => b.length - a.length)
    .slice(0, 2);
  const matches = [];
  const occupied = [];

  keywordParts.forEach((part) => {
    const regex = new RegExp(escapeRegExp(part), /[\u4e00-\u9fff]/.test(part) ? 'g' : 'gi');
    let match;
    while ((match = regex.exec(text))) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = occupied.some(([takenStart, takenEnd]) => start < takenEnd && end > takenStart);
      if (!overlaps) {
        matches.push({ start, end });
        occupied.push([start, end]);
      }
      break;
    }
  });

  if (!matches.length) return text;

  matches.sort((a, b) => a.start - b.start);
  const parts = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (cursor < match.start) parts.push(text.slice(cursor, match.start));
    parts.push(
      <mark className="rounded-md bg-violet-100 px-1 font-black text-violet-700" key={`${match.start}-${index}`}>
        {text.slice(match.start, match.end)}
      </mark>
    );
    cursor = match.end;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function PlanSection({ item, index }) {
  return (
    <motion.div
      className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_10px_22px_rgba(99,102,241,0.08)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-slate-800">{highlightedPlanText(item.text, item.keyword)}</p>
        </div>
      </div>
    </motion.div>
  );
}

function fallbackApproaches(t) {
  return [
    {
      id: 'approach_1',
      label: t('prep.approachBalanced'),
      summary: t('prep.approachBalancedSummary')
    },
    {
      id: 'approach_2',
      label: t('prep.approachBenefit'),
      summary: t('prep.approachBenefitSummary')
    },
    {
      id: 'approach_3',
      label: t('prep.approachRisk'),
      summary: t('prep.approachRiskSummary')
    }
  ];
}

const ZH_APP_APPROACHES = [
  {
    label: '平衡分析',
    summary: '先说明好处，再指出风险，最后给出平衡结论。'
  },
  {
    label: '支持价值',
    summary: '重点强调积极影响，再补充一个可管理的担忧。'
  },
  {
    label: '强调风险',
    summary: '先指出主要问题，再说明为什么需要谨慎对待。'
  }
];

function approachesForAppLanguage(appLanguage) {
  if (appLanguage?.startsWith('zh')) return ZH_APP_APPROACHES;
  return null;
}

function shortApproachSummary(summary = '') {
  const normalized = summary.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const [firstPart] = normalized.split(/[.。!！?？;；]/);
  const limit = /[\u4e00-\u9fff]/.test(normalized) ? 18 : 42;
  const text = (firstPart || normalized).trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

function splitLongCaptionSentence(sentence, maxLength = /[\u4e00-\u9fff]/.test(sentence) ? 34 : 64) {
  if (sentence.length <= maxLength) return [sentence];

  const chunks = [];
  let remaining = sentence;
  const breakPattern = /[,;:，；：]\s*|\s+(?:because|but|and|so|while|which|that|as long as)\s+/gi;

  while (remaining.length > maxLength) {
    const windowText = remaining.slice(0, maxLength + 1);
    let splitAt = -1;
    let match;

    while ((match = breakPattern.exec(windowText))) {
      splitAt = match.index + match[0].length;
    }

    if (splitAt < Math.floor(maxLength * 0.45)) {
      splitAt = windowText.lastIndexOf(' ');
    }

    if (splitAt < Math.floor(maxLength * 0.45)) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function splitSampleAnswer(text = '') {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  let sentences = [];

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
      sentences = Array.from(segmenter.segment(normalized), (item) => item.segment.trim()).filter(Boolean);
    } catch {
      // Fall back to simple punctuation splitting below.
    }
  }

  if (!sentences.length) {
    sentences = (normalized.match(/[^.!?]+[.!?]+["')\]]?|[^.!?]+$/g) || [normalized])
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }

  return sentences.flatMap((sentence) => splitLongCaptionSentence(sentence));
}

function languageKey(language = 'en') {
  if (language?.startsWith('zh')) return 'zh-CN';
  if (language?.startsWith('fr')) return 'fr';
  if (language?.startsWith('de')) return 'de';
  if (language?.startsWith('es')) return 'es';
  return 'en';
}

function buildPracticeHintData({ speakingPlan = [], appLanguage = 'en' } = {}) {
  const outlineCopy = {
    en: ['Open with your direct answer.', 'Add one reason or fact.', 'Finish with a short conclusion.'],
    'zh-CN': ['先直接回答题目。', '加入一个理由或事实。', '用一句简短结论收尾。'],
    fr: ['Commence par une reponse directe.', 'Ajoute une raison ou un fait.', 'Termine avec une conclusion courte.'],
    de: ['Beginne mit einer direkten Antwort.', 'Fuege einen Grund oder Fakt hinzu.', 'Schliesse kurz ab.'],
    es: ['Empieza con una respuesta directa.', 'Anade una razon o un dato.', 'Termina con una conclusion corta.']
  };
  const appKey = languageKey(appLanguage);

  return {
    scale: {
      supportedLevels: ['none', 'keywords', 'outline', 'strong_support'],
      defaultLevel: 'outline'
    },
    outline: outlineCopy[appKey] || outlineCopy.en,
    phrases: speakingPlan.map((item) => item.text).filter(Boolean).slice(0, 3),
    keywords: speakingPlan.map((item) => item.keyword).filter(Boolean).slice(0, 3)
  };
}

function captionIndexForTime(sentences, currentTime, duration) {
  if (sentences.length <= 1) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  const totalWeight = sentences.reduce((sum, sentence) => sum + Math.max(sentence.length, 12), 0);
  const currentWeight = Math.min(Math.max(currentTime / duration, 0), 1) * totalWeight;
  let accumulated = 0;

  for (let index = 0; index < sentences.length; index += 1) {
    accumulated += Math.max(sentences[index].length, 12);
    if (currentWeight <= accumulated) return index;
  }

  return sentences.length - 1;
}

function PreviewCaption({ currentIndex, sentences }) {
  if (!sentences.length) return null;

  const current = sentences[currentIndex] || sentences[0];

  return (
    <div className="pointer-events-none absolute bottom-[98px] left-1/2 z-30 h-[52px] w-[72%] max-w-[300px] -translate-x-1/2 rounded-[14px] bg-black/60 px-3.5 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.22)]">
      <div className="flex h-full items-center justify-center text-center text-white">
        <p className="break-words text-[12px] font-semibold leading-[18px]">{current}</p>
      </div>
    </div>
  );
}

function AnswerApproachSelector({ loading, onChange, session }) {
  const { t } = useTranslation();
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const rawApproaches = (session.recommendedApproaches?.length === 3 ? session.recommendedApproaches : fallbackApproaches(t)).slice(0, 3);
  const appLanguageFallbacks = approachesForAppLanguage(session.appLanguage);
  const approaches = appLanguageFallbacks
    ? rawApproaches.map((approach, index) => ({
        ...approach,
        label: appLanguageFallbacks[index]?.label || approach.label,
        summary: /[\u4e00-\u9fff]/.test(approach.summary || '') ? approach.summary : appLanguageFallbacks[index]?.summary || approach.summary
      }))
    : rawApproaches;
  const selectedId = session.selectedApproach?.id || approaches[0]?.id;
  const selectedApproach = session.selectedApproach?.custom
    ? session.selectedApproach
    : approaches.find((approach) => approach.id === selectedId) || approaches[0];

  const chooseApproach = async (approach) => {
    if (loading || approach.id === selectedId) return;
    await onChange(approach);
  };

  const submitCustom = async () => {
    const summary = customText.trim();
    if (!summary || loading) return;
    setCustomOpen(false);
    setCustomText('');
    await onChange({
      id: 'custom',
      label: t('prep.customApproach'),
      summary,
      custom: true
    });
  };

  return (
    <section className="mt-4 rounded-[26px] border border-white bg-white/82 p-3 shadow-[0_14px_32px_rgba(99,102,241,0.1)] backdrop-blur-xl">
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">{t('prep.approachTitle')}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">{t('prep.approachHelper')}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {approaches.map((approach) => {
          const selected = selectedId === approach.id;
          return (
            <button
              className={`w-[140px] shrink-0 overflow-hidden rounded-2xl border p-3 text-left transition disabled:opacity-55 ${
                selected
                  ? 'border-violet-300 bg-gradient-to-br from-violet-50 to-sky-50 shadow-[0_10px_22px_rgba(99,102,241,0.12)]'
                  : 'border-slate-100 bg-white'
              }`}
              disabled={loading}
              key={approach.id}
              onClick={() => chooseApproach(approach)}
              type="button"
            >
              <span className="grid grid-cols-[minmax(0,1fr)_24px] items-center gap-2">
                <span className="min-w-0 break-words text-sm font-black leading-snug text-slate-900">{approach.label}</span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    selected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 bg-slate-50 text-transparent'
                  }`}
                >
                  <Check size={13} />
                </span>
              </span>
            </button>
          );
        })}
        <button
          className={`min-h-[86px] w-[132px] shrink-0 overflow-hidden rounded-2xl border border-dashed p-3 text-left transition ${
            selectedId === 'custom'
              ? 'border-violet-300 bg-violet-50 text-violet-600'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
          disabled={loading}
          onClick={() => setCustomOpen(true)}
          type="button"
        >
          <span className="block break-words text-sm font-black leading-snug">{t('prep.customApproach')}</span>
          <span className="mt-2 block truncate text-xs font-bold leading-relaxed">{session.selectedApproach?.custom ? shortApproachSummary(session.selectedApproach.summary) : t('prep.customApproachHint')}</span>
        </button>
      </div>
      {selectedApproach?.summary && (
        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/82 px-3 py-2.5">
          <p className="whitespace-pre-line break-words text-xs font-bold leading-relaxed text-slate-600">{selectedApproach.summary}</p>
        </div>
      )}

      <BottomSheet onClose={() => setCustomOpen(false)} open={customOpen} portal size="compact" title={t('prep.customApproach')}>
        <div className="space-y-3">
          <textarea
            className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
            onChange={(event) => setCustomText(event.target.value)}
            placeholder={t('prep.customApproachPlaceholder')}
            value={customText}
          />
          <button
            className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-sky-400 text-sm font-black text-white disabled:opacity-40"
            disabled={!customText.trim() || loading}
            onClick={submitCustom}
            type="button"
          >
            {t('prep.applyApproach')}
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}

function SourceOptionCard({ description, icon: Icon, onClick, selected, title }) {
  return (
    <button
      className={`grid min-h-[62px] grid-cols-[34px_1fr_22px] items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition active:scale-[0.99] ${
        selected
          ? 'border-violet-200 bg-white/88 shadow-[0_8px_18px_rgba(99,102,241,0.1)]'
          : 'border-white/80 bg-white/58 shadow-[0_6px_14px_rgba(91,92,126,0.05)]'
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] ${
          selected ? 'bg-violet-500 text-white' : 'bg-slate-50 text-slate-500'
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-black tracking-tight text-slate-950">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-500">{description}</span>
      </span>
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 bg-white text-transparent'
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </span>
    </button>
  );
}

function DirectExamSetup({ errorKey, loading, onStartExam, settings }) {
  const { t } = useTranslation();
  const [sourceType, setSourceType] = useState('');
  const [promptText, setPromptText] = useState('');
  const [topicText, setTopicText] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const materialRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentText = sourceType === 'prompt' ? promptText : sourceType === 'topic' ? topicText : '';
  const canStartExam = sourceType === 'material' ? Boolean(imageBase64) : Boolean(sourceType && currentText.trim());

  const sourceOptions = [
    {
      id: 'prompt',
      icon: Keyboard,
      title: t('examSetup.sources.prompt.title'),
      description: t('examSetup.sources.prompt.description')
    },
    {
      id: 'topic',
      icon: Mic,
      title: t('examSetup.sources.topic.title'),
      description: t('examSetup.sources.topic.description')
    },
    {
      id: 'material',
      icon: FileText,
      title: t('examSetup.sources.material.title'),
      description: t('examSetup.sources.material.description')
    }
  ];

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageBase64(await fileToDataUrl(file));
    event.target.value = '';
    setLocalError('');
  };

  const selectSource = (nextSourceType) => {
    stopTopicSpeech();
    setSourceType(nextSourceType);
    setLocalError('');
  };

  const startTopicSpeech = () => {
    if (loading || voiceActive) return;
    const recognition = createSpeechRecognition(
      settings.uiLanguage,
      (spokenText) => setTopicText((current) => [current, spokenText].filter(Boolean).join(' ')),
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

  const stopTopicSpeech = () => {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setVoiceActive(false);
  };

  const startExam = () => {
    setLocalError('');

    if (!sourceType) {
      setLocalError(t('examSetup.errors.chooseSource'));
      return;
    }

    if (sourceType === 'material' && !imageBase64) {
      setLocalError(t('examSetup.errors.addMaterial'));
      return;
    }

    if (sourceType !== 'material' && !currentText.trim()) {
      setLocalError(t(sourceType === 'topic' ? 'examSetup.errors.addTopic' : 'examSetup.errors.addPrompt'));
      return;
    }

    onStartExam({
      text: currentText.trim(),
      imageBase64,
      sourceType
    });
  };

  const visibleError = localError || (errorKey ? t(errorKey) : '');
  const renderInputPanel = () => {
    if (sourceType === 'prompt') {
      return (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 border-l-2 border-violet-100 pl-3"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: 6 }}
          key="prompt"
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <textarea
            className="h-[78px] w-full resize-none rounded-[18px] border border-white/80 bg-white/76 px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-[0_8px_18px_rgba(91,92,126,0.06)] outline-none placeholder:text-slate-400"
            onChange={(event) => setPromptText(event.target.value)}
            placeholder={t('examSetup.promptPlaceholder')}
            value={promptText}
          />
        </motion.div>
      );
    }

    if (sourceType === 'topic') {
      return (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 space-y-2 border-l-2 border-violet-100 pl-3"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: 6 }}
          key="topic"
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <button
            className={`flex min-h-11 w-full select-none items-center justify-center gap-2 rounded-full border px-4 text-[13px] font-black shadow-[0_8px_18px_rgba(91,92,126,0.06)] transition active:scale-[0.99] ${
              voiceActive
                ? 'border-slate-900 bg-slate-950 text-white'
                : 'border-violet-100 bg-white/80 text-violet-600'
            }`}
            onContextMenu={(event) => event.preventDefault()}
            onPointerCancel={stopTopicSpeech}
            onPointerDown={(event) => {
              if (event.button !== 0 && event.pointerType === 'mouse') return;
              event.currentTarget.setPointerCapture?.(event.pointerId);
              startTopicSpeech();
            }}
            onPointerLeave={(event) => {
              if (event.buttons) stopTopicSpeech();
            }}
            onPointerUp={stopTopicSpeech}
            type="button"
          >
            <Mic size={16} />
            {voiceActive ? t('examSetup.releaseTopic') : t('examSetup.holdTopic')}
          </button>
          <p className="px-1 text-[11px] font-semibold leading-snug text-slate-400">{t('examSetup.topicExample')}</p>
          <textarea
            className="h-[62px] w-full resize-none rounded-[16px] border border-white/80 bg-white/70 px-3 py-2 text-sm leading-snug text-slate-800 shadow-[0_8px_18px_rgba(91,92,126,0.05)] outline-none placeholder:text-slate-400"
            onChange={(event) => setTopicText(event.target.value)}
            placeholder={t('examSetup.topicTranscriptPlaceholder')}
            value={topicText}
          />
        </motion.div>
      );
    }

    if (sourceType === 'material') {
      return (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 space-y-2 border-l-2 border-violet-100 pl-3"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: 6 }}
          key="material"
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          <div className="grid grid-cols-3 gap-2">
            <button
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-[16px] border border-white/80 bg-white/72 px-2 text-[11px] font-black text-slate-700 shadow-[0_6px_14px_rgba(91,92,126,0.05)]"
              onClick={() => cameraRef.current?.click()}
              type="button"
            >
              <Camera size={15} />
              {t('examSetup.materialCamera')}
            </button>
            <button
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-[16px] border border-white/80 bg-white/72 px-2 text-[11px] font-black text-slate-700 shadow-[0_6px_14px_rgba(91,92,126,0.05)]"
              onClick={() => galleryRef.current?.click()}
              type="button"
            >
              <ImagePlus size={15} />
              {t('examSetup.materialGallery')}
            </button>
            <button
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-[16px] border border-white/80 bg-white/72 px-2 text-[11px] font-black text-slate-700 shadow-[0_6px_14px_rgba(91,92,126,0.05)]"
              onClick={() => materialRef.current?.click()}
              type="button"
            >
              <UploadCloud size={15} />
              {t('examSetup.materialUpload')}
            </button>
          </div>
          <p className="px-1 text-[11px] font-semibold leading-snug text-slate-400">{t('examSetup.materialHelper')}</p>
          {imageBase64 && (
            <div className="flex items-center gap-2 rounded-[16px] border border-sky-100 bg-sky-50/78 p-2">
              <img alt={t('examSetup.materialAlt')} className="h-10 w-10 rounded-xl object-cover" src={imageBase64} />
              <p className="min-w-0 flex-1 truncate text-[11px] font-black text-sky-600">{t('examSetup.materialReady')}</p>
              <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400" onClick={() => setImageBase64('')} type="button">
                <X size={14} />
              </button>
            </div>
          )}
          <input ref={cameraRef} accept="image/*" capture="environment" className="hidden" onChange={uploadImage} type="file" />
          <input ref={galleryRef} accept="image/*" className="hidden" onChange={uploadImage} type="file" />
          <input ref={materialRef} accept="image/*" className="hidden" onChange={uploadImage} type="file" />
        </motion.div>
      );
    }

    return null;
  };

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-28 pt-4" {...pageTransition}>
      <div className="pointer-events-none absolute -right-24 top-4 h-56 w-56 rounded-full bg-sky-200/36 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-20 h-52 w-52 rounded-full bg-rose-100/70 blur-3xl" />

      <div className="relative">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-500">
          <Sparkles size={13} />
          {t('examSetup.eyebrow')}
        </p>
        <h2 className="mt-2 max-w-[18rem] text-[1.72rem] font-black leading-tight tracking-tight text-slate-950">{t('examSetup.title')}</h2>
        <p className="mt-1.5 max-w-[20rem] text-[13px] leading-relaxed text-slate-500">{t('examSetup.subtitle')}</p>
      </div>

      <div className="relative mt-4 min-h-0 flex-1 overflow-y-auto pb-3">
        <div className="space-y-1.5">
          {sourceOptions.map((option) => (
            <SourceOptionCard
              description={option.description}
              icon={option.icon}
              key={option.id}
              onClick={() => selectSource(option.id)}
              selected={sourceType === option.id}
              title={option.title}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {renderInputPanel()}
        </AnimatePresence>

        <p className="mt-3 px-1 text-center text-[11px] font-semibold leading-snug text-slate-400">
          {t('examSetup.multiTurnNote')}
        </p>

        {visibleError && <p className="mt-3 text-center text-xs font-bold text-rose-500">{visibleError}</p>}
      </div>

      <StickyCTA disabled={loading || !canStartExam} onClick={startExam}>
        {loading ? t('examSetup.preparing') : t('examSetup.startCta')}
      </StickyCTA>
    </motion.section>
  );
}

export default function PrepRoom({ errorKey, loading, onApproachChange, onPreviewPatch, onSessionPatch, onStart, onStartExam, session, settings }) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(null);
  const [previewState, setPreviewState] = useState('idle');
  const [captionIndex, setCaptionIndex] = useState(0);
  const [approachLoading, setApproachLoading] = useState(false);
  const [error, setError] = useState('');
  const previewAudioRef = useRef(null);
  const captionSentences = useMemo(() => splitSampleAnswer(preview?.transcript), [preview?.transcript]);

  useEffect(() => () => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
  }, []);

  if (!session.speakingPlan.length) {
    return <DirectExamSetup errorKey={errorKey} loading={loading} onStartExam={onStartExam} settings={settings} />;
  }

  const playPreview = async () => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setCaptionIndex(0);
    setPreviewState('loading');
    setError('');

    try {
      const response = await previewSampleAnswerAudio({
        mode: 'demo_answer',
        speakSessionId: session.sessionId,
        promptSummary: session.promptSummary,
        selectedPrompt: session.selectedPrompt,
        selectedApproach: session.selectedApproach,
        appLanguage: session.appLanguage,
        targetLanguage: session.targetLanguage,
        speakingPlan: session.speakingPlan
      });
      setPreview(response);
      onPreviewPatch({ previewAudio: response });
      const audio = new Audio(response.audioUrl);
      const sentences = splitSampleAnswer(response.transcript);
      const updateCaption = () => {
        setCaptionIndex(captionIndexForTime(sentences, audio.currentTime, audio.duration));
      };
      audio.addEventListener('timeupdate', updateCaption);
      audio.addEventListener('loadedmetadata', updateCaption, { once: true });
      audio.addEventListener('ended', () => {
        setCaptionIndex(Math.max(sentences.length - 1, 0));
        setPreviewState('idle');
        previewAudioRef.current = null;
      }, { once: true });
      audio.addEventListener('error', () => {
        setPreviewState('idle');
        previewAudioRef.current = null;
      }, { once: true });
      previewAudioRef.current = audio;
      setPreviewState('playing');
      await audio.play();
    } catch {
      setError(t('prep.previewError'));
      setPreviewState('idle');
    }
  };

  const changeApproach = async (approach) => {
    // Always clear preview immediately on any approach change.
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setPreview(null);
    setPreviewState('idle');
    setCaptionIndex(0);
    setError('');

    if (!approach.custom) {
      // Recommended approach: patch session state directly, synchronously — zero latency, zero network.
      // Primary lookup: positional index (robust even if approachId values differ across environments).
      // Fallback: ID-based match for any ordering edge cases.
      const approachIndex = session.recommendedApproaches?.findIndex((a) => a.id === approach.id) ?? -1;
      const planByIndex = approachIndex >= 0 ? session.allApproachPlans?.[approachIndex] : undefined;
      const planById = session.allApproachPlans?.find((p) => p.approachId === approach.id);
      const plan = planByIndex ?? planById;

      onSessionPatch({
        selectedApproach: approach,
        speakingPlan: plan?.speakingPlan ?? session.speakingPlan,
        hintData: buildPracticeHintData({
          speakingPlan: plan?.speakingPlan ?? session.speakingPlan,
          appLanguage: session.appLanguage
        }),
        previewAudio: null
      });
      return;
    }

    // Custom approach only: call backend to generate a new plan.
    setApproachLoading(true);
    try {
      await onApproachChange(approach);
    } catch {
      setError(t('prep.approachError'));
    } finally {
      setApproachLoading(false);
    }
  };

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden" {...pageTransition}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-5">
        <div className="px-0 pb-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              {session.promptSource === 'bridge' ? t('prep.selectedPrompt') : t('prep.promptSummary')}
            </p>
            {session.promptSource === 'bridge' && (
              <span className="shrink-0 rounded-full bg-violet-50/80 px-2 py-0.5 text-[10px] font-black text-violet-500">
                {t('prep.fromRecap')}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[15px] font-bold leading-snug text-slate-850">{session.promptSummary || t('prep.emptySummary')}</p>
        </div>

        <AnswerApproachSelector loading={approachLoading || loading} onChange={changeApproach} session={session} />

        <div className="mt-4 rounded-[26px] border border-white bg-white/82 p-3 shadow-[0_14px_32px_rgba(99,102,241,0.1)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">{t('prep.planTitle')}</p>
            {approachLoading && <span className="text-[10px] font-black text-slate-400">{t('prep.updatingPlan')}</span>}
          </div>
          {approachLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => (
                <div className="h-[86px] animate-pulse rounded-2xl bg-slate-100" key={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {session.speakingPlan.map((item, index) => (
                <PlanSection index={index} item={item} key={item.id} />
              ))}
            </div>
          )}
          <button
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-sky-100 bg-sky-50/70 py-2.5 text-xs font-black text-sky-600 disabled:opacity-45"
            disabled={previewState === 'loading' || approachLoading || !session.speakingPlan.length}
            onClick={playPreview}
            type="button"
          >
            <Headphones size={15} />
            {previewState === 'loading' ? t('prep.previewLoading') : previewState === 'playing' ? t('prep.previewPlaying') : t('prep.preview')}
          </button>
        </div>

        {error && <p className="mt-3 text-center text-xs font-bold text-rose-500">{error}</p>}
      </div>

      {previewState === 'playing' && <PreviewCaption currentIndex={captionIndex} sentences={captionSentences} />}

      <StickyCTA disabled={approachLoading || !session.speakingPlan.length} onClick={onStart}>
        {t('prep.startSpeaking')}
      </StickyCTA>
    </motion.section>
  );
}
