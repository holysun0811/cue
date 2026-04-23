import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeInput, generateBridge, prepareSpeak, requestTake2, sendLearnMessage, startLearnSession } from './api/client.js';
import i18n from './i18n.js';
import PhoneFrame from './components/PhoneFrame.jsx';
import Header from './components/Header.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import LearnScreen from './screens/LearnScreen.jsx';
import BridgeScreen from './screens/BridgeScreen.jsx';
import PrepRoom from './screens/PrepRoom.jsx';
import StageScreen from './screens/StageScreen.jsx';
import ReviewScreen from './screens/ReviewScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import StartExamModal from './screens/StartExamModal.jsx';
import FakeCameraScreen from './screens/FakeCameraScreen.jsx';
import TopicLoadingScreen from './screens/TopicLoadingScreen.jsx';
import GlobalLoadingOverlay from './components/common/GlobalLoadingOverlay.jsx';
import { uiTheme } from './lib/uiTheme.js';

function stepFromPath(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/settings') return 'settings';
  if (pathname === '/camera') return 'camera';
  if (pathname === '/learn' || pathname.startsWith('/learn/')) return 'learn';
  if (pathname === '/bridge') return 'bridge';
  if (pathname === '/speak/prep') return 'prep';
  if (pathname === '/speak/practice') return 'practice';
  if (pathname === '/speak/review') return 'review';
  if (pathname === '/explore/topic-loading') return 'topicLoading';
  return 'home';
}

const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'fr', 'de', 'es'];

const DEFAULT_SESSION = {
  sessionId: '',
  taskType: '',
  appLanguage: '',
  targetLanguage: 'en',
  promptSummary: '',
  canonicalPrompt: '',
  examinerPromptText: '',
  examinerPromptAudio: '',
  promptSource: '',
  selectedPrompt: null,
  recommendedApproaches: [],
  selectedApproach: null,
  allApproachPlans: [],
  hintData: null,
  hintSupportLevel: 'strong_support',
  initialMessages: [],
  conversationMessages: [],
  mode: 'practice',
  followUpEnabled: true,
  extractedText: '',
  speakingPlan: [],
  roundGoal: '',
  round: 1,
  hintLevel: 'phrases',
  latestAttempt: null,
  latestReview: null,
  take2Goal: '',
  originalInput: null
};

const DEFAULT_LEARN_SESSION = {
  learnSessionId: '',
  title: '',
  topicOrMaterial: '',
  persona: {
    type: 'guide',
    name: ''
  },
  chatHistory: [],
  suggestedQuestions: [],
  collectedState: {
    keyFacts: [],
    viewpoints: [],
    targetTerms: [],
    possibleQuestionAngles: []
  }
};

function normalizeSpeakSession(response, settings, extra = {}) {
  return {
    ...DEFAULT_SESSION,
    ...response,
    sessionId: response.speakSessionId || response.sessionId,
    appLanguage: settings.uiLanguage,
    targetLanguage: settings.targetLanguage,
    round: 1,
    hintLevel: 'phrases',
    ...extra
  };
}

function firstExaminerAudioMessage(session) {
  const initialMessage = (session.initialMessages || []).find((message) => message.role === 'examiner' && message.audioUrl);
  if (initialMessage) return initialMessage;
  if (session.examinerPromptAudio) {
    return {
      id: 'examiner_initial',
      audioUrl: session.examinerPromptAudio
    };
  }
  return null;
}

function buildPracticeTranscript(messages = []) {
  return messages
    .filter((message) => message.role === 'user')
    .map((message) => message.transcript || message.text || '')
    .filter(Boolean)
    .join('\n');
}

function buildFinishedPracticeAttempt({ messages = [], round = 1 }) {
  return {
    attemptId: `conversation_${Date.now().toString(36)}`,
    transcript: buildPracticeTranscript(messages),
    conversationMessages: messages,
    durationSec: messages
      .filter((message) => message.role === 'user')
      .reduce((sum, message) => sum + (message.durationSec || 0), 0),
    round
  };
}

function browserLanguage() {
  const language = navigator.language || 'en';
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('fr')) return 'fr';
  if (language.startsWith('de')) return 'de';
  if (language.startsWith('es')) return 'es';
  return 'en';
}

function savedLanguage(key, fallback) {
  const saved = window.localStorage.getItem(key);
  return SUPPORTED_LANGUAGES.includes(saved) ? saved : fallback;
}

export default function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const step = stepFromPath(location.pathname);
  const isNewLearnRoute = location.pathname === '/learn';
  const [settings, setSettings] = useState(() => ({
    uiLanguage: i18n.language,
    targetLanguage: savedLanguage('cue-target-language', 'en')
  }));
  const [learnSession, setLearnSession] = useState(DEFAULT_LEARN_SESSION);
  const [bridgeData, setBridgeData] = useState(null);
  const [session, setSession] = useState(() => ({
    ...DEFAULT_SESSION,
    appLanguage: settings.uiLanguage,
    targetLanguage: settings.targetLanguage
  }));
  const [learnBusy, setLearnBusy] = useState(false);
  const [learnError, setLearnError] = useState('');
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const [speakBusy, setSpeakBusy] = useState(false);
  const [speakError, setSpeakError] = useState('');
  const [globalLoadingKey, setGlobalLoadingKey] = useState('');
  const [practiceViewId, setPracticeViewId] = useState(0);
  const [reviewViewId, setReviewViewId] = useState(0);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [startExamOpen, setStartExamOpen] = useState(false);
  const practiceEntryAudioRef = useRef(null);

  const practiceUserMessageCount = useMemo(
    () => (session.conversationMessages || []).filter((message) => message.role === 'user').length,
    [session.conversationMessages]
  );

  const canPractice = useMemo(() => Boolean(session.sessionId && session.speakingPlan.length), [session]);
  const showGlobalLoading = Boolean(globalLoadingKey) || speakBusy || (bridgeBusy && step !== 'learn');
  const globalLoadingLabel = globalLoadingKey ? t(globalLoadingKey) : speakBusy ? t('loading.preparingSpeak') : t('loading.working');

  useEffect(() => {
    window.localStorage.setItem('cue-target-language', settings.targetLanguage);
  }, [settings.targetLanguage]);

  const startLearn = () => {
    setBridgeData(null);
    setLearnError('');
    navigate('/learn');
  };

  const startSpeak = () => {
    setSpeakError('');
    setStartExamOpen(true);
  };

  const continueSpeak = () => {
    navigate('/speak/prep');
  };

  const continueLearn = () => {
    if (!learnSession.learnSessionId) return;
    navigate(`/learn/${learnSession.learnSessionId}`);
  };

  const startFromTopic = (topic) => {
    if (!topic) return;
    navigate('/explore/topic-loading', { state: { topic } });
  };

  const prepareTopicSession = async (topic) => {
    if (!topic) return null;
    setLearnError('');
    setBridgeData(null);
    setLearnBusy(true);
    try {
      const starterMessage = t('learn.chatStarter');
      const response = await startLearnSession({
        topicOrMaterial: topic.seed,
        persona: { type: 'guide', name: '' },
        appLanguage: settings.uiLanguage,
        targetLanguage: settings.targetLanguage
      });
      setLearnSession({
        learnSessionId: response.learnSessionId,
        title: response.title,
        topicOrMaterial: topic.seed,
        appLanguage: settings.uiLanguage,
        targetLanguage: settings.targetLanguage,
        persona: response.persona || { type: 'guide', name: '' },
        suggestedQuestions: response.suggestedQuestions || [],
        chatHistory: [
          { role: 'assistant', content: starterMessage },
          { role: 'user', content: topic.seed },
          { role: 'assistant', content: response.openingMessage }
        ],
        collectedState: response.collectedState || DEFAULT_LEARN_SESSION.collectedState
      });
      return response.learnSessionId;
    } catch (error) {
      setLearnError('learn.startError');
      throw error;
    } finally {
      setLearnBusy(false);
    }
  };

  const startLearnFlow = async (input) => {
    setLearnBusy(true);
    setLearnError('');
    setBridgeData(null);
    try {
      const analysis = input.imageBase64
        ? await analyzeInput({
            text: input.topicOrMaterial,
            imageBase64: input.imageBase64,
            appLanguage: settings.uiLanguage,
            targetLanguage: settings.targetLanguage
          })
        : null;
      const response = await startLearnSession({
        ...input,
        topicOrMaterial: analysis?.extractedText || input.topicOrMaterial,
        appLanguage: settings.uiLanguage,
        targetLanguage: settings.targetLanguage
      });
      setLearnSession({
        learnSessionId: response.learnSessionId,
        title: response.title,
        topicOrMaterial: analysis?.extractedText || input.topicOrMaterial,
        appLanguage: settings.uiLanguage,
        targetLanguage: settings.targetLanguage,
        persona: response.persona || input.persona,
        suggestedQuestions: response.suggestedQuestions || [],
        chatHistory: [
          ...(input.starterMessage ? [{ role: 'assistant', content: input.starterMessage }] : []),
          { role: 'user', content: analysis?.promptSummary || analysis?.extractedText || input.topicOrMaterial || 'Material attached' },
          { role: 'assistant', content: response.openingMessage }
        ],
        collectedState: response.collectedState || DEFAULT_LEARN_SESSION.collectedState
      });
      navigate(`/learn/${response.learnSessionId}`);
    } catch {
      setLearnError('learn.startError');
    } finally {
      setLearnBusy(false);
    }
  };

  const sendLearnThought = async (input) => {
    if (!learnSession.learnSessionId) return;
    const rawMessage = typeof input === 'string' ? input : input.message;
    setLearnBusy(true);
    setLearnError('');
    setLearnSession((current) => ({
      ...current,
      chatHistory: [...(current.chatHistory || []), { role: 'user', content: rawMessage || 'Material attached' }]
    }));
    try {
      const analysis = typeof input === 'object' && input.imageBase64
        ? await analyzeInput({
            text: rawMessage,
            imageBase64: input.imageBase64,
            appLanguage: settings.uiLanguage,
            targetLanguage: settings.targetLanguage
          })
        : null;
      const response = await sendLearnMessage({
        learnSessionId: learnSession.learnSessionId,
        message: analysis?.extractedText || analysis?.promptSummary || rawMessage,
        appLanguage: settings.uiLanguage,
        targetLanguage: settings.targetLanguage
      });
      setLearnSession((current) => ({
        ...current,
        chatHistory: [...(current.chatHistory || []), { role: 'assistant', content: response.assistantMessage }],
        collectedState: response.collectedState || current.collectedState,
        canBridge: response.canBridge
      }));
    } catch {
      setLearnError('learn.messageError');
    } finally {
      setLearnBusy(false);
    }
  };

  const prepareBridgeSpeak = async (bridge, selectedPrompt = null, answerApproach = null) => {
    if (!bridge?.bridgeId) return;
    const response = await prepareSpeak({
      entryType: 'bridge',
      bridgeId: bridge.bridgeId,
      selectedPrompt,
      answerApproach,
      appLanguage: settings.uiLanguage,
      targetLanguage: settings.targetLanguage
    });
    setSession(normalizeSpeakSession(response, settings, {
      originalInput: { entryType: 'bridge', bridgeId: bridge.bridgeId, selectedPrompt },
      promptSource: 'bridge',
      selectedPrompt: selectedPrompt || response.selectedPrompt,
      selectedApproach: response.selectedApproach || answerApproach
    }));
    navigate('/speak/prep');
  };

  const buildBridge = async (selectedPrompt = null) => {
    if (!learnSession.learnSessionId) return;
    flushSync(() => {
      setGlobalLoadingKey(selectedPrompt ? 'loading.preparingSpeak' : 'loading.working');
      setBridgeBusy(true);
    });
    setLearnError('');
    setSpeakError('');
    try {
      const bridge = await generateBridge({
        learnSessionId: learnSession.learnSessionId,
        appLanguage: settings.uiLanguage,
        targetLanguage: settings.targetLanguage
      });
      setBridgeData(bridge);
      if (selectedPrompt) {
        await prepareBridgeSpeak(bridge, selectedPrompt);
      } else {
        navigate('/bridge');
      }
    } catch {
      setLearnError(selectedPrompt ? 'prep.prepareError' : 'bridge.error');
    } finally {
      setBridgeBusy(false);
      setGlobalLoadingKey('');
    }
  };

  const createDirectSpeakSession = async (taskInput) => {
    const analysis = await analyzeInput({
      taskType: 'answer_prompt',
      appLanguage: settings.uiLanguage,
      targetLanguage: settings.targetLanguage,
      text: taskInput.text,
      imageBase64: taskInput.imageBase64,
      audioBase64: taskInput.audioBase64
    });
    const response = await prepareSpeak({
      entryType: 'direct',
      mode: 'exam',
      followUpEnabled: true,
      taskInput: {
        ...taskInput,
        text: analysis.promptSummary || taskInput.text
      },
      appLanguage: settings.uiLanguage,
      targetLanguage: settings.targetLanguage
    });

    return normalizeSpeakSession(response, settings, { originalInput: { entryType: 'direct', taskInput } });
  };

  const startDirectExam = async (taskInput) => {
    flushSync(() => {
      setGlobalLoadingKey('loading.preparingExam');
      setSpeakBusy(true);
    });
    setSpeakError('');
    try {
      const nextSession = await createDirectSpeakSession(taskInput);
      setStartExamOpen(false);
      enterPractice(nextSession);
    } catch {
      setSpeakError('examSetup.startError');
    } finally {
      setSpeakBusy(false);
      setGlobalLoadingKey('');
    }
  };

  // Only called for custom approach — recommended switches are handled locally in PrepRoom.
  const updateSpeakApproach = async (answerApproach) => {
    if (!session.originalInput) return;
    setSpeakError('');
    const response = await prepareSpeak({
      entryType: session.originalInput.entryType || 'direct',
      bridgeId: session.originalInput.bridgeId,
      selectedPrompt: session.originalInput.selectedPrompt || session.selectedPrompt,
      taskInput: session.originalInput.taskInput,
      answerApproach,
      appLanguage: settings.uiLanguage,
      targetLanguage: settings.targetLanguage
    });
    setSession((current) => normalizeSpeakSession(response, settings, {
      originalInput: current.originalInput,
      promptSource: current.promptSource,
      selectedPrompt: current.selectedPrompt || response.selectedPrompt,
      selectedApproach: response.selectedApproach || answerApproach,
      allApproachPlans: current.allApproachPlans,
      initialMessages: response.initialMessages || current.initialMessages,
      examinerPromptText: response.examinerPromptText || current.examinerPromptText,
      examinerPromptAudio: response.examinerPromptAudio || current.examinerPromptAudio,
      canonicalPrompt: response.canonicalPrompt || current.canonicalPrompt,
      hintData: response.hintData || current.hintData,
      previewAudio: null
    }));
  };

  const practiceBridge = async (selectedPrompt = null) => {
    if (!bridgeData?.bridgeId) return;
    flushSync(() => {
      setGlobalLoadingKey('loading.preparingSpeak');
      setSpeakBusy(true);
    });
    setSpeakError('');
    try {
      await prepareBridgeSpeak(bridgeData, selectedPrompt);
    } catch {
      setSpeakError('prep.prepareError');
    } finally {
      setSpeakBusy(false);
      setGlobalLoadingKey('');
    }
  };

  const updateSession = (patch) => {
    setSession((current) => ({ ...current, ...patch }));
  };

  const primePracticeEntryAudio = (sourceSession = session) => {
    practiceEntryAudioRef.current?.audio?.pause();
    practiceEntryAudioRef.current = null;

    const examinerMessage = firstExaminerAudioMessage(sourceSession);
    if (!examinerMessage?.audioUrl) return;

    const audio = new Audio(examinerMessage.audioUrl);
    const handoff = {
      audio,
      audioUrl: examinerMessage.audioUrl,
      messageId: examinerMessage.id
    };
    practiceEntryAudioRef.current = handoff;
    handoff.playPromise = audio.play();
    handoff.playPromise.catch(() => {
      if (practiceEntryAudioRef.current === handoff) {
        practiceEntryAudioRef.current = null;
      }
    });
  };

  const enterPractice = (sourceSession = session) => {
    if (!sourceSession?.sessionId || !sourceSession.speakingPlan?.length) return;
    primePracticeEntryAudio(sourceSession);
    flushSync(() => {
      setPracticeViewId((current) => current + 1);
      setSession((current) => ({
        ...current,
        ...sourceSession,
        round: 1,
        hintLevel: 'phrases',
        hintSupportLevel: 'strong_support',
        conversationMessages: [],
        latestAttempt: null,
        latestReview: null,
        take2Goal: ''
      }));
    });
    navigate('/speak/practice');
  };

  const goPractice = () => {
    if (!canPractice) return;
    enterPractice(session);
  };

  const goPrepFromReview = () => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1);
      return;
    }

    navigate('/speak/prep', { replace: true });
  };

  const finishPractice = (conversationMessages) => {
    const messages = conversationMessages || session.conversationMessages || [];
    const latestAttempt = buildFinishedPracticeAttempt({
      messages,
      round: session.round
    });

    flushSync(() => {
      setReviewViewId((current) => current + 1);
      updateSession({
        conversationMessages: messages,
        latestAttempt,
        latestReview: null
      });
    });
    navigate('/speak/review', { replace: true });
  };

  const confirmFinishPractice = () => {
    setFinishConfirmOpen(false);
    finishPractice();
  };

  const takeTwo = async () => {
    const response = await requestTake2({
      speakSessionId: session.sessionId,
      previousRound: session.round,
      recommendedHintLevel: session.latestReview?.recommendedHintLevel || session.hintLevel
    });

    flushSync(() => {
      setPracticeViewId((current) => current + 1);
      updateSession({
        round: response.nextRound,
        hintLevel: response.hintLevel,
        take2Goal: response.take2Goal,
        conversationMessages: [],
        latestAttempt: null,
        latestReview: null
      });
    });
    navigate('/speak/practice', { replace: true });
  };

  return (
    <main className={`min-h-screen overflow-hidden text-slate-900 ${uiTheme.background.app}`}>
      <div className={`fixed inset-0 ${uiTheme.background.appWash}`} />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(239,106,31,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,127,89,0.026)_1px,transparent_1px)] bg-[size:40px_40px] opacity-35" />
      <div className="fixed inset-0 bg-white/18 backdrop-blur-[1px]" />

      <section className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <PhoneFrame overlay={<GlobalLoadingOverlay label={globalLoadingLabel} show={showGlobalLoading} />}>
          <Header
            onBack={step === 'review' ? goPrepFromReview : null}
            rightSlot={
              step === 'practice' && practiceUserMessageCount > 0 ? (
                <motion.button
                  className={`flex h-10 items-center px-1 text-[15px] font-semibold transition ${uiTheme.accent.text}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setFinishConfirmOpen(true)}
                  type="button"
                  whileTap={{ scale: 0.96, opacity: 0.8 }}
                >
                  {t('practice.finish')}
                </motion.button>
              ) : null
            }
            step={step}
            titleOverride={step === 'prep' && !session.speakingPlan.length ? t('examSetup.stepTitle') : null}
          />
          <AnimatePresence mode="wait">
            {step === 'home' && (
              <HomeScreen
                key="home"
                onContinueLearn={continueLearn}
                onContinueSpeak={continueSpeak}
                onStartLearn={startLearn}
                onStartSpeak={startSpeak}
                onStartTopic={startFromTopic}
                learnSession={learnSession}
                session={session}
              />
            )}
            {step === 'topicLoading' && (
              <TopicLoadingScreen
                key="topic-loading"
                onPrepareTopic={prepareTopicSession}
              />
            )}
            {step === 'settings' && (
              <SettingsScreen key="settings" onSettingsChange={setSettings} settings={settings} />
            )}
            {step === 'camera' && (
              <FakeCameraScreen key="camera" />
            )}
            {step === 'learn' && (
              <LearnScreen
                busy={learnBusy}
                errorKey={learnError}
                key="learn"
                learnSession={isNewLearnRoute ? DEFAULT_LEARN_SESSION : learnSession}
                onBuildBridge={buildBridge}
                onLearnPatch={(patch) => setLearnSession((current) => ({ ...current, ...patch }))}
                onSendMessage={sendLearnThought}
                onStart={startLearnFlow}
                settings={settings}
              />
            )}
            {step === 'bridge' && (
              <BridgeScreen
                bridgeData={bridgeData}
                busy={speakBusy || bridgeBusy}
                key="bridge"
                onContinue={() => navigate(learnSession.learnSessionId ? `/learn/${learnSession.learnSessionId}` : '/learn')}
                onPractice={practiceBridge}
              />
            )}
            {step === 'prep' && (
              <PrepRoom
                key="prep"
                errorKey={speakError}
                loading={speakBusy}
                onApproachChange={updateSpeakApproach}
                onPreviewPatch={updateSession}
                onSessionPatch={updateSession}
                onStart={goPractice}
                onStartExam={startDirectExam}
                session={session}
                settings={settings}
              />
            )}
            {step === 'practice' && (
              <StageScreen
                entryAudioRef={practiceEntryAudioRef}
                key={`practice-${session.round}-${practiceViewId}`}
                onSessionPatch={updateSession}
                session={session}
              />
            )}
            {step === 'review' && (
              <ReviewScreen
                key={`review-${reviewViewId}`}
                onReviewPatch={updateSession}
                onTakeTwo={takeTwo}
                session={session}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {startExamOpen && (
              <StartExamModal
                errorKey={speakError}
                key="start-exam-modal"
                loading={speakBusy}
                onClose={() => setStartExamOpen(false)}
                onStartExam={startDirectExam}
                settings={settings}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {finishConfirmOpen && (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-[130] flex items-center justify-center bg-black/40 px-6 backdrop-blur-[2px]"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                onClick={() => setFinishConfirmOpen(false)}
                transition={{ duration: 0.15 }}
              >
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-[270px] overflow-hidden rounded-[14px] bg-white shadow-[0_30px_60px_rgba(15,23,42,0.28)]"
                  exit={{ opacity: 0, scale: 0.96 }}
                  initial={{ opacity: 0, scale: 0.94 }}
                  onClick={(event) => event.stopPropagation()}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                >
                  <div className="px-5 pb-4 pt-5 text-center">
                    <h3 className="text-[17px] font-bold tracking-tight text-slate-950">
                      {t('practice.finishConfirmTitle')}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-snug text-slate-500">
                      {t('practice.finishConfirmBody')}
                    </p>
                  </div>
                  <div className="flex border-t border-[#F0E4D8]/80 text-[15px]">
                    <button
                      className="flex-1 py-[11px] font-normal text-slate-600 transition active:bg-[#FFF9F2]"
                      onClick={() => setFinishConfirmOpen(false)}
                      type="button"
                    >
                      {t('practice.finishConfirmCancel')}
                    </button>
                    <div aria-hidden="true" className="w-px bg-[#F0E4D8]" />
                    <button
                      className={`flex-1 py-[11px] font-semibold transition active:bg-[#FFF1E3] ${uiTheme.accent.text}`}
                      onClick={confirmFinishPractice}
                      type="button"
                    >
                      {t('practice.finishConfirmAccept')}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </PhoneFrame>
      </section>
    </main>
  );
}
