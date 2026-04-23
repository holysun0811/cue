import { analyzePromptInput, buildSpeakingPlan, generateExaminerFollowUpMessage, generateExaminerPromptMessage, generatePracticeHintData } from '../services/gemini.service.js';
import { transcribeAudio } from '../services/stt.service.js';
import { synthesizeText } from '../services/tts.service.js';
import { createAttempt, createSession, getBridge, getSession, updateSession } from '../services/session.service.js';
import { createId } from '../utils/ids.js';
import { decodeBase64Payload, estimateDurationSecFromBase64 } from '../utils/media.js';

function appLanguageKey(language = 'en') {
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('fr')) return 'fr';
  if (language.startsWith('de')) return 'de';
  if (language.startsWith('es')) return 'es';
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
  const key = appLanguageKey(appLanguage);

  return {
    scale: {
      supportedLevels: ['none', 'keywords', 'outline', 'strong_support'],
      defaultLevel: 'outline'
    },
    outline: outlineCopy[key] || outlineCopy.en,
    phrases: speakingPlan.map((item) => item.text).filter(Boolean).slice(0, 3),
    keywords: speakingPlan.map((item) => item.keyword).filter(Boolean).slice(0, 3)
  };
}

function stripClientOnlyMessageFields(message = {}) {
  const { audioUrl, ...safeMessage } = message;
  return safeMessage;
}

function mergeUserMessage({ history = [], clientMessageId, transcript, durationSec, createdAt }) {
  const userMessage = {
    id: clientMessageId || createId('user'),
    role: 'user',
    type: 'audio',
    transcript,
    durationSec,
    createdAt: createdAt || new Date().toISOString()
  };
  const safeHistory = history.map(stripClientOnlyMessageFields);
  const existingIndex = safeHistory.findIndex((message) => message.id === userMessage.id);

  if (existingIndex >= 0) {
    const merged = [...safeHistory];
    merged[existingIndex] = {
      ...merged[existingIndex],
      ...userMessage
    };
    return { conversationMessages: merged, userMessage: merged[existingIndex] };
  }

  return {
    conversationMessages: [...safeHistory, userMessage],
    userMessage
  };
}

export async function prepareSpeak(req, res, next) {
  try {
    console.log('\n========== [prepareSpeak] REQUEST ==========');
    console.log('  entryType:', req.body.entryType);
    console.log('  answerApproach:', JSON.stringify(req.body.answerApproach));
    console.log('  appLanguage:', req.body.appLanguage, '| targetLanguage:', req.body.targetLanguage);

    const appLanguage = req.body.appLanguage || 'zh-CN';
    const targetLanguage = req.body.targetLanguage || 'en';
    const answerApproach = req.body.answerApproach || null;
    let promptSummary = '';
    let taskType = 'answer_prompt';
    let bridge = null;

    if (req.body.entryType === 'bridge') {
      bridge = getBridge(req.body.bridgeId);
      if (!bridge) {
        res.status(404).json({ error: 'Bridge not found.' });
        return;
      }
      const selectedPrompt =
        req.body.selectedPrompt ||
        bridge.recommendedPrompts?.find((prompt) => prompt.id === req.body.selectedPromptId);
      promptSummary = selectedPrompt?.questionText || bridge.practiceQuestion;
      bridge = {
        ...bridge,
        selectedPrompt: selectedPrompt
          ? {
              id: selectedPrompt.id,
              angleLabel: selectedPrompt.angleLabel,
              questionText: selectedPrompt.questionText
            }
          : null
      };
    } else {
      const taskInput = req.body.taskInput || {};
      const audioTranscript = taskInput.audioBase64
        ? await transcribeAudio({
            audioBuffer: decodeBase64Payload(taskInput.audioBase64),
            languageCode: appLanguage
          })
        : null;
      const analysis = await analyzePromptInput({
        taskType,
        appLanguage,
        targetLanguage,
        text: [taskInput.text, audioTranscript?.transcript].filter(Boolean).join('\n'),
        imageBase64: taskInput.imageBase64,
        audioBase64: taskInput.audioBase64
      });
      promptSummary = analysis.promptSummary;
      taskType = analysis.suggestedTaskType || taskType;
    }

    const plan = await buildSpeakingPlan({
      taskType,
      promptSummary,
      appLanguage,
      targetLanguage,
      answerApproach,
      userIntentNotes: bridge
        ? `${bridge.summary}\n${bridge.speakingAngle}\nSelected practice angle: ${bridge.selectedPrompt?.angleLabel || 'default'}`
        : req.body.taskInput?.text
    });
    const canonicalPrompt = promptSummary;
    const examinerPromptMessage = await generateExaminerPromptMessage({
      promptSummary: canonicalPrompt,
      targetLanguage,
      appLanguage
    });
    const examinerPromptText = examinerPromptMessage.text;
    const examinerAudio = await synthesizeText({
      text: examinerPromptText,
      language: targetLanguage
    });
    const hintData = buildPracticeHintData({ speakingPlan: plan.speakingPlan, appLanguage });
    const initialMessages = [
      {
        id: 'examiner_initial',
        role: 'examiner',
        type: 'text',
        text: examinerPromptText,
        appLanguageTranslation: examinerPromptMessage.appLanguageTranslation || '',
        audioUrl: examinerAudio.audioUrl,
        createdAt: new Date().toISOString()
      }
    ];

    const session = createSession({
      speakSessionId: '',
      entryType: req.body.entryType || 'direct',
      bridgeId: bridge?.bridgeId,
      mode: req.body.mode || 'practice',
      followUpEnabled: req.body.followUpEnabled ?? true,
      canonicalPrompt,
      examinerPromptText,
      examinerPromptTranslation: examinerPromptMessage.appLanguageTranslation || '',
      examinerPromptAudio: examinerAudio.audioUrl,
      hintData,
      initialMessages,
      promptSource: bridge ? 'bridge' : 'direct',
      selectedPrompt: bridge?.selectedPrompt,
      recommendedApproaches: plan.recommendedApproaches,
      selectedApproach: plan.selectedApproach,
      allApproachPlans: plan.allApproachPlans,
      taskType: plan.taskType || taskType,
      promptSummary: plan.promptSummary || promptSummary,
      appLanguage,
      targetLanguage,
      speakingPlan: plan.speakingPlan,
      roundGoal: plan.roundGoal,
      round: 1,
      hintLevel: 'phrases'
    });
    const updated = updateSession(session.sessionId, { speakSessionId: session.sessionId });

    console.log('\n========== [prepareSpeak] FINAL RESPONSE ==========');
    console.log('  recommendedApproaches (normalized):');
    updated.recommendedApproaches?.forEach((a, i) => {
      console.log(`    [${i}] id=${a.id} label=${a.label}`);
    });
    console.log('  selectedApproach.id:', updated.selectedApproach?.id);
    console.log('  speakingPlan (top-level):');
    updated.speakingPlan?.forEach((item, i) => {
      console.log(`    [${i}] ${item.text}`);
    });
    console.log('  allApproachPlans:');
    updated.allApproachPlans?.forEach((p, i) => {
      console.log(`    [${i}] approachId=${p.approachId}`);
      p.speakingPlan?.forEach((item, j) => {
        console.log(`        item[${j}]: ${item.text}`);
      });
    });
    console.log('========== END ==========\n');

    res.json({
      speakSessionId: updated.sessionId,
      mode: updated.mode,
      followUpEnabled: updated.followUpEnabled,
      canonicalPrompt: updated.canonicalPrompt,
      examinerPromptText: updated.examinerPromptText,
      examinerPromptTranslation: updated.examinerPromptTranslation,
      examinerPromptAudio: updated.examinerPromptAudio,
      hintData: updated.hintData,
      initialMessages: updated.initialMessages,
      promptSummary: updated.promptSummary,
      promptSource: updated.promptSource,
      selectedPrompt: updated.selectedPrompt,
      recommendedApproaches: updated.recommendedApproaches,
      selectedApproach: updated.selectedApproach,
      allApproachPlans: updated.allApproachPlans,
      taskType: updated.taskType,
      speakingPlan: updated.speakingPlan,
      roundGoal: updated.roundGoal
    });
  } catch (error) {
    next(error);
  }
}

export async function submitSpeak(req, res, next) {
  try {
    const speakSessionId = req.body.speakSessionId || req.body.sessionId;
    const session = getSession(speakSessionId);
    const transcriptResult = req.body.transcript
      ? { transcript: req.body.transcript }
      : await transcribeAudio({
          audioBuffer: decodeBase64Payload(req.body.audioBase64),
          languageCode: req.body.targetLanguage || 'en-US'
        });
    const durationSec = req.body.durationSec || estimateDurationSecFromBase64(req.body.audioBase64);

    const attempt = createAttempt({
      sessionId: speakSessionId,
      round: req.body.round || 1,
      hintLevel: req.body.hintLevel || 'phrases',
      transcript: transcriptResult.transcript,
      durationSec
    });
    const history = Array.isArray(req.body.messageHistory)
      ? req.body.messageHistory
      : session?.conversationMessages || session?.initialMessages || [];
    const { conversationMessages: withUserMessage, userMessage } = mergeUserMessage({
      history,
      clientMessageId: req.body.clientMessageId,
      transcript: transcriptResult.transcript,
      durationSec,
      createdAt: req.body.createdAt
    });
    const userTurnCount = withUserMessage.filter((message) => message.role === 'user').length;
    const appLanguage = session?.appLanguage || req.body.appLanguage || 'zh-CN';
    const targetLanguage = session?.targetLanguage || req.body.targetLanguage || 'en';
    const examinerReplyMessage = await generateExaminerFollowUpMessage({
      promptSummary: session?.canonicalPrompt || session?.promptSummary || req.body.promptSummary || '',
      targetLanguage,
      appLanguage,
      speakingPlan: session?.speakingPlan || req.body.speakingPlan || [],
      conversationMessages: withUserMessage,
      lastUserTranscript: transcriptResult.transcript,
      userTurnCount
    });
    const examinerReplyText = examinerReplyMessage.text;
    const [examinerAudio, hintData] = await Promise.all([
      synthesizeText({
        text: examinerReplyText,
        language: targetLanguage
      }),
      generatePracticeHintData({
        targetLanguage,
        promptSummary: session?.canonicalPrompt || session?.promptSummary || req.body.promptSummary || '',
        examinerQuestion: examinerReplyText,
        lastUserTranscript: transcriptResult.transcript,
        speakingPlan: session?.speakingPlan || req.body.speakingPlan || [],
        conversationMessages: withUserMessage,
        userTurnCount
      })
    ]);
    const examinerMessage = {
      id: createId('examiner'),
      role: 'examiner',
      type: 'text',
      text: examinerReplyText,
      appLanguageTranslation: examinerReplyMessage.appLanguageTranslation || '',
      audioUrl: examinerAudio.audioUrl,
      createdAt: new Date().toISOString()
    };
    const conversationMessages = [...withUserMessage, examinerMessage];

    updateSession(speakSessionId, {
      conversationMessages,
      hintData,
      latestTurnAttempt: attempt,
      followUpEnabled: true
    });

    res.json({
      attemptId: attempt.attemptId,
      transcript: attempt.transcript,
      durationSec: attempt.durationSec,
      userMessage,
      examinerMessage,
      hintData,
      conversationMessages,
      canFinishPractice: userTurnCount > 0
    });
  } catch (error) {
    next(error);
  }
}

export async function takeTwo(req, res, next) {
  try {
    const speakSessionId = req.body.speakSessionId || req.body.sessionId;
    const session = getSession(speakSessionId);
    const nextRound = (req.body.previousRound || session?.round || 1) + 1;
    const hintLevel = req.body.recommendedHintLevel || session?.latestReview?.recommendedHintLevel || 'keywords';
    const take2Goal = session?.latestReview?.take2Goal || 'Add one concrete example.';

    updateSession(speakSessionId, {
      round: nextRound,
      hintLevel,
      take2Goal
    });

    res.json({
      speakSessionId,
      nextRound,
      hintLevel,
      take2Goal
    });
  } catch (error) {
    next(error);
  }
}
