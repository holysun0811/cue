import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Mic, Pause, Play, RotateCcw, Send, Volume2 } from 'lucide-react';
import { submitPractice } from '../api/client.js';
import { blobToBase64 } from '../lib/media.js';
import { pageTransition } from '../lib/motion.js';
import { uiTheme } from '../lib/uiTheme.js';

function languageKey(language = 'en') {
  if (language?.startsWith('zh')) return 'zh-CN';
  if (language?.startsWith('fr')) return 'fr';
  if (language?.startsWith('de')) return 'de';
  if (language?.startsWith('es')) return 'es';
  return 'en';
}

function shouldShowExaminerTranslation({ appLanguage = 'en', practiceLanguage = 'en' } = {}) {
  return languageKey(appLanguage) !== languageKey(practiceLanguage);
}

function examinerTranslation(message = {}) {
  return message.appLanguageTranslation || message.translatedText || message.translation || '';
}

function hydrateExaminerTranslations(messages = [], session = {}) {
  return messages.map((message) => {
    if (message.role !== 'examiner' || examinerTranslation(message)) return message;
    const isInitialExaminer = message.id === 'examiner_initial' || message.text === session.examinerPromptText;

    if (!isInitialExaminer || !session.examinerPromptTranslation) return message;

    return {
      ...message,
      appLanguageTranslation: session.examinerPromptTranslation
    };
  });
}

function fallbackExaminerPrompt(session) {
  const prompt = session.canonicalPrompt || session.promptSummary || '';
  const copy = {
    en: `Let's talk about this. ${prompt || 'Please answer the question'} Try to answer naturally with one clear reason or example.`,
    'zh-CN': `我们来聊聊这个题目。${prompt || '请回答这个问题'} 请自然回答，并加入一个清楚的理由或例子。`,
    fr: `Parlons de ce sujet. ${prompt || 'Reponds a la question'} Reponds naturellement avec une raison ou un exemple clair.`,
    de: `Sprechen wir ueber dieses Thema. ${prompt || 'Beantworte die Frage'} Antworte natuerlich mit einem klaren Grund oder Beispiel.`,
    es: `Hablemos de este tema. ${prompt || 'Responde a la pregunta'} Responde de forma natural con una razon o un ejemplo claro.`
  };
  return copy[languageKey(session.targetLanguage)] || copy.en;
}

function buildFallbackHintData(session) {
  const plan = session.speakingPlan || [];

  return {
    phrases: plan.map((item) => item.text).filter(Boolean).slice(0, 3),
    keywords: plan.map((item) => item.keyword).filter(Boolean).slice(0, 3)
  };
}

function formatDuration(seconds = 0) {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function RecordingBars({ active = false }) {
  return (
    <span className="flex h-7 items-center gap-0.5">
      {[10, 18, 13, 24, 15, 21, 11, 17, 23, 13, 19, 10].map((height, index) => (
        <span
          className={`w-1 rounded-full bg-current ${active ? 'animate-pulse' : ''}`}
          key={`${height}-${index}`}
          style={{ height, opacity: active ? 0.85 : 0.45, animationDelay: `${index * 80}ms` }}
        />
      ))}
    </span>
  );
}

function ExaminerMessage({ message, onPlay, playing, showTranslation }) {
  const { t } = useTranslation();
  const translation = showTranslation ? examinerTranslation(message) : '';

  return (
    <div className="flex justify-start">
      <div className="max-w-[82%]">
        <div className="mb-1 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${uiTheme.accent.iconSoft}`}>E</span>
          {t('practice.examiner')}
        </div>
        <div className="flex items-start gap-2">
          <div className="rounded-[22px] rounded-tl-md border border-white bg-white/88 p-3.5 shadow-[0_10px_24px_rgba(91,92,126,0.09)] backdrop-blur-xl">
            <p className="text-[14px] font-semibold leading-relaxed text-slate-800">{message.text}</p>
            {translation && (
              <p className="mt-2 border-t border-slate-200/70 pt-2 text-[12px] font-normal leading-relaxed text-slate-400">
                {translation}
              </p>
            )}
          </div>
          {message.audioUrl && (
            <button
              aria-label={t('practice.playQuestion')}
              className={`mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-[0_6px_14px_rgba(239,106,31,0.1)] transition active:scale-95 ${
                playing ? uiTheme.chip.selected : uiTheme.chip.muted
              }`}
              onClick={() => onPlay(message.audioUrl, message.id)}
              type="button"
            >
              <Volume2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phraseHints(hintData) {
  return (hintData?.phrases || []).filter(Boolean).slice(0, 2);
}

function highlightTerms(hintData) {
  return (hintData?.keywords || [])
    .filter(Boolean)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);
}

function HighlightedPhrase({ keywords, text }) {
  const matches = [];
  const occupied = [];

  keywords.forEach((keyword) => {
    const regex = new RegExp(escapeRegExp(keyword), /[\u4e00-\u9fff]/.test(keyword) ? 'g' : 'gi');
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
      <mark className={`rounded-md px-1 font-black ${uiTheme.accent.mark}`} key={`${match.start}-${index}`}>
        {text.slice(match.start, match.end)}
      </mark>
    );
    cursor = match.end;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function UserGhostBubble({ hintData, state, visible }) {
  const { t } = useTranslation();
  const items = phraseHints(hintData);
  const keywords = highlightTerms(hintData);
  const recording = state === 'recording';

  return (
    <motion.div
      animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
      className="flex justify-end"
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div className="max-w-[78%]">
        <div className={`mb-1 px-1 text-right text-[10px] font-black uppercase tracking-[0.14em] ${uiTheme.accent.eyebrowMuted}`}>
          {t('practice.answerDraft')}
        </div>
        <div
          className={`rounded-[22px] rounded-tr-md border border-dashed p-3 shadow-[0_12px_26px_rgba(91,92,126,0.08)] backdrop-blur-xl transition ${
            recording
              ? `text-[#C6531A] ${uiTheme.selectable.selected}`
              : 'border-[#F0E4D8]/80 bg-white/62 text-slate-600'
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${uiTheme.accent.eyebrow}`}>
              {t('practice.phraseHint')}
            </span>
            {recording && (
              <span className="flex items-center gap-1 text-[10px] font-black text-rose-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                {t('practice.recording')}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-right">
            {items.map((item, index) => (
              <p
                className="rounded-2xl bg-white/62 px-3 py-2 text-xs font-bold leading-snug"
                key={`${item}-${index}`}
              >
                <HighlightedPhrase keywords={keywords} text={item} />
              </p>
            ))}
          </div>

          {!items.length && (
            <p className="rounded-2xl bg-white/62 px-3 py-2 text-right text-xs font-bold text-slate-400">{t('practice.noHints')}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ExaminerTypingBubble({ showLabel }) {
  const { t } = useTranslation();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex justify-start"
      exit={{ opacity: 0, y: -4, scale: 0.96 }}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      layout
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div className="max-w-[82%]">
        <div className="mb-1 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${uiTheme.accent.iconSoft}`}>E</span>
          {t('practice.examiner')}
        </div>
        <div className="inline-flex items-center gap-2 rounded-[22px] rounded-tl-md border border-white bg-white/88 px-3.5 py-3 shadow-[0_10px_24px_rgba(91,92,126,0.09)] backdrop-blur-xl">
          <span className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                animate={{ y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
                className="h-1.5 w-1.5 rounded-full bg-slate-400"
                key={i}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15
                }}
              />
            ))}
          </span>
          {showLabel && (
            <motion.span
              animate={{ opacity: 1 }}
              className="text-[11px] font-bold text-slate-400"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {t('practice.typing')}
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function UserAudioMessage({ message }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  const toggle = async () => {
    if (!message.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(message.audioUrl);
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    await audioRef.current.play();
    setPlaying(true);
  };

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex justify-end"
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div className="max-w-[78%]">
        <div className={`mb-1 px-1 text-right text-[10px] font-black uppercase tracking-[0.14em] ${uiTheme.accent.eyebrow}`}>
          {t('practice.you')}
        </div>
        <div className={`rounded-[22px] rounded-tr-md p-3 ${uiTheme.button.primary}`}>
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20"
              onClick={toggle}
              type="button"
            >
              {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>
            <RecordingBars active={playing} />
            <span className="ml-auto text-xs font-black">{formatDuration(message.durationSec)}</span>
          </div>
          {message.transcript && (
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-white/82">{message.transcript}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function mergeServerConversation({ localAudioUrl, localMessages = [], serverMessages = [], userMessage }) {
  if (!serverMessages.length) return [];

  return serverMessages.map((message) => {
    const localMessage = localMessages.find((item) => item.id === message.id);
    if (message.id === userMessage.id) {
      return {
        ...(localMessage || {}),
        ...message,
        audioUrl: localAudioUrl,
        transcript: message.transcript || userMessage.transcript || ''
      };
    }

    return {
      ...(localMessage || {}),
      ...message,
      audioUrl: message.audioUrl || localMessage?.audioUrl || ''
    };
  }).filter((message) => message.role !== 'user' || message.audioUrl || message.transcript);
}

function buildSubmittedMessages({ attempt, messages, userMessage }) {
  const savedUserMessage = {
    ...userMessage,
    ...(attempt.userMessage || {}),
    audioUrl: userMessage.audioUrl,
    transcript: attempt.transcript || attempt.userMessage?.transcript || ''
  };
  const serverMessages = mergeServerConversation({
    localAudioUrl: userMessage.audioUrl,
    localMessages: messages,
    serverMessages: attempt.conversationMessages || [],
    userMessage: savedUserMessage
  });

  if (serverMessages.length) {
    return serverMessages;
  }

  return [
    ...messages,
    savedUserMessage,
    ...(attempt.examinerMessage ? [attempt.examinerMessage] : [])
  ];
}

function hasNewExaminerReply({ messagesBefore = [], messagesAfter = [] }) {
  const oldExaminerIds = new Set(messagesBefore.filter((message) => message.role === 'examiner').map((message) => message.id));
  return messagesAfter.some((message) => message.role === 'examiner' && !oldExaminerIds.has(message.id));
}

function FloatingHintControl({ chatAreaRef, expanded, onToggle }) {
  const { t } = useTranslation();
  const buttonSize = 48;
  const margin = 12;
  const [dock, setDock] = useState({ side: 'right', y: 320, x: null, dragging: false });
  const dragRef = useRef(null);

  const clampY = useCallback((nextY) => {
    const height = chatAreaRef.current?.clientHeight || 420;
    return Math.min(Math.max(margin, nextY), Math.max(margin, height - buttonSize - margin));
  }, [chatAreaRef]);

  useEffect(() => {
    const height = chatAreaRef.current?.clientHeight;
    if (!height) return;
    setDock((current) => ({
      ...current,
      y: clampY(Math.min(current.y, height - buttonSize - margin))
    }));
  }, [chatAreaRef, clampY]);

  const buttonLeft = (() => {
    if (dock.dragging && Number.isFinite(dock.x)) return dock.x;
    const width = chatAreaRef.current?.clientWidth || 360;
    return dock.side === 'left' ? margin : width - buttonSize - margin;
  })();

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = chatAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      rect,
      x: buttonLeft,
      y: dock.y
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    const maxX = drag.rect.width - buttonSize - margin;
    const nextX = Math.min(Math.max(margin, drag.x + dx), maxX);
    const nextY = Math.min(Math.max(margin, drag.y + dy), Math.max(margin, drag.rect.height - buttonSize - margin));
    setDock((current) => ({ ...current, dragging: true, x: nextX, y: nextY }));
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const width = drag.rect.width;
    const currentLeft = dock.dragging && Number.isFinite(dock.x) ? dock.x : drag.x;
    const nextSide = currentLeft + buttonSize / 2 < width / 2 ? 'left' : 'right';
    setDock((current) => ({
      side: nextSide,
      y: clampY(current.y),
      x: null,
      dragging: false
    }));
    if (!drag.moved) onToggle();
  };

  return (
    <>
      <button
        aria-label={t('practice.hints')}
        className={`absolute z-30 flex h-12 w-12 touch-none select-none items-center justify-center rounded-full border shadow-[0_12px_26px_rgba(239,106,31,0.16)] transition active:scale-95 ${
          expanded
            ? uiTheme.chip.selected
            : `${uiTheme.surface.chip} ${uiTheme.accent.text}`
        }`}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ left: buttonLeft, top: dock.y }}
        type="button"
      >
        <Lightbulb size={19} />
      </button>
    </>
  );
}

function VoiceComposer({
  error,
  onDeletePreview,
  onHoldEnd,
  onHoldStart,
  onSend,
  pendingDuration,
  pendingUrl,
  recorderState
}) {
  const { t } = useTranslation();
  const previewAudioRef = useRef(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  useEffect(() => () => {
    previewAudioRef.current?.pause();
  }, []);

  const playPreview = async () => {
    if (!pendingUrl) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(pendingUrl);
      previewAudioRef.current.addEventListener('ended', () => setPreviewPlaying(false));
    }
    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
      return;
    }
    await previewAudioRef.current.play();
    setPreviewPlaying(true);
  };

  return (
    <div className="border-t border-white/60 bg-white/50 px-4 pb-4 pt-3 backdrop-blur-xl">
      {recorderState === 'preview' && (
        <div className={`mb-2 rounded-[24px] p-2.5 ${uiTheme.selectable.selected}`}>
          <div className="flex items-center gap-3">
            <button
              aria-label={t('practice.playRecording')}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_8px_18px_rgba(239,106,31,0.16)] ${uiTheme.chip.selected}`}
              onClick={playPreview}
              type="button"
            >
              {previewPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>
            <RecordingBars active={previewPlaying} />
            <span className="text-xs font-black">{formatDuration(pendingDuration)}</span>
            <button
              aria-label={t('practice.sayAgain')}
              className={`ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${uiTheme.button.secondary}`}
              onClick={onDeletePreview}
              type="button"
            >
              <RotateCcw size={17} />
            </button>
            <button
              aria-label={t('practice.send')}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${uiTheme.button.primary}`}
              onClick={onSend}
              type="button"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-2 text-center text-xs font-bold text-rose-500">{error}</p>}

      <div className="flex items-center gap-2">
        {(recorderState === 'idle' || recorderState === 'recording') && (
          <button
            className={`flex min-h-14 flex-1 select-none items-center justify-center gap-2 rounded-[26px] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(239,76,47,0.22)] transition active:scale-[0.99] ${
              recorderState === 'recording'
                ? 'bg-[#C6531A]'
                : uiTheme.button.primary
            }`}
            onContextMenu={(event) => event.preventDefault()}
            onPointerCancel={onHoldEnd}
            onPointerDown={(event) => {
              if (event.button !== 0 && event.pointerType === 'mouse') return;
              event.currentTarget.setPointerCapture?.(event.pointerId);
              onHoldStart();
            }}
            onPointerLeave={(event) => {
              if (event.buttons) onHoldEnd();
            }}
            onPointerUp={onHoldEnd}
            type="button"
          >
            <Mic size={18} />
            {recorderState === 'recording' ? t('practice.releaseToPreview') : t('practice.holdToSpeak')}
          </button>
        )}
        {recorderState === 'sending' && (
          <button
            className="flex min-h-14 flex-1 items-center justify-center rounded-[26px] bg-[#E8DED1] px-4 text-sm font-black text-[#9F927F] shadow-[0_8px_18px_rgba(128,99,70,0.08)]"
            disabled
            type="button"
          >
            {t('practice.processing')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StageScreen({ entryAudioRef, onSessionPatch, session }) {
  const { t } = useTranslation();
  const [hintsExpanded, setHintsExpanded] = useState(false);
  const [recorderState, setRecorderState] = useState('idle');
  const [ghostVisible, setGhostVisible] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [playingExaminerId, setPlayingExaminerId] = useState('');
  const [typingLabelVisible, setTypingLabelVisible] = useState(false);
  const [messages, setMessages] = useState(() => {
    if (session.conversationMessages?.length) {
      return hydrateExaminerTranslations(session.conversationMessages, session);
    }
    if (session.initialMessages?.length) {
      return hydrateExaminerTranslations(session.initialMessages, session);
    }
    return hydrateExaminerTranslations([
      {
        id: 'examiner_initial',
        role: 'examiner',
        type: 'text',
        text: session.examinerPromptText || fallbackExaminerPrompt(session),
        appLanguageTranslation: session.examinerPromptTranslation || '',
        audioUrl: session.examinerPromptAudio || '',
        createdAt: new Date().toISOString()
      }
    ], session);
  });
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const sentAudioUrlsRef = useRef(new Set());
  const startedAtRef = useRef(0);
  const autoPlayedExaminerIdsRef = useRef(new Set());
  const holdActiveRef = useRef(false);
  const bottomRef = useRef(null);
  const chatAreaRef = useRef(null);
  const examinerAudioRef = useRef(null);
  const unmountStopTimerRef = useRef(null);
  const hintData = useMemo(() => session.hintData || buildFallbackHintData(session), [session]);
  const showExaminerTranslation = shouldShowExaminerTranslation({
    appLanguage: session.appLanguage,
    practiceLanguage: session.targetLanguage
  });

  const stopExaminerAudio = useCallback(({ updateState = true } = {}) => {
    if (examinerAudioRef.current) {
      examinerAudioRef.current.pause();
      examinerAudioRef.current.currentTime = 0;
      examinerAudioRef.current = null;
    }
    if (entryAudioRef?.current?.audio) {
      entryAudioRef.current.audio.pause();
      entryAudioRef.current.audio.currentTime = 0;
      entryAudioRef.current = null;
    }
    if (updateState) setPlayingExaminerId('');
  }, [entryAudioRef]);

  const playExaminerAudio = useCallback((audioUrl, messageId = 'examiner') => {
    if (!audioUrl) return;
    stopExaminerAudio();
    const audio = new Audio(audioUrl);
    examinerAudioRef.current = audio;
    setPlayingExaminerId(messageId);
    const cleanup = () => {
      if (examinerAudioRef.current === audio) {
        examinerAudioRef.current = null;
        setPlayingExaminerId('');
      }
    };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    audio.play().catch(cleanup);
  }, [stopExaminerAudio]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, ghostVisible, recorderState]);

  useEffect(() => {
    if (recorderState !== 'sending') {
      setTypingLabelVisible(false);
      return undefined;
    }
    // Animation-only by default; if backend takes >2s, show a subtle "Typing..." caption.
    const timer = window.setTimeout(() => setTypingLabelVisible(true), 2000);
    return () => window.clearTimeout(timer);
  }, [recorderState]);

  useEffect(() => {
    const nextExaminer = messages.find((message) => (
      message.role === 'examiner' &&
      message.audioUrl &&
      !autoPlayedExaminerIdsRef.current.has(message.id)
    ));
    if (!nextExaminer) return;
    autoPlayedExaminerIdsRef.current.add(nextExaminer.id);

    const entryAudio = entryAudioRef?.current;
    if (entryAudio?.audio && entryAudio.audioUrl === nextExaminer.audioUrl) {
      entryAudioRef.current = null;
      const audio = entryAudio.audio;
      examinerAudioRef.current = audio;
      setPlayingExaminerId(nextExaminer.id);

      const cleanup = () => {
        if (examinerAudioRef.current === audio) {
          examinerAudioRef.current = null;
          setPlayingExaminerId('');
        }
      };
      const fallbackPlay = () => {
        cleanup();
        playExaminerAudio(nextExaminer.audioUrl, nextExaminer.id);
      };

      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });
      entryAudio.playPromise?.catch(fallbackPlay);
      return undefined;
    }

    playExaminerAudio(nextExaminer.audioUrl, nextExaminer.id);
  }, [entryAudioRef, messages, playExaminerAudio]);

  useEffect(() => {
    if (unmountStopTimerRef.current) {
      window.clearTimeout(unmountStopTimerRef.current);
      unmountStopTimerRef.current = null;
    }

    return () => {
      unmountStopTimerRef.current = window.setTimeout(() => {
        stopExaminerAudio({ updateState: false });
        unmountStopTimerRef.current = null;
      }, 80);
    };
  }, [stopExaminerAudio]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (pending?.audioUrl && !sentAudioUrlsRef.current.has(pending.audioUrl)) {
      URL.revokeObjectURL(pending.audioUrl);
    }
  }, [pending?.audioUrl]);

  useEffect(() => () => {
    sentAudioUrlsRef.current.forEach((audioUrl) => URL.revokeObjectURL(audioUrl));
    sentAudioUrlsRef.current.clear();
  }, []);

  const startRecording = async () => {
    setError('');
    setPending(null);
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
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioBase64 = await blobToBase64(blob);
        const audioUrl = URL.createObjectURL(blob);
        setPending({ audioBase64, audioUrl, durationSec });
        setRecorderState('preview');
      };
      recorder.start();
      setRecorderState('recording');
      if (!holdActiveRef.current && recorder.state === 'recording') {
        recorder.stop();
      }
    } catch {
      setError(t('practice.micError'));
      setRecorderState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const beginHoldRecording = () => {
    if (recorderState !== 'idle') return;
    holdActiveRef.current = true;
    stopExaminerAudio();
    startRecording();
  };

  const endHoldRecording = () => {
    holdActiveRef.current = false;
    stopRecording();
  };

  const deletePreview = () => {
    if (pending?.audioUrl) URL.revokeObjectURL(pending.audioUrl);
    setPending(null);
    setRecorderState('idle');
    setGhostVisible(hintsExpanded);
  };

  const sendRecording = async () => {
    if (!pending || recorderState === 'sending') return;
    const restoreGhostOnError = hintsExpanded;
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      type: 'audio',
      audioUrl: pending.audioUrl,
      durationSec: pending.durationSec,
      createdAt: new Date().toISOString()
    };
    setGhostVisible(false);
    setHintsExpanded(false);
    setRecorderState('sending');
    setError('');
    await new Promise((resolve) => window.setTimeout(resolve, 180));

    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    // Sync the user message to session immediately so page-level actions
    // (e.g. titlebar Finish practice) can appear as soon as a message is sent,
    // without waiting for the examiner follow-up to come back.
    onSessionPatch({ conversationMessages: messagesWithUser });

    try {
      const attempt = await submitPractice({
        speakSessionId: session.sessionId,
        round: session.round,
        appLanguage: session.appLanguage,
        targetLanguage: session.targetLanguage,
        audioBase64: pending.audioBase64,
        hintLevel: 'phrases',
        hintSupportLevel: 'strong_support',
        durationSec: pending.durationSec,
        mode: session.mode || 'practice',
        clientMessageId: userMessage.id,
        createdAt: userMessage.createdAt,
        promptSummary: session.promptSummary,
        speakingPlan: session.speakingPlan,
        messageHistory: messagesWithUser.map(({ audioUrl, ...message }) => message)
      });
      const patchedMessages = buildSubmittedMessages({ attempt, messages, userMessage });
      if (!hasNewExaminerReply({ messagesBefore: messages, messagesAfter: patchedMessages })) {
        throw new Error('Missing examiner follow-up.');
      }
      sentAudioUrlsRef.current.add(userMessage.audioUrl);
      setMessages(patchedMessages);
      setPending(null);
      setRecorderState('idle');
      onSessionPatch({
        hintLevel: 'phrases',
        hintSupportLevel: 'strong_support',
        conversationMessages: patchedMessages,
        hintData: attempt.hintData || session.hintData,
        latestAttempt: null,
        latestTurnAttempt: {
          attemptId: attempt.attemptId,
          transcript: attempt.transcript,
          durationSec: attempt.durationSec
        }
      });
    } catch {
      setMessages(messages);
      onSessionPatch({ conversationMessages: messages });
      setError(t('practice.submitError'));
      setRecorderState('preview');
      setHintsExpanded(restoreGhostOnError);
      setGhostVisible(restoreGhostOnError);
    }
  };

  const toggleHints = () => {
    setHintsExpanded((current) => {
      const next = !current;
      setGhostVisible(next);
      return next;
    });
  };

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden" {...pageTransition}>
      <div className="relative min-h-0 flex-1" ref={chatAreaRef}>
        <div className="h-full overflow-y-auto px-5 pb-4 pt-3">
          <div className="space-y-4">
            {messages.map((message) => (
              message.role === 'user'
                ? <UserAudioMessage key={message.id} message={message} />
                : (
                  <ExaminerMessage
                    key={message.id}
                    message={message}
                    onPlay={playExaminerAudio}
                    playing={playingExaminerId === message.id}
                    showTranslation={showExaminerTranslation}
                  />
                )
            ))}
            <AnimatePresence>
              {ghostVisible && (
                <UserGhostBubble hintData={hintData} state={recorderState} visible />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {recorderState === 'sending' && (
                <ExaminerTypingBubble key="examiner_typing" showLabel={typingLabelVisible} />
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        </div>
        <FloatingHintControl
          chatAreaRef={chatAreaRef}
          expanded={hintsExpanded}
          onToggle={toggleHints}
        />
      </div>

      <VoiceComposer
        error={error}
        onDeletePreview={deletePreview}
        onHoldEnd={endHoldRecording}
        onHoldStart={beginHoldRecording}
        onSend={sendRecording}
        pendingDuration={pending?.durationSec || 0}
        pendingUrl={pending?.audioUrl || ''}
        recorderState={recorderState}
      />
    </motion.section>
  );
}
