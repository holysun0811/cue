import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, Headphones, ImagePlus, Mic, Sparkles, X } from 'lucide-react';
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

function DirectPromptComposer({ errorKey, loading, onPrepare, settings }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const canPrepare = Boolean(text.trim() || imageBase64);

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageBase64(await fileToDataUrl(file));
  };

  const startVoiceInput = () => {
    const recognition = createSpeechRecognition(
      settings.uiLanguage,
      (spokenText) => setText((current) => [current, spokenText].filter(Boolean).join(' ')),
      () => {
        setVoiceActive(false);
        setLocalError(t('prep.voiceError'));
      },
      () => setVoiceActive(false)
    );

    if (!recognition) {
      setLocalError(t('prep.voiceUnsupported'));
      return;
    }

    setLocalError('');
    setVoiceActive(true);
    recognition.start();
  };

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 pt-5" {...pageTransition}>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-500">
          <Sparkles size={13} />
          {t('prep.eyebrow')}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{t('prep.directTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('prep.directSubtitle')}</p>
      </div>

      <div className="mt-5 rounded-[26px] border border-white bg-white/82 p-3 shadow-[0_14px_32px_rgba(99,102,241,0.1)] backdrop-blur-xl">
        <textarea
          className="h-36 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
          onChange={(event) => setText(event.target.value)}
          placeholder={t('prep.directPlaceholder')}
          value={text}
        />
        {imageBase64 && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-2">
            <img alt={t('prep.imageAlt')} className="h-12 w-12 rounded-xl object-cover" src={imageBase64} />
            <p className="flex-1 text-xs font-black text-sky-600">{t('prep.imageReady')}</p>
            <button className="text-slate-400" onClick={() => setImageBase64('')} type="button">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-700" onClick={startVoiceInput} type="button">
            <Mic size={15} />
            {voiceActive ? t('prep.listening') : t('prep.voice')}
          </button>
          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-700">
            <ImagePlus size={15} />
            {t('prep.image')}
            <input accept="image/*" className="hidden" onChange={uploadImage} type="file" />
          </label>
        </div>
      </div>

      {(localError || errorKey) && <p className="mt-3 text-center text-xs font-bold text-rose-500">{localError || t(errorKey)}</p>}

      <motion.button
        className="mt-auto rounded-[22px] bg-gradient-to-r from-violet-500 to-sky-400 py-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(99,102,241,0.22)] disabled:opacity-40"
        disabled={loading || !canPrepare}
        onClick={() => onPrepare({ text, imageBase64 })}
        type="button"
        whileTap={{ scale: loading || !canPrepare ? 1 : 0.97 }}
      >
        {loading ? t('prep.preparing') : t('prep.prepareCta')}
      </motion.button>
    </motion.section>
  );
}

export default function PrepRoom({ errorKey, loading, onApproachChange, onPrepare, onPreviewPatch, onSessionPatch, onStart, session, settings }) {
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
    return <DirectPromptComposer errorKey={errorKey} loading={loading} onPrepare={onPrepare} settings={settings} />;
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
