import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpenText, Camera, Check, ChevronRight, MessageCircle, Mic, Send, Sparkles, X } from 'lucide-react';
import { fileToDataUrl, createSpeechRecognition } from '../lib/media.js';
import { pageTransition } from '../lib/motion.js';
import { targetLanguagePrompts } from '../lib/practicePrompts.js';
import BottomSheet from '../components/common/BottomSheet.jsx';

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

function StatePill({ children }) {
  return (
    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-600">
      {children}
    </span>
  );
}

function RecapList({ emptyLabel, items = [] }) {
  if (!items.length) return <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-400">{emptyLabel}</p>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-snug text-slate-700" key={item}>
          {item}
        </p>
      ))}
    </div>
  );
}

function promptsFromRecap({ targetLanguage = 'en', title = '', t }) {
  return targetLanguagePrompts({
    targetLanguage,
    title,
    fallbackTopic: t('learn.recapTopicFallback')
  });
}

function TopicRecapSheet({ busy, collectedState, onBuildBridge, onClose, open, targetLanguage, title }) {
  const { t } = useTranslation();
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const facts = collectedState?.keyFacts || [];
  const viewpoints = collectedState?.viewpoints || [];
  const terms = collectedState?.targetTerms || [];
  const prompts = promptsFromRecap({ targetLanguage, title, t });
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedPromptId);

  useEffect(() => {
    if (!open) setSelectedPromptId('');
  }, [open]);

  return (
    <BottomSheet
      footer={(
        <div className="flex gap-2">
          <button
            className="flex min-h-10 flex-1 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-3 text-xs font-black text-slate-500"
            onClick={onClose}
            type="button"
          >
            {t('learn.continueExploring')}
          </button>
          <button
            className="flex min-h-10 flex-[1.25] items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-sky-400 px-3 text-xs font-black text-white shadow-[0_8px_18px_rgba(99,102,241,0.18)] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
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
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">{t('learn.recapTopic')}</p>
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
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">{t('learn.recapPrompts')}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{t('learn.recapPromptHelper')}</p>
          <div className="mt-3 space-y-2">
            {prompts.map((prompt) => {
              const selected = selectedPromptId === prompt.id;
              return (
                <button
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    selected
                      ? 'border-violet-300 bg-gradient-to-r from-violet-50 to-sky-50 shadow-[0_10px_22px_rgba(99,102,241,0.12)]'
                      : 'border-slate-100 bg-white shadow-[0_8px_18px_rgba(99,102,241,0.06)]'
                  }`}
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  type="button"
                >
                  <span className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-500">{prompt.angleLabel}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        selected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 bg-slate-50 text-transparent'
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </span>
                  <span className="block text-sm font-black leading-snug text-slate-800">{prompt.questionText}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

function personaSuggestionsForTopic(topic = '') {
  const normalized = topic.toLowerCase();
  if (normalized.includes('dolly') || normalized.includes('clone') || normalized.includes('cloning') || normalized.includes('克隆')) {
    return [
      { type: 'character', name: 'Dolly', label: 'Dolly' },
      { type: 'expert', name: 'Geneticist', label: 'Geneticist' },
      { type: 'guide', name: 'Science journalist', label: 'Journalist' },
      { type: 'expert', name: 'Ethics critic', label: 'Ethics critic' }
    ];
  }
  if (normalized.includes('eiffel') || normalized.includes('tower') || normalized.includes('埃菲尔')) {
    return [
      { type: 'character', name: 'Gustave Eiffel', label: 'Gustave Eiffel' },
      { type: 'guide', name: 'Architecture guide', label: 'Architecture guide' },
      { type: 'expert', name: 'Paris historian', label: 'Paris historian' },
      { type: 'expert', name: 'Design critic', label: 'Critic' }
    ];
  }
  if (normalized.includes('ai') || normalized.includes('ethic') || normalized.includes('人工智能')) {
    return [
      { type: 'expert', name: 'AI researcher', label: 'Researcher' },
      { type: 'guide', name: 'Teacher', label: 'Teacher' },
      { type: 'guide', name: 'Journalist', label: 'Journalist' },
      { type: 'expert', name: 'Skeptic', label: 'Skeptic' }
    ];
  }
  return [
    { type: 'guide', name: 'Guide', label: 'Guide' },
    { type: 'expert', name: 'Expert', label: 'Expert' },
    { type: 'guide', name: 'Journalist', label: 'Journalist' },
    { type: 'expert', name: 'Critic', label: 'Critic' }
  ];
}

function PersonaSuggestionRow({ onSelect, persona, suggestions }) {
  const { t } = useTranslation();
  if (!suggestions.length) return null;

  return (
    <div className="rounded-[18px] border border-white/70 bg-white/50 py-2 shadow-[0_8px_18px_rgba(91,92,126,0.05)] backdrop-blur-xl">
      <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('learn.personaSuggestions')}</p>
      <div className="flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestions.map((suggestion) => {
          const selected = persona?.name === suggestion.name;
          return (
            <button
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${
                selected ? 'bg-slate-950 text-white' : 'border border-white/80 bg-white/78 text-slate-600'
              }`}
              key={suggestion.name}
              onClick={() => onSelect(suggestion)}
              type="button"
            >
              {suggestion.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PersonaStatusPill({ onClick, persona }) {
  const { t } = useTranslation();
  if (!persona?.name) return null;

  return (
    <button
      className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-white/80 bg-white/58 px-3 py-2 text-xs font-black text-slate-500 shadow-[0_8px_18px_rgba(91,92,126,0.05)] backdrop-blur-xl"
      onClick={onClick}
      type="button"
    >
      <span className="text-slate-400">{t('learn.personaCurrent')}</span>
      <span className="truncate text-violet-500">{persona.name}</span>
    </button>
  );
}

function PersonaSheet({ onChange, onClose, open, persona, suggestions }) {
  const { t } = useTranslation();

  return (
    <BottomSheet onClose={onClose} open={open} title={t('learn.personaSuggestions')}>
      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const selected = persona?.name === suggestion.name;
          return (
            <button
              className={`flex min-h-[54px] w-full items-center justify-between rounded-[20px] border px-4 text-left text-sm font-black transition ${
                selected
                  ? 'border-violet-200 bg-gradient-to-r from-violet-50 to-sky-50 text-slate-950'
                  : 'border-slate-100 bg-slate-50 text-slate-600'
              }`}
              key={suggestion.name}
              onClick={() => {
                onChange(suggestion);
                onClose();
              }}
              type="button"
            >
              {suggestion.label}
              {selected && <Sparkles size={16} className="text-violet-500" />}
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
      className="flex min-h-10 w-full items-center gap-2 rounded-full border border-violet-100/50 bg-white/48 px-3 py-1.5 text-left shadow-[0_6px_14px_rgba(99,102,241,0.05)] backdrop-blur-xl"
      disabled={busy}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-500">
        <Sparkles size={13} />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-500">
        <span className="text-violet-500">{t('learn.recapTitle')}</span>
        <span className="px-1 text-slate-300">·</span>
        {summary}
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-black text-violet-500">
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
  const [voiceActive, setVoiceActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const cameraRef = useRef(null);
  const longPressRef = useRef(null);

  const attachImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageBase64(await fileToDataUrl(file));
    event.target.value = '';
  };

  const startVoiceInput = () => {
    if (busy) return;
    const recognition = createSpeechRecognition(
      settings.uiLanguage,
      (spokenText) => setDraft((current) => [current, spokenText].filter(Boolean).join(' ')),
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
    onSubmit({ message, imageBase64 });
    setDraft('');
    setImageBase64('');
  };

  return (
    <div className="rounded-[24px] border border-white bg-white/82 p-2.5 shadow-[0_10px_24px_rgba(99,102,241,0.07)] backdrop-blur-xl">
      {imageBase64 && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-2">
          <img alt={t('learn.materialAlt')} className="h-12 w-12 rounded-2xl object-cover" src={imageBase64} />
          <p className="min-w-0 flex-1 text-xs font-black text-sky-600">{t('learn.materialReady')}</p>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400" onClick={() => setImageBase64('')} type="button">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div
          className={`flex min-w-0 flex-1 items-center gap-2 border border-slate-200/80 bg-slate-50/90 px-3 ${
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
              voiceActive ? 'bg-violet-500 text-white' : 'text-violet-400'
            }`}
            onClick={startVoiceInput}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Mic size={15} />
          </button>
          <textarea
            className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent px-1 text-sm leading-snug text-slate-800 outline-none placeholder:text-slate-400 ${
              firstTopic ? 'h-6 whitespace-nowrap py-0 text-[15px] leading-6' : 'max-h-20 min-h-8 py-1.5'
            }`}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={firstTopic ? t('learn.firstTopicPlaceholder') : t('learn.chatPlaceholder')}
            rows={1}
            value={draft}
          />
        </div>
        {firstTopic && (
          <button
            aria-label={t('learn.camera')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-sky-100 bg-sky-50 text-sky-600 shadow-[0_8px_18px_rgba(14,165,233,0.08)]"
            onClick={() => cameraRef.current?.click()}
            type="button"
          >
            <Camera size={18} />
          </button>
        )}
        <button
          className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-violet-500 to-sky-400 text-white shadow-[0_10px_22px_rgba(99,102,241,0.2)] disabled:opacity-40 ${
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
      {voiceActive && <p className="mt-2 text-center text-xs font-black text-violet-500">{t('learn.listening')}</p>}
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
      <div className="pointer-events-none absolute -right-24 top-2 h-56 w-56 rounded-full bg-sky-200/36 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-20 h-52 w-52 rounded-full bg-rose-100/70 blur-3xl" />

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
          className="flex items-center gap-1.5 overflow-hidden text-xs font-black uppercase tracking-[0.16em] text-violet-500"
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
        <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">
          <MessageCircle size={14} />
          {t('learn.thread')}
        </div>
        <div className="space-y-2 pb-3">
          {chatHistory.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              <p
                className={`rounded-2xl p-3 text-sm leading-relaxed shadow-[0_8px_18px_rgba(99,102,241,0.06)] ${
                  message.role === 'user' ? 'ml-8 bg-violet-500 text-white' : 'mr-8 bg-white text-slate-700'
                }`}
              >
                {message.content}
              </p>
            </div>
          ))}
          {busy && <p className="mr-8 rounded-2xl bg-white p-3 text-sm font-bold text-slate-400">{t('learn.thinking')}</p>}
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
