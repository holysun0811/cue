import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpenText, Camera, Check, ChevronRight, Mic, Send, Sparkles, X } from 'lucide-react';
import { fileToDataUrl, createSpeechRecognition } from '../lib/media.js';
import { pageTransition } from '../lib/motion.js';
import { localizedPracticePrompts } from '../lib/practicePrompts.js';
import BottomSheet from '../components/common/BottomSheet.jsx';
import { uiTheme } from '../lib/uiTheme.js';

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

function StatePill({ children }) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-black ${uiTheme.chip.selected}`}>
      {children}
    </span>
  );
}

function RecapList({ emptyLabel, items = [] }) {
  if (!items.length) return <p className={`rounded-2xl p-3 text-sm font-bold ${uiTheme.loading.bubble}`}>{emptyLabel}</p>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <p className={`rounded-2xl p-3 text-sm leading-snug text-slate-700 ${uiTheme.surface.subtle}`} key={item}>
          {item}
        </p>
      ))}
    </div>
  );
}

function promptsFromRecap({ appLanguage = 'en', targetLanguage = 'en', title = '', t }) {
  return localizedPracticePrompts({
    appLanguage,
    targetLanguage,
    title,
    fallbackTopic: t('learn.recapTopicFallback')
  });
}

function TopicRecapSheet({ busy, collectedState, onBuildBridge, onClose, open, targetLanguage, title }) {
  const { t, i18n } = useTranslation();
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const facts = collectedState?.keyFacts || [];
  const viewpoints = collectedState?.viewpoints || [];
  const terms = collectedState?.targetTerms || [];
  const prompts = promptsFromRecap({ appLanguage: i18n.language, targetLanguage, title, t });
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedPromptId);

  useEffect(() => {
    if (!open) setSelectedPromptId('');
  }, [open]);

  return (
    <BottomSheet
      footer={(
        <div className="flex gap-2">
          <button
            className={`flex min-h-10 flex-1 items-center justify-center rounded-2xl px-3 text-xs font-black ${uiTheme.button.secondary}`}
            onClick={onClose}
            type="button"
          >
            {t('learn.continueExploring')}
          </button>
          <button
            className={`flex min-h-10 flex-[1.25] items-center justify-center rounded-2xl px-3 text-xs font-black transition ${uiTheme.button.primary} ${uiTheme.button.primaryDisabled}`}
            disabled={!selectedPrompt || busy}
            onClick={() => onBuildBridge(selectedPrompt)}
            type="button"
          >
            {busy ? t('learn.thinking') : selectedPrompt ? t('learn.startSelectedPrompt') : t('learn.choosePromptFirst')}
          </button>
        </div>
      )}
      onClose={onClose}
      open={open}
      title={t('learn.recapTitle')}
    >
      <div className="space-y-4">
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${uiTheme.accent.eyebrow}`}>{t('learn.recapTopic')}</p>
          <p className="mt-1 text-base font-black tracking-tight text-slate-950">{title}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t('learn.recapFacts')}</p>
          <RecapList emptyLabel={t('learn.recapEmpty')} items={facts.slice(0, 3)} />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t('learn.recapViewpoints')}</p>
          <RecapList emptyLabel={t('learn.recapEmpty')} items={viewpoints.slice(0, 2)} />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t('learn.recapTerms')}</p>
          <div className="flex flex-wrap gap-2">
            {terms.length ? terms.slice(0, 4).map((term) => <StatePill key={term}>{term}</StatePill>) : <StatePill>{t('learn.recapEmpty')}</StatePill>}
          </div>
        </div>
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${uiTheme.accent.eyebrow}`}>{t('learn.recapPrompts')}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{t('learn.recapPromptHelper')}</p>
          <div className="mt-3 space-y-2">
            {prompts.map((prompt) => {
              const selected = selectedPromptId === prompt.id;
              return (
                <button
                  className={`w-full rounded-2xl p-3 text-left transition ${selected ? uiTheme.selectable.selected : uiTheme.selectable.base}`}
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  type="button"
                >
                  <span className="mb-2 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${uiTheme.chip.selected}`}>{prompt.angleLabel}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        selected ? uiTheme.selectionMark.selected : uiTheme.selectionMark.idle
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </span>
                  <span className="block text-sm font-black leading-snug text-slate-800">{prompt.questionText}</span>
                  {prompt.translatedQuestionText && prompt.translatedQuestionText !== prompt.questionText && (
                    <span className="mt-1.5 block text-[12px] font-bold leading-snug text-slate-400">
                      {prompt.translatedQuestionText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

const PERSONA_DISPLAY_NAMES = {
  dolly: {
    en: 'Dolly',
    'zh-CN': '多莉',
    fr: 'Dolly',
    de: 'Dolly',
    es: 'Dolly'
  },
  geneticist: {
    en: 'Geneticist',
    'zh-CN': '遗传学家',
    fr: 'Geneticien',
    de: 'Genetiker',
    es: 'Genetista'
  },
  science_journalist: {
    en: 'Journalist',
    'zh-CN': '记者',
    fr: 'Journaliste',
    de: 'Journalist',
    es: 'Periodista'
  },
  ethics_critic: {
    en: 'Ethics critic',
    'zh-CN': '伦理批评者',
    fr: 'Critique ethique',
    de: 'Ethikkritiker',
    es: 'Critico etico'
  },
  gustave_eiffel: {
    en: 'Gustave Eiffel',
    'zh-CN': '古斯塔夫·埃菲尔',
    fr: 'Gustave Eiffel',
    de: 'Gustave Eiffel',
    es: 'Gustave Eiffel'
  },
  architecture_guide: {
    en: 'Architecture guide',
    'zh-CN': '建筑向导',
    fr: 'Guide architecture',
    de: 'Architekturfuehrer',
    es: 'Guia de arquitectura'
  },
  paris_historian: {
    en: 'Paris historian',
    'zh-CN': '巴黎历史学家',
    fr: 'Historien de Paris',
    de: 'Paris-Historiker',
    es: 'Historiador de Paris'
  },
  design_critic: {
    en: 'Critic',
    'zh-CN': '设计评论家',
    fr: 'Critique',
    de: 'Kritiker',
    es: 'Critico'
  },
  ai_researcher: {
    en: 'Researcher',
    'zh-CN': 'AI 研究员',
    fr: 'Chercheur',
    de: 'Forscher',
    es: 'Investigador'
  },
  teacher: {
    en: 'Teacher',
    'zh-CN': '老师',
    fr: 'Professeur',
    de: 'Lehrer',
    es: 'Profesor'
  },
  journalist: {
    en: 'Journalist',
    'zh-CN': '记者',
    fr: 'Journaliste',
    de: 'Journalist',
    es: 'Periodista'
  },
  skeptic: {
    en: 'Skeptic',
    'zh-CN': '怀疑者',
    fr: 'Sceptique',
    de: 'Skeptiker',
    es: 'Esceptico'
  },
  guide: {
    en: 'Guide',
    'zh-CN': '向导',
    fr: 'Guide',
    de: 'Guide',
    es: 'Guia'
  },
  expert: {
    en: 'Expert',
    'zh-CN': '专家',
    fr: 'Expert',
    de: 'Experte',
    es: 'Experto'
  },
  critic: {
    en: 'Critic',
    'zh-CN': '评论者',
    fr: 'Critique',
    de: 'Kritiker',
    es: 'Critico'
  }
};

function personaOption({ id, name, type }) {
  return {
    id,
    type,
    name,
    displayNames: PERSONA_DISPLAY_NAMES[id] || { en: name }
  };
}

function languageKey(language = 'en') {
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('fr')) return 'fr';
  if (language.startsWith('de')) return 'de';
  if (language.startsWith('es')) return 'es';
  return 'en';
}

function personaLabel(persona = {}, language = 'en') {
  const key = languageKey(language);
  return persona.displayNames?.[key] || persona.displayNames?.[key.split('-')[0]] || persona.displayNames?.en || persona.label || persona.name || '';
}

function samePersona(a = {}, b = {}) {
  if (a.id && b.id) return a.id === b.id;
  return a.name === b.name;
}

function personaSuggestionsForTopic(topic = '') {
  const normalized = topic.toLowerCase();
  if (normalized.includes('dolly') || normalized.includes('clone') || normalized.includes('cloning') || normalized.includes('克隆')) {
    return [
      personaOption({ id: 'dolly', type: 'character', name: 'Dolly' }),
      personaOption({ id: 'geneticist', type: 'expert', name: 'Geneticist' }),
      personaOption({ id: 'science_journalist', type: 'guide', name: 'Science journalist' }),
      personaOption({ id: 'ethics_critic', type: 'expert', name: 'Ethics critic' })
    ];
  }
  if (normalized.includes('eiffel') || normalized.includes('tower') || normalized.includes('埃菲尔')) {
    return [
      personaOption({ id: 'gustave_eiffel', type: 'character', name: 'Gustave Eiffel' }),
      personaOption({ id: 'architecture_guide', type: 'guide', name: 'Architecture guide' }),
      personaOption({ id: 'paris_historian', type: 'expert', name: 'Paris historian' }),
      personaOption({ id: 'design_critic', type: 'expert', name: 'Design critic' })
    ];
  }
  if (normalized.includes('ai') || normalized.includes('ethic') || normalized.includes('人工智能')) {
    return [
      personaOption({ id: 'ai_researcher', type: 'expert', name: 'AI researcher' }),
      personaOption({ id: 'teacher', type: 'guide', name: 'Teacher' }),
      personaOption({ id: 'journalist', type: 'guide', name: 'Journalist' }),
      personaOption({ id: 'skeptic', type: 'expert', name: 'Skeptic' })
    ];
  }
  return [
    personaOption({ id: 'guide', type: 'guide', name: 'Guide' }),
    personaOption({ id: 'expert', type: 'expert', name: 'Expert' }),
    personaOption({ id: 'journalist', type: 'guide', name: 'Journalist' }),
    personaOption({ id: 'critic', type: 'expert', name: 'Critic' })
  ];
}

function PersonaSuggestionRow({ onSelect, persona, suggestions }) {
  const { t, i18n } = useTranslation();
  if (!suggestions.length) return null;

  return (
    <div className={`rounded-[18px] py-2 ${uiTheme.surface.elevated}`}>
      <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('learn.personaSuggestions')}</p>
      <div className="flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestions.map((suggestion) => {
          const selected = samePersona(persona, suggestion);
          return (
            <button
              className={`min-w-[72px] shrink-0 rounded-full px-3.5 py-2 text-center text-xs font-black transition ${
                selected ? uiTheme.chip.selected : uiTheme.chip.base
              }`}
              key={suggestion.id || suggestion.name}
              onClick={() => onSelect(suggestion)}
              type="button"
            >
              {personaLabel(suggestion, i18n.language)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PersonaStatusPill({ onClick, persona }) {
  const { t, i18n } = useTranslation();
  if (!persona?.name) return null;

  return (
    <button
      className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-white/80 bg-white/58 px-3 py-2 text-xs font-black text-slate-500 shadow-[0_8px_18px_rgba(91,92,126,0.05)] backdrop-blur-xl"
      onClick={onClick}
      type="button"
    >
      <span className="text-slate-400">{t('learn.personaCurrent')}</span>
      <span className={`truncate ${uiTheme.accent.text}`}>{personaLabel(persona, i18n.language)}</span>
    </button>
  );
}

function PersonaSheet({ onChange, onClose, open, persona, suggestions }) {
  const { t, i18n } = useTranslation();

  return (
    <BottomSheet onClose={onClose} open={open} title={t('learn.personaSuggestions')}>
      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const selected = samePersona(persona, suggestion);
          return (
            <button
              className={`flex min-h-[54px] w-full items-center justify-between rounded-[20px] border px-4 text-left text-sm font-black transition ${
                selected
                  ? `${uiTheme.selectable.selected} text-slate-950`
                  : `${uiTheme.selectable.muted} text-slate-600`
              }`}
              key={suggestion.id || suggestion.name}
              onClick={() => {
                onChange(suggestion);
                onClose();
              }}
              type="button"
            >
              {personaLabel(suggestion, i18n.language)}
              {selected && <Sparkles size={16} className={uiTheme.accent.text} />}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

function RecapEntry({ busy, factsCount, hasBridge, onClick, termsCount }) {
  const { t } = useTranslation();
  const summary = hasBridge ? t('learn.recapCounts', { facts: factsCount, terms: termsCount }) : t('learn.recapGenerateHint');

  return (
    <button
      className={`flex min-h-10 w-full items-center gap-2 rounded-full px-3 py-1.5 text-left ${uiTheme.surface.chip}`}
      disabled={busy}
      onClick={onClick}
      type="button"
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${uiTheme.accent.iconSoft}`}>
        <Sparkles size={13} />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-500">
        <span className={uiTheme.accent.text}>{t('learn.recapTitle')}</span>
        <span className="px-1 text-slate-300">·</span>
        {summary}
      </span>
      <span className={`flex shrink-0 items-center gap-0.5 text-[11px] font-black ${uiTheme.accent.text}`}>
        {busy ? t('learn.thinking') : hasBridge ? t('learn.recapActionView') : t('learn.recapActionGenerate')}
        {!busy && <ChevronRight size={14} />}
      </span>
    </button>
  );
}

function LearnChatComposer({ busy, errorKey, firstTopic, onSubmit, settings }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [inputSourceType, setInputSourceType] = useState('text_input');
  const [voiceActive, setVoiceActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const cameraRef = useRef(null);
  const longPressRef = useRef(null);

  const attachImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageBase64(await fileToDataUrl(file));
    setInputSourceType('image_material');
    event.target.value = '';
  };

  const startVoiceInput = () => {
    if (busy) return;
    const recognition = createSpeechRecognition(
      settings.uiLanguage,
      (spokenText) => {
        setInputSourceType('voice_input');
        setDraft((current) => [current, spokenText].filter(Boolean).join(' '));
      },
      () => {
        setVoiceActive(false);
        setLocalError(t('learn.voiceError'));
      },
      () => setVoiceActive(false)
    );

    if (!recognition) {
      setLocalError(t('learn.voiceUnsupported'));
      return;
    }

    setLocalError('');
    setVoiceActive(true);
    recognition.start();
  };

  const startLongPress = () => {
    if (!firstTopic) return;
    window.clearTimeout(longPressRef.current);
    longPressRef.current = window.setTimeout(startVoiceInput, 520);
  };

  const cancelLongPress = () => {
    window.clearTimeout(longPressRef.current);
  };

  const send = () => {
    const message = draft.trim();
    if ((!message && !imageBase64) || busy) return;
    onSubmit({
      message,
      imageBase64,
      sourceType: imageBase64 ? 'image_material' : inputSourceType
    });
    setDraft('');
    setImageBase64('');
    setInputSourceType('text_input');
  };

  return (
    <div className={`rounded-[24px] p-2.5 ${uiTheme.surface.elevated}`}>
      {imageBase64 && (
        <div className={`mb-2 flex items-center gap-3 rounded-2xl p-2 ${uiTheme.selectable.selected}`}>
          <img alt={t('learn.materialAlt')} className="h-12 w-12 rounded-2xl object-cover" src={imageBase64} />
          <p className={`min-w-0 flex-1 text-xs font-black ${uiTheme.accent.text}`}>{t('learn.materialReady')}</p>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400"
            onClick={() => {
              setImageBase64('');
              setInputSourceType('text_input');
            }}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div
          className={`flex min-w-0 flex-1 items-center gap-2 px-3 ${uiTheme.input.container} ${
            firstTopic ? 'h-12 rounded-[22px] py-1.5' : 'min-h-[44px] rounded-[20px] py-1.5'
          }`}
          onPointerCancel={cancelLongPress}
          onPointerDown={startLongPress}
          onPointerLeave={cancelLongPress}
          onPointerUp={cancelLongPress}
        >
          <button
            aria-label={voiceActive ? t('learn.listening') : t('learn.voice')}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
              voiceActive ? uiTheme.chip.selected : uiTheme.accent.text
            }`}
            onClick={startVoiceInput}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Mic size={15} />
          </button>
          {firstTopic ? (
            <input
              className={`min-w-0 flex-1 bg-transparent px-1 text-[15px] text-slate-800 outline-none ${uiTheme.input.placeholder}`}
              onChange={(event) => {
                setDraft(event.target.value);
                if (!imageBase64) setInputSourceType('text_input');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={t('learn.firstTopicPlaceholder')}
              type="text"
              value={draft}
            />
          ) : (
            <textarea
              className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent px-1 py-1.5 text-sm leading-snug text-slate-800 outline-none max-h-20 min-h-8 ${uiTheme.input.placeholder}`}
              onChange={(event) => {
                setDraft(event.target.value);
                if (!imageBase64) setInputSourceType('text_input');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={t('learn.chatPlaceholder')}
              rows={1}
              value={draft}
            />
          )}
        </div>
        {firstTopic && (
          <button
            aria-label={t('learn.camera')}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] ${uiTheme.chip.selected}`}
            onClick={() => cameraRef.current?.click()}
            type="button"
          >
            <Camera size={18} />
          </button>
        )}
        <button
          className={`flex shrink-0 items-center justify-center transition ${uiTheme.button.primary} ${uiTheme.button.primaryDisabled} ${
            firstTopic ? 'h-11 w-11 rounded-[18px]' : 'h-11 w-11 rounded-[18px]'
          }`}
          disabled={(!draft.trim() && !imageBase64) || busy}
          onClick={send}
          type="button"
        >
          <Send size={17} />
        </button>
      </div>

      <input ref={cameraRef} accept="image/*" capture="environment" className="hidden" onChange={attachImage} type="file" />
      {(localError || errorKey) && <p className="mt-2 text-xs font-bold text-rose-500">{localError || t(errorKey)}</p>}
      {voiceActive && <p className={`mt-2 text-center text-xs font-black ${uiTheme.accent.text}`}>{t('learn.listening')}</p>}
    </div>
  );
}

export default function LearnScreen({ busy, errorKey, learnSession, onBuildBridge, onLearnPatch, onSendMessage, onStart, settings }) {
  const { t } = useTranslation();
  const [recapOpen, setRecapOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [personaSuggestionsDismissed, setPersonaSuggestionsDismissed] = useState(false);
  const [personaAutoAppliedFor, setPersonaAutoAppliedFor] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [titleProgress, setTitleProgress] = useState(0);
  const hasSession = Boolean(learnSession.learnSessionId);
  const starterMessage = t('learn.chatStarter');
  const chatHistory = hasSession
    ? learnSession.chatHistory || []
    : [{ role: 'assistant', content: starterMessage }, ...localMessages];
  const topic = learnSession.topicOrMaterial || learnSession.title || '';
  const personaSuggestions = useMemo(() => (topic ? personaSuggestionsForTopic(topic) : []), [topic]);
  const userMessageCount = chatHistory.filter((message) => message.role === 'user').length;
  const topicStarted = hasSession || localMessages.some((message) => message.role === 'user');
  const showPersonaSuggestions = hasSession && userMessageCount <= 1 && !personaSuggestionsDismissed && personaSuggestions.length > 0;

  useEffect(() => {
    if (!hasSession || !learnSession.learnSessionId || !personaSuggestions.length) return;
    if (personaAutoAppliedFor === learnSession.learnSessionId) return;

    if (!learnSession.persona?.name) {
      onLearnPatch({ persona: personaSuggestions[0] });
    }
    setPersonaAutoAppliedFor(learnSession.learnSessionId);
  }, [
    hasSession,
    learnSession.learnSessionId,
    learnSession.persona?.name,
    onLearnPatch,
    personaAutoAppliedFor,
    personaSuggestions
  ]);

  useEffect(() => {
    setPersonaSuggestionsDismissed(false);
    setPersonaOpen(false);
  }, [learnSession.learnSessionId]);

  const factsCount = learnSession.collectedState?.keyFacts?.length || 0;
  const termsCount = learnSession.collectedState?.targetTerms?.length || 0;

  const submit = (input) => {
    if (hasSession) {
      onSendMessage(input);
      return;
    }

    setLocalMessages((current) => [
      ...current,
      { role: 'user', content: input.message || t('learn.materialReady') }
    ]);
    onStart({
      topicOrMaterial: input.message || t('learn.materialReady'),
      imageBase64: input.imageBase64,
      persona: { type: 'guide', name: '' },
      starterMessage
    });
  };

  return (
    <motion.section className="relative z-30 flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4" {...pageTransition}>
      <div className={`pointer-events-none absolute -right-24 top-2 h-56 w-56 rounded-full blur-3xl ${uiTheme.background.warmGlow}`} />
      <div className={`pointer-events-none absolute -left-24 bottom-20 h-52 w-52 rounded-full blur-3xl ${uiTheme.background.softGlow}`} />

      <div
        className="relative min-w-0"
        style={{ paddingBottom: `${titleProgress * 4}px` }}
      >
        <p
          style={{
            height: `${18 * (1 - titleProgress)}px`,
            marginBottom: `${8 * (1 - titleProgress)}px`,
            opacity: 1 - titleProgress
          }}
          className={`flex items-center gap-1.5 overflow-hidden text-xs font-black uppercase tracking-[0.16em] ${uiTheme.accent.eyebrow}`}
        >
          <BookOpenText size={13} />
          {t('learn.eyebrow')}
        </p>
        <h2
          style={{
            fontSize: `${24 - titleProgress * 6}px`,
            lineHeight: `${32 - titleProgress * 8}px`
          }}
          className="truncate font-black tracking-tight text-slate-950"
        >
          {hasSession ? learnSession.title : t('learn.chatTitle')}
        </h2>
      </div>

      <div
        className="relative mt-4 min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          const nextProgress = clamp(event.currentTarget.scrollTop / 44);
          setTitleProgress((current) => (Math.abs(current - nextProgress) < 0.01 ? current : nextProgress));
        }}
      >
        <div className="space-y-2 pb-3">
          {chatHistory.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              <p
                className={`rounded-2xl p-3 text-sm leading-relaxed shadow-[0_8px_18px_rgba(91,92,126,0.07)] ${
                  message.role === 'user' ? `ml-8 ${uiTheme.button.primary}` : 'mr-8 bg-white text-slate-700'
                }`}
              >
                {message.content}
              </p>
            </div>
          ))}
          {busy && <p className={`mr-8 rounded-2xl p-3 text-sm font-bold ${uiTheme.loading.bubble}`}>{t('learn.thinking')}</p>}
          {showPersonaSuggestions ? (
            <PersonaSuggestionRow
              onSelect={(persona) => {
                onLearnPatch({ persona });
                setPersonaSuggestionsDismissed(true);
              }}
              persona={learnSession.persona}
              suggestions={personaSuggestions}
            />
          ) : (
            <PersonaStatusPill onClick={() => setPersonaOpen(true)} persona={learnSession.persona} />
          )}
        </div>
      </div>

      <div className="space-y-2">
        {hasSession && (
          <RecapEntry
            busy={busy}
            factsCount={factsCount}
            hasBridge={Boolean(factsCount || termsCount)}
            onClick={() => (factsCount || termsCount ? setRecapOpen(true) : onBuildBridge())}
            termsCount={termsCount}
          />
        )}

        <LearnChatComposer busy={busy} errorKey={errorKey} firstTopic={!topicStarted} onSubmit={submit} settings={settings} />
      </div>

      <TopicRecapSheet
        busy={busy}
        collectedState={learnSession.collectedState}
        onBuildBridge={onBuildBridge}
        onClose={() => setRecapOpen(false)}
        open={recapOpen}
        targetLanguage={settings.targetLanguage}
        title={learnSession.title}
      />
      <PersonaSheet
        onChange={(persona) => onLearnPatch({ persona })}
        onClose={() => setPersonaOpen(false)}
        open={personaOpen}
        persona={learnSession.persona}
        suggestions={personaSuggestions}
      />
    </motion.section>
  );
}
