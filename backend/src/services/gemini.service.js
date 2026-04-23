import { mockBridge, mockExaminerFollowUp, mockExaminerPrompt, mockInputAnalysis, mockLearnMessage, mockLearnStart, mockPracticeHintData, mockReview, mockSampleAnswer, mockSpeakingPlan } from './mock.service.js';
import { renderPrompt } from '../prompts/_loader.js';

function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function generateJson(prompt) {
  if (!hasGeminiKey()) {
    return null;
  }

  // TODO: Replace with Vertex/AI Studio project-specific model config as needed.
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return extractJsonBlock(response.text || '{}');
}

function extractJsonBlock(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('Gemini did not return JSON.');
  }

  return JSON.parse(raw.slice(start, end + 1));
}

function formatConversation(conversationMessages = []) {
  return conversationMessages
    .map((message) => {
      const content = message.transcript || message.text || '';
      if (!content) return null;
      return `${message.role}: ${content}`;
    })
    .filter(Boolean)
    .join('\n');
}

/* ---------------------------------------------------------------------------
 * LEGACY — Not wired up in V0.4. Kept commented for reference only. The
 * corresponding prompts now live at:
 *   prompts/legacy/cue-cards/prompt.md
 *   prompts/legacy/rewrite-speech/prompt.md
 * If revived, build the params and call renderPrompt() the same way the
 * active functions below do — do NOT re-introduce inline template strings.
 * ---------------------------------------------------------------------------
 *
 * export async function* streamCueCards(payload = {}) {
 *   const apiKey = process.env.GEMINI_API_KEY;
 *   const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
 *
 *   if (!apiKey) {
 *     const mock = mockSpeakingPlan({
 *       promptSummary: payload.nativeThought,
 *       appLanguage: payload.locale || 'zh-CN',
 *       targetLanguage: 'en'
 *     });
 *
 *     yield { type: 'intent', payload: { intent: mock.promptSummary } };
 *     for (const section of mock.speakingPlan) {
 *       yield {
 *         type: 'card',
 *         payload: {
 *           id: section.id,
 *           frame: section.text,
 *           keyword: section.keyword,
 *           nativeLogic: section.supportText
 *         }
 *       };
 *     }
 *     return;
 *   }
 *
 *   const { GoogleGenAI } = await import('@google/genai');
 *   const ai = new GoogleGenAI({ apiKey });
 *   const prompt = renderPrompt('legacy/cue-cards/prompt.md', {
 *     locale: payload.locale || 'zh-CN',
 *     nativeThoughtOrFallback: payload.nativeThought || 'The user provided an image or a vague school speaking task.',
 *     imageHintLine: payload.imageHint ? `Image context: ${payload.imageHint}` : ''
 *   });
 *   const response = await ai.models.generateContentStream({
 *     model,
 *     contents: prompt,
 *     config: { responseMimeType: 'application/json' }
 *   });
 *
 *   let fullText = '';
 *   for await (const chunk of response) {
 *     fullText += chunk.text || '';
 *     yield { type: 'chunk', payload: { text: chunk.text || '' } };
 *   }
 *
 *   const parsed = extractJsonBlock(fullText);
 *   yield { type: 'intent', payload: { intent: parsed.intent || 'Speaking prep outline' } };
 *   for (const card of parsed.cards || []) {
 *     yield { type: 'card', payload: card };
 *   }
 * }
 *
 * export async function rewriteSpeech(payload = {}) {
 *   const apiKey = process.env.GEMINI_API_KEY;
 *   const transcript = payload.transcript;
 *
 *   if (!apiKey || !transcript) {
 *     const mock = mockReview({ transcript: transcript || '', targetLanguage: 'en' });
 *     return {
 *       scores: {
 *         fluency: mock.scores.fluency,
 *         vocabulary: mock.scores.vocabulary,
 *         pronunciation: mock.scores.pronunciation
 *       },
 *       original: transcript || '',
 *       perfect: mock.betterVersion.text,
 *       feedback: mock.take2Goal
 *     };
 *   }
 *
 *   const { GoogleGenAI } = await import('@google/genai');
 *   const ai = new GoogleGenAI({ apiKey });
 *   const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
 *   const prompt = renderPrompt('legacy/rewrite-speech/prompt.md', { transcript });
 *
 *   const response = await ai.models.generateContent({
 *     model,
 *     contents: prompt,
 *     config: { responseMimeType: 'application/json' }
 *   });
 *
 *   return extractJsonBlock(response.text || '{}');
 * }
 * ------------------------------------------------------------------------- */

export async function analyzePromptInput(payload = {}) {
  const { taskType = 'answer_prompt', appLanguage = 'zh-CN', targetLanguage = 'en', text = '', imageBase64, audioBase64 } = payload;

  if (!hasGeminiKey()) {
    return mockInputAnalysis({ taskType, appLanguage, targetLanguage, text, imageBase64, audioBase64 });
  }

  const prompt = renderPrompt('input/analyze/prompt.md', {
    taskType,
    appLanguage,
    targetLanguage,
    textOrNone: text || '(none)',
    imageHint: imageBase64 ? 'yes, OCR is not available in this environment, infer only if text mentions it' : 'no',
    audioHint: audioBase64 ? 'yes, transcript may be generated separately' : 'no'
  });

  try {
    return await generateJson(prompt);
  } catch {
    return mockInputAnalysis({ taskType, appLanguage, targetLanguage, text, imageBase64, audioBase64 });
  }
}

export async function buildSpeakingPlan(payload = {}) {
  const { taskType = 'answer_prompt', promptSummary = '', appLanguage = 'zh-CN', targetLanguage = 'en', userIntentNotes = '', answerApproach = null } = payload;

  if (!hasGeminiKey()) {
    return mockSpeakingPlan({ taskType, promptSummary, appLanguage, targetLanguage, answerApproach });
  }

  const prompt = renderPrompt('speak/plan/prompt.md', {
    taskType,
    promptSummary,
    appLanguage,
    targetLanguage,
    userIntentNotesOrNone: userIntentNotes || '(none)',
    answerApproachJson: answerApproach ? JSON.stringify(answerApproach) : '(choose the best default approach)'
  });

  try {
    const parsed = await generateJson(prompt);

    console.log('[buildSpeakingPlan] Gemini raw output:');
    console.log('  recommendedApproaches:', JSON.stringify(parsed.recommendedApproaches, null, 2));
    console.log('  selectedApproach:', JSON.stringify(parsed.selectedApproach));
    console.log('  speakingPlan (top-level):', JSON.stringify(parsed.speakingPlan?.map((i) => i.text)));
    console.log('  allApproachPlans count:', Array.isArray(parsed.allApproachPlans) ? parsed.allApproachPlans.length : 'NOT AN ARRAY');
    if (Array.isArray(parsed.allApproachPlans)) {
      parsed.allApproachPlans.forEach((p, i) => {
        console.log(`  allApproachPlans[${i}].approachId:`, p?.approachId);
        console.log(`  allApproachPlans[${i}].speakingPlan texts:`, JSON.stringify(p?.speakingPlan?.map((s) => s.text)));
      });
    }

    const mock = mockSpeakingPlan({ taskType, promptSummary, appLanguage, targetLanguage, answerApproach });
    const speakingPlan = Array.isArray(parsed.speakingPlan) && parsed.speakingPlan.length === 3 ? parsed.speakingPlan : mock.speakingPlan;
    const recommendedApproaches = Array.isArray(parsed.recommendedApproaches) && parsed.recommendedApproaches.length === 3
      ? parsed.recommendedApproaches.map((approach, index) => ({
          id: `approach_${index + 1}`,
          label: approach.label || mock.recommendedApproaches[index]?.label || '',
          summary: approach.summary || mock.recommendedApproaches[index]?.summary || ''
        }))
      : mock.recommendedApproaches;
    // Force approachId to match recommendedApproaches[i].id by POSITION. Never trust Gemini's own
    // approachId values — they're inconsistent and silently break client-side switching.
    const rawAllPlans = Array.isArray(parsed.allApproachPlans) && parsed.allApproachPlans.length === 3
      ? parsed.allApproachPlans
      : mock.allApproachPlans;
    const allApproachPlans = recommendedApproaches.map((approach, index) => {
      const rawPlan = rawAllPlans[index];
      const plan = Array.isArray(rawPlan?.speakingPlan) && rawPlan.speakingPlan.length === 3
        ? rawPlan.speakingPlan
        : mock.allApproachPlans[index]?.speakingPlan;
      return { approachId: approach.id, speakingPlan: plan };
    });

    // Align the top-level speakingPlan with the matching entry in allApproachPlans so that
    // re-selecting the initially-selected approach doesn't swap to a subtly different plan.
    // Also force selectedApproach.id to be one of approach_1/2/3 (Gemini sometimes outputs "balanced",
    // "custom", etc., which would break client-side matching against recommendedApproaches).
    let selectedIndex = 0;
    if (answerApproach?.id) {
      const foundIndex = recommendedApproaches.findIndex((a) => a.id === answerApproach.id);
      if (foundIndex >= 0) selectedIndex = foundIndex;
    } else if (parsed.selectedApproach?.label) {
      const foundIndex = recommendedApproaches.findIndex((a) => a.label === parsed.selectedApproach.label);
      if (foundIndex >= 0) selectedIndex = foundIndex;
    }
    const selectedApproach = answerApproach?.custom
      ? { ...answerApproach, id: answerApproach.id || 'custom' }
      : {
          id: recommendedApproaches[selectedIndex].id,
          label: recommendedApproaches[selectedIndex].label,
          summary: recommendedApproaches[selectedIndex].summary
        };
    const alignedSpeakingPlan = answerApproach?.custom
      ? speakingPlan
      : allApproachPlans[selectedIndex]?.speakingPlan || speakingPlan;

    return {
      ...mock,
      ...parsed,
      recommendedApproaches,
      selectedApproach,
      allApproachPlans,
      speakingPlan: alignedSpeakingPlan
    };
  } catch {
    return mockSpeakingPlan({ taskType, promptSummary, appLanguage, targetLanguage, answerApproach });
  }
}

export async function generateExaminerPrompt(payload = {}) {
  const { promptSummary = '', targetLanguage = 'en' } = payload;

  if (!hasGeminiKey()) {
    return mockExaminerPrompt({ promptSummary, targetLanguage });
  }

  const prompt = renderPrompt('speak/examiner-prompt/prompt.md', {
    promptSummary,
    targetLanguage
  });

  try {
    const parsed = await generateJson(prompt);
    return parsed.examinerPromptText || mockExaminerPrompt({ promptSummary, targetLanguage });
  } catch {
    return mockExaminerPrompt({ promptSummary, targetLanguage });
  }
}

export async function generateExaminerFollowUp(payload = {}) {
  const {
    promptSummary = '',
    targetLanguage = 'en',
    speakingPlan = [],
    conversationMessages = [],
    lastUserTranscript = '',
    userTurnCount = 1
  } = payload;

  if (!hasGeminiKey()) {
    return mockExaminerFollowUp({ targetLanguage, userTurnCount });
  }

  const conversation = formatConversation(conversationMessages);
  const prompt = renderPrompt('speak/examiner-followup/prompt.md', {
    promptSummary,
    targetLanguage,
    speakingPlanJson: JSON.stringify(speakingPlan),
    conversationOrPlaceholder: conversation || '(no visible conversation yet)',
    lastUserTranscriptOrPlaceholder: lastUserTranscript || '(empty or unclear answer)',
    userTurnCount
  });

  try {
    const parsed = await generateJson(prompt);
    return parsed.examinerReplyText || mockExaminerFollowUp({ targetLanguage, userTurnCount });
  } catch {
    return mockExaminerFollowUp({ targetLanguage, userTurnCount });
  }
}

function keywordAppearsInPhrases(keyword = '', phrases = []) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return false;
  return phrases.some((phrase) => phrase.toLowerCase().includes(normalizedKeyword));
}

function normalizePracticeHintData(rawHintData = {}, fallbackHintData) {
  const phrases = (rawHintData.phrases || [])
    .filter((phrase) => typeof phrase === 'string' && phrase.trim())
    .map((phrase) => phrase.trim())
    .slice(0, 2);
  const keywords = (rawHintData.keywords || [])
    .filter((keyword) => typeof keyword === 'string' && keyword.trim())
    .map((keyword) => keyword.trim())
    .filter((keyword) => keywordAppearsInPhrases(keyword, phrases))
    .slice(0, 4);

  if (!phrases.length || !keywords.length) return fallbackHintData;

  return {
    scale: {
      supportedLevels: ['none', 'keywords', 'outline', 'strong_support'],
      defaultLevel: 'strong_support'
    },
    phrases,
    keywords
  };
}

export async function generatePracticeHintData(payload = {}) {
  const {
    targetLanguage = 'en',
    promptSummary = '',
    examinerQuestion = '',
    lastUserTranscript = '',
    speakingPlan = [],
    conversationMessages = [],
    userTurnCount = 1
  } = payload;
  const fallback = mockPracticeHintData({ targetLanguage, userTurnCount });

  if (!hasGeminiKey()) {
    return fallback;
  }

  const conversation = formatConversation(conversationMessages);
  const prompt = renderPrompt('speak/practice-hint/prompt.md', {
    targetLanguage,
    promptSummary,
    examinerQuestion,
    lastUserTranscriptOrPlaceholder: lastUserTranscript || '(empty or unclear answer)',
    conversationOrPlaceholder: conversation || '(none)',
    speakingPlanJson: JSON.stringify(speakingPlan)
  });

  try {
    const parsed = await generateJson(prompt);
    return normalizePracticeHintData(parsed, fallback);
  } catch {
    return fallback;
  }
}

export async function generateSampleAnswer(payload = {}) {
  const {
    promptSummary = '',
    selectedPrompt = null,
    selectedApproach = null,
    speakingPlan = [],
    targetLanguage = 'en'
  } = payload;

  if (!hasGeminiKey()) {
    return mockSampleAnswer({ promptSummary, selectedPrompt, selectedApproach, speakingPlan, targetLanguage });
  }

  const prompt = renderPrompt('speak/sample-answer/prompt.md', {
    targetLanguage,
    selectedPromptText: selectedPrompt?.questionText || promptSummary,
    selectedApproachJson: JSON.stringify(selectedApproach || {}),
    speakingPlanJson: JSON.stringify(speakingPlan)
  });

  try {
    const parsed = await generateJson(prompt);
    return parsed.sampleAnswer || mockSampleAnswer({ promptSummary, selectedPrompt, selectedApproach, speakingPlan, targetLanguage });
  } catch {
    return mockSampleAnswer({ promptSummary, selectedPrompt, selectedApproach, speakingPlan, targetLanguage });
  }
}

export async function startLearnExploration(payload = {}) {
  const { topicOrMaterial = '', appLanguage = 'zh-CN', targetLanguage = 'en', persona = { type: 'guide' } } = payload;

  if (!hasGeminiKey()) {
    return mockLearnStart({ topicOrMaterial, appLanguage, targetLanguage, persona });
  }

  const prompt = renderPrompt('learn/start/prompt.md', {
    topicOrMaterial: topicOrMaterial || '(none)',
    appLanguage,
    targetLanguage,
    personaJson: JSON.stringify(persona)
  });

  try {
    const parsed = await generateJson(prompt);
    return {
      ...mockLearnStart({ topicOrMaterial, appLanguage, targetLanguage, persona }),
      ...parsed
    };
  } catch {
    return mockLearnStart({ topicOrMaterial, appLanguage, targetLanguage, persona });
  }
}

export async function continueLearnExploration(payload = {}) {
  const { session = {}, message = '', appLanguage = 'zh-CN', targetLanguage = 'en' } = payload;

  if (!hasGeminiKey()) {
    return mockLearnMessage({ session, message, appLanguage, targetLanguage });
  }

  const prompt = renderPrompt('learn/continue/prompt.md', {
    sessionJson: JSON.stringify(session),
    message,
    appLanguage,
    targetLanguage
  });

  try {
    const parsed = await generateJson(prompt);
    const mock = mockLearnMessage({ session, message, appLanguage, targetLanguage });
    return {
      ...mock,
      ...parsed,
      collectedState: {
        ...mock.collectedState,
        ...(parsed.collectedState || {})
      }
    };
  } catch {
    return mockLearnMessage({ session, message, appLanguage, targetLanguage });
  }
}

export async function generateBridgeRecap(payload = {}) {
  const { session = {}, appLanguage = 'zh-CN', targetLanguage = 'en' } = payload;

  if (!hasGeminiKey()) {
    return mockBridge({ session, appLanguage, targetLanguage });
  }

  const prompt = renderPrompt('bridge/recap/prompt.md', {
    sessionJson: JSON.stringify(session),
    appLanguage,
    targetLanguage
  });

  try {
    const parsed = await generateJson(prompt);
    const mock = mockBridge({ session, appLanguage, targetLanguage });
    return {
      ...mock,
      ...parsed,
      keyFacts: Array.isArray(parsed.keyFacts) && parsed.keyFacts.length === 3 ? parsed.keyFacts : mock.keyFacts,
      viewpoints: Array.isArray(parsed.viewpoints) && parsed.viewpoints.length === 2 ? parsed.viewpoints : mock.viewpoints,
      targetTerms: Array.isArray(parsed.targetTerms) && parsed.targetTerms.length === 3 ? parsed.targetTerms : mock.targetTerms,
      recommendedPrompts: Array.isArray(parsed.recommendedPrompts) && parsed.recommendedPrompts.length >= 2
        ? parsed.recommendedPrompts.slice(0, 3).map((prompt, index) => ({
            id: prompt.id || `prompt_${index + 1}`,
            angleLabel: prompt.angleLabel || mock.recommendedPrompts[index]?.angleLabel,
            questionText: prompt.questionText || mock.recommendedPrompts[index]?.questionText
          }))
        : mock.recommendedPrompts
    };
  } catch {
    return mockBridge({ session, appLanguage, targetLanguage });
  }
}

export async function generateActionableReview(payload = {}) {
  const {
    taskType = 'answer_prompt',
    promptSummary = '',
    appLanguage = 'zh-CN',
    targetLanguage = 'en',
    speakingPlan = [],
    transcript = '',
    conversationMessages = [],
    round = 1
  } = payload;
  const conversationText = formatConversation(conversationMessages);
  const reviewTranscript = transcript || conversationMessages
    .filter((message) => message.role === 'user')
    .map((message) => message.transcript || message.text || '')
    .filter(Boolean)
    .join('\n');

  if (!hasGeminiKey()) {
    return mockReview({ appLanguage, targetLanguage, transcript: reviewTranscript });
  }

  const prompt = renderPrompt('review/generate/prompt.md', {
    taskType,
    promptSummary,
    appLanguage,
    targetLanguage,
    round,
    speakingPlanJson: JSON.stringify(speakingPlan),
    conversationOrPlaceholder: conversationText || '(not provided)',
    reviewTranscript
  });

  try {
    const parsed = await generateJson(prompt);
    const mock = mockReview({ appLanguage, targetLanguage, transcript: reviewTranscript });
    const topIssues = Array.isArray(parsed.topIssues) && parsed.topIssues.length === 3 ? parsed.topIssues : mock.topIssues;
    return {
      ...mock,
      ...parsed,
      topIssues
    };
  } catch {
    return mockReview({ appLanguage, targetLanguage, transcript: reviewTranscript });
  }
}
