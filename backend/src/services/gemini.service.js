import { mockBridge, mockExaminerFollowUp, mockExaminerPrompt, mockInputAnalysis, mockLearnMessage, mockLearnStart, mockPracticeHintData, mockReview, mockSampleAnswer, mockSpeakingPlan } from './mock.service.js';

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

function buildCuePrompt({ nativeThought, imageHint, locale }) {
  return `
You are Cue, an AI-native English speaking prep coach for European high school students.
The student's native locale is ${locale || 'zh-CN'} and the target language is English.

Input:
${nativeThought || 'The user provided an image or a vague school speaking task.'}
${imageHint ? `Image context: ${imageHint}` : ''}

Return strict JSON:
{
  "intent": "Write an actual one-sentence English summary of the student's speaking intent here",
  "cards": [
    {
      "id": "short-id",
      "frame": "Logical half-sentence frame in English",
      "keyword": "advanced English keyword",
      "nativeLogic": "brief logic explanation in the student's native language"
    }
  ]
}

Rules:
- Generate 3 to 5 cue cards.
- The intent field must be a real summary of the user's input, not the schema label.
- Frames must be speakable sentence starters, not full essays.
- Keywords should sound advanced but usable in school presentations.
`;
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

export async function* streamCueCards(payload = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  if (!apiKey) {
    const mock = mockSpeakingPlan({
      promptSummary: payload.nativeThought,
      appLanguage: payload.locale || 'zh-CN',
      targetLanguage: 'en'
    });

    yield {
      type: 'intent',
      payload: { intent: mock.promptSummary }
    };

    for (const section of mock.speakingPlan) {
      yield {
        type: 'card',
        payload: {
          id: section.id,
          frame: section.text,
          keyword: section.keyword,
          nativeLogic: section.supportText
        }
      };
    }
    return;
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildCuePrompt(payload);
  const response = await ai.models.generateContentStream({
    model,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  let fullText = '';
  for await (const chunk of response) {
    fullText += chunk.text || '';
    yield {
      type: 'chunk',
      payload: { text: chunk.text || '' }
    };
  }

  const parsed = extractJsonBlock(fullText);
  yield {
    type: 'intent',
    payload: { intent: parsed.intent || 'Speaking prep outline' }
  };

  for (const card of parsed.cards || []) {
    yield { type: 'card', payload: card };
  }
}

export async function rewriteSpeech(payload = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const transcript = payload.transcript;

  if (!apiKey) {
    const mock = mockReview({ transcript, targetLanguage: 'en' });
    return {
      scores: {
        fluency: mock.scores.fluency,
        vocabulary: mock.scores.vocabulary,
        pronunciation: mock.scores.pronunciation
      },
      original: transcript || '',
      perfect: mock.betterVersion.text,
      feedback: mock.take2Goal
    };
  }

  if (!transcript) {
    const mock = mockReview({ transcript: '', targetLanguage: 'en' });
    return {
      scores: {
        fluency: mock.scores.fluency,
        vocabulary: mock.scores.vocabulary,
        pronunciation: mock.scores.pronunciation
      },
      original: '',
      perfect: mock.betterVersion.text,
      feedback: mock.take2Goal
    };
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
  const prompt = `
Rewrite this student's spoken English into a natural, native-level version while preserving their exact ideas.
Also score fluency, vocabulary, and pronunciation from 0-100.

Transcript:
${transcript}

Return strict JSON:
{
  "scores": { "fluency": 0, "vocabulary": 0, "pronunciation": 0 },
  "original": "student text",
  "perfect": "native-level spoken version",
  "feedback": "one encouraging coaching sentence"
}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  const parsed = extractJsonBlock(response.text || '{}');
  return parsed;
}

export async function analyzePromptInput(payload = {}) {
  const { taskType = 'answer_prompt', appLanguage = 'zh-CN', targetLanguage = 'en', text = '', imageBase64, audioBase64 } = payload;

  if (!hasGeminiKey()) {
    return mockInputAnalysis({ taskType, appLanguage, targetLanguage, text, imageBase64, audioBase64 });
  }

  const prompt = `
You are Cue, a school oral-task rehearsal coach.
Normalize the user input into a concise task-ready prompt summary.

Task type: ${taskType}
App language: ${appLanguage}
Target language: ${targetLanguage}
Text input: ${text || '(none)'}
Image provided: ${imageBase64 ? 'yes, OCR is not available in this environment, infer only if text mentions it' : 'no'}
Audio provided: ${audioBase64 ? 'yes, transcript may be generated separately' : 'no'}

Return strict JSON:
{
  "promptSummary": "one concise practice prompt summary in targetLanguage",
  "detectedAppLanguage": "${appLanguage}",
  "extractedText": "normalized extracted text",
  "suggestedTaskType": "${taskType}"
}

Rules:
- Keep promptSummary short.
- Do not invent complex context.
- promptSummary should use targetLanguage because it may become the practice prompt.
- extractedText may preserve the user's material language when it is raw source material.
`;

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

  const prompt = `
You are Cue, a mobile-first AI rehearsal coach for school oral tasks.
Build a concise 3-part speaking plan for EACH of the 3 recommended approaches. Optimize for speakability, not essay quality.

Task type: ${taskType}
Prompt summary: ${promptSummary}
App language: ${appLanguage}
Target language: ${targetLanguage}
User intent notes: ${userIntentNotes || '(none)'}
Selected answer approach: ${answerApproach ? JSON.stringify(answerApproach) : '(choose the best default approach)'}

Return strict JSON:
{
  "taskType": "${taskType}",
  "promptSummary": "${promptSummary}",
  "appLanguage": "${appLanguage}",
  "targetLanguage": "${targetLanguage}",
  "recommendedApproaches": [
    { "id": "approach_1", "label": "short label", "summary": "one concise app-language explanation" },
    { "id": "approach_2", "label": "short label", "summary": "one concise app-language explanation" },
    { "id": "approach_3", "label": "short label", "summary": "one concise app-language explanation" }
  ],
  "selectedApproach": { "id": "approach_1", "label": "short label", "summary": "one concise app-language explanation" },
  "allApproachPlans": [
    {
      "approachId": "approach_1",
      "speakingPlan": [
        { "id": "opening", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
        { "id": "point_1", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
        { "id": "point_2_or_conclusion", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" }
      ]
    },
    {
      "approachId": "approach_2",
      "speakingPlan": [
        { "id": "opening", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
        { "id": "point_1", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
        { "id": "point_2_or_conclusion", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" }
      ]
    },
    {
      "approachId": "approach_3",
      "speakingPlan": [
        { "id": "opening", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
        { "id": "point_1", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
        { "id": "point_2_or_conclusion", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" }
      ]
    }
  ],
  "speakingPlan": [
    { "id": "opening", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
    { "id": "point_1", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
    { "id": "point_2_or_conclusion", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" }
  ],
  "roundGoal": "short target-language goal for this round"
}

Rules:
- Output exactly 3 speakingPlan items with the exact ids above (opening, point_1, point_2_or_conclusion).
- Output exactly 3 recommendedApproaches with ids approach_1, approach_2, approach_3.
- Output exactly 3 allApproachPlans entries, one per recommendedApproach id, each with 3 speakingPlan items.
- Each approach plan must clearly follow that approach's reasoning path (they must differ from each other).
- The selectedApproach must match the requested answerApproach when provided, otherwise use approach_1.
- The top-level speakingPlan must match the selectedApproach's plan in allApproachPlans.
- Each text must be one speakable line, not a paragraph.
- Avoid over-complex wording.
- speakingPlan text, keyword, supportText, and roundGoal must use targetLanguage because they are practice-layer content.
- recommendedApproaches and selectedApproach label/summary must use appLanguage because they explain how to answer.
- targetLanguage is not always English.
`;

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

  const prompt = `
You are a calm school speaking examiner.
Turn the canonical prompt below into one natural spoken examiner question.

Canonical prompt:
${promptSummary}

Practice language:
${targetLanguage}

Return strict JSON:
{
  "examinerPromptText": "one natural examiner message in the practice language"
}

Rules:
- Use the practice language only.
- Keep the original task requirement.
- Sound like a real examiner or teacher, not a mechanical prompt reader.
- Keep it concise enough to be spoken aloud.
`;

  try {
    const parsed = await generateJson(prompt);
    return parsed.examinerPromptText || mockExaminerPrompt({ promptSummary, targetLanguage });
  } catch {
    return mockExaminerPrompt({ promptSummary, targetLanguage });
  }
}

function buildExaminerFollowUpPrompt({
  promptSummary = '',
  targetLanguage = 'en',
  speakingPlan = [],
  conversationMessages = [],
  lastUserTranscript = '',
  userTurnCount = 1
}) {
  const conversation = conversationMessages
    .map((message) => {
      const content = message.transcript || message.text || '';
      if (!content) return null;
      return `${message.role}: ${content}`;
    })
    .filter(Boolean)
    .join('\n');

  return `
You are a spoken-language examiner / teacher.
You are conducting a realistic oral practice conversation.
Your job is to keep the learner speaking in the target language.

Original practice prompt:
${promptSummary}

Practice language:
${targetLanguage}

Speaking plan for context only:
${JSON.stringify(speakingPlan)}

Conversation so far:
${conversation || '(no visible conversation yet)'}

Learner's latest answer:
${lastUserTranscript || '(empty or unclear answer)'}

User answer count so far: ${userTurnCount}

Return strict JSON:
{
  "examinerReplyText": "one natural spoken follow-up question in the practice language"
}

Rules:
- Always reply in the practice language / target language.
- Sound like a real oral examiner or teacher.
- Keep it natural, concise, and spoken.
- Ask only one question at a time.
- Do not give long explanations.
- Do not provide the full answer directly.
- Do not give review feedback during the practice chat.
- Do not repeat the original prompt verbatim.
- Do not end the practice automatically; the learner decides when to finish.
- Do not produce visible labels, bullets, numbered lists, or JSON-like language inside examinerReplyText.
- If the latest answer is weak or very short, ask a simpler follow-up.
- If the latest answer is already relevant, ask a deeper follow-up.
- Choose one useful move: ask for an example, clarification, another point of view, cause/effect, consequence, future impact, or comparison.
- If the learner has already made several relevant points, you may ask a light wrap-up question, but do not force the session to end.
`;
}

export async function generateExaminerFollowUp(payload = {}) {
  const { targetLanguage = 'en', userTurnCount = 1 } = payload;

  if (!hasGeminiKey()) {
    return mockExaminerFollowUp({ targetLanguage, userTurnCount });
  }

  try {
    const parsed = await generateJson(buildExaminerFollowUpPrompt(payload));
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

function buildPracticeHintPrompt({
  targetLanguage = 'en',
  promptSummary = '',
  examinerQuestion = '',
  lastUserTranscript = '',
  speakingPlan = [],
  conversationMessages = []
}) {
  const conversation = conversationMessages
    .map((message) => {
      const content = message.transcript || message.text || '';
      if (!content) return null;
      return `${message.role}: ${content}`;
    })
    .filter(Boolean)
    .join('\n');

  return `
You are Cue's speaking hint generator for a mobile oral-practice chat.
The learner has just received a new examiner follow-up question. Generate a tiny phrase hint for the learner's NEXT answer.

Practice language:
${targetLanguage}

Original prompt:
${promptSummary}

New examiner question:
${examinerQuestion}

Learner's previous answer:
${lastUserTranscript || '(empty or unclear answer)'}

Conversation context:
${conversation || '(none)'}

Speaking plan for context only:
${JSON.stringify(speakingPlan)}

Return strict JSON:
{
  "phrases": ["one short phrase/sentence the learner can borrow", "optional second short phrase/sentence"],
  "keywords": ["keyword or key phrase 1", "keyword or key phrase 2"]
}

Rules:
- Use the practice language only.
- Generate 1 or 2 short, speakable phrases. Do not generate an outline or explanation.
- Each phrase should help answer the NEW examiner question, not the previous prompt verbatim.
- Generate 2 to 4 keywords/key phrases.
- Every keyword must appear verbatim inside at least one phrase so the UI can highlight it.
- Keep highlighting targets meaningful: concepts, noun phrases, or reusable spoken expressions.
- Do not highlight entire sentences.
- Do not output labels, bullets, translations, or app-language coaching.
`;
}

export async function generatePracticeHintData(payload = {}) {
  const { targetLanguage = 'en', userTurnCount = 1 } = payload;
  const fallback = mockPracticeHintData({ targetLanguage, userTurnCount });

  if (!hasGeminiKey()) {
    return fallback;
  }

  try {
    const parsed = await generateJson(buildPracticeHintPrompt(payload));
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

  const prompt = `
You are Cue. Generate a natural spoken sample answer for a student to imitate.

Target language: ${targetLanguage}
Selected practice prompt:
${selectedPrompt?.questionText || promptSummary}

Selected answer approach:
${JSON.stringify(selectedApproach || {})}

Speaking plan for structure only:
${JSON.stringify(speakingPlan)}

Return strict JSON:
{
  "sampleAnswer": "one natural spoken answer in the target language"
}

Rules:
- The sampleAnswer must be entirely in ${targetLanguage}.
- Do NOT read or concatenate the UI cards.
- Use the speaking plan only as structure, not as exact text to copy.
- Make it sound like a real student oral answer.
- Keep it concise: about 45-75 words for English, equivalent length for other languages.
- Use short subtitle-friendly sentences. Prefer 5-9 words per sentence.
- Avoid long clauses joined by many commas, semicolons, or "and".
- Do not include labels, bullet points, explanations, translations, or app-language coaching.
`;

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

  const prompt = `
You are Cue in Learn mode. Help a student understand a topic before speaking.

Topic or material:
${topicOrMaterial || '(none)'}

App language: ${appLanguage}
Target language: ${targetLanguage}
Persona: ${JSON.stringify(persona)}

Return strict JSON:
{
  "title": "short topic title",
  "openingMessage": "focused opening message for the learner",
  "suggestedQuestions": ["question 1", "question 2", "question 3"],
  "persona": { "type": "character|expert|guide|none", "name": "name or empty" },
  "collectedState": {
    "keyFacts": ["fact 1", "fact 2"],
    "viewpoints": ["viewpoint 1"],
    "targetTerms": ["term 1", "term 2", "term 3"],
    "possibleQuestionAngles": ["angle 1"]
  }
}

Rules:
- Learn is interest-led but structured.
- Do not behave like unrestricted chat.
- Collect facts, viewpoints, target-language terms, and speaking angles.
- openingMessage, suggestedQuestions, keyFacts, viewpoints, and possibleQuestionAngles must use appLanguage.
- targetTerms should use targetLanguage because they are expression vocabulary.
- Do not make default bilingual mixed blocks.
- Do not over-coach speaking in Learn; Bridge/Speak handle rehearsal later.
`;

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

  const prompt = `
You are Cue in Learn mode. Continue a focused learning session.

Current session:
${JSON.stringify(session)}

Student message:
${message}

App language: ${appLanguage}
Target language: ${targetLanguage}

Return strict JSON:
{
  "assistantMessage": "helpful focused reply",
  "collectedState": {
    "keyFacts": ["..."],
    "viewpoints": ["..."],
    "targetTerms": ["..."],
    "possibleQuestionAngles": ["..."]
  },
  "canBridge": true
}

Rules:
- Stay on the topic.
- Help understanding and viewpoint formation.
- assistantMessage, keyFacts, viewpoints, and possibleQuestionAngles must use appLanguage.
- targetTerms should use targetLanguage because they are expression vocabulary.
- Update structured collectedState.
- Do not produce long essays.
- Do not make default bilingual mixed blocks.
- Do not turn every reply into speaking coaching.
`;

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

  const prompt = `
You are Cue Bridge. Convert a Learn session into a concise speaking-ready recap.

Learn session:
${JSON.stringify(session)}

App language: ${appLanguage}
Target language: ${targetLanguage}

Return strict JSON:
{
  "topicTitle": "...",
  "summary": "...",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "viewpoints": ["viewpoint 1", "viewpoint 2"],
  "targetTerms": ["term 1", "term 2", "term 3"],
  "speakingAngle": "...",
  "practiceQuestion": "...",
  "recommendedPrompts": [
    { "id": "prompt_1", "angleLabel": "...", "questionText": "..." },
    { "id": "prompt_2", "angleLabel": "...", "questionText": "..." },
    { "id": "prompt_3", "angleLabel": "...", "questionText": "..." }
  ]
}

Rules:
- Exactly 3 keyFacts.
- Exactly 2 viewpoints.
- Exactly 3 targetTerms.
- Exactly 1 speakingAngle.
- Exactly 1 practiceQuestion.
- Exactly 2 or 3 recommendedPrompts.
- Each recommended prompt must have a short angleLabel and one concise oral-practice question.
- topicTitle, summary, keyFacts, viewpoints, speakingAngle, and recommendation labels must use appLanguage.
- targetTerms must use targetLanguage.
- practiceQuestion and recommendedPrompts.questionText must use targetLanguage because they are practice prompts.
- The prompts must be derived from the Learn session and should offer different angles, not repeat the same question.
- Optimize for speaking, not long notes.
`;

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
  const conversationText = conversationMessages
    .map((message) => {
      const content = message.transcript || message.text || '';
      if (!content) return null;
      return `${message.role}: ${content}`;
    })
    .filter(Boolean)
    .join('\n');
  const reviewTranscript = transcript || conversationMessages
    .filter((message) => message.role === 'user')
    .map((message) => message.transcript || message.text || '')
    .filter(Boolean)
    .join('\n');

  if (!hasGeminiKey()) {
    return mockReview({ appLanguage, targetLanguage, transcript: reviewTranscript });
  }

  const prompt = `
You are Cue, a school oral-task rehearsal coach.
Review this practice attempt. Be concise and actionable.

Task type: ${taskType}
Prompt summary: ${promptSummary}
App language: ${appLanguage}
Target language: ${targetLanguage}
Round: ${round}
Speaking plan: ${JSON.stringify(speakingPlan)}
Full practice conversation:
${conversationText || '(not provided)'}

Learner answers transcript:
${reviewTranscript}

Return strict JSON:
{
  "summary": "one short overall summary",
  "topIssues": [
    "action fix 1",
    "action fix 2",
    "action fix 3"
  ],
  "betterVersion": { "text": "short version close to learner level" },
  "topVersion": { "text": "more advanced but still speakable version" },
  "scores": { "fluency": 0, "vocabulary": 0, "pronunciation": 0, "structure": 0 },
  "take2Goal": "one concrete next-round goal",
  "recommendedHintLevel": "outline|phrases|keywords|off"
}

Rules:
- topIssues must contain exactly 3 action-oriented fixes.
- summary, topIssues, take2Goal, and explanatory feedback must use appLanguage.
- betterVersion.text and topVersion.text must use targetLanguage because the student imitates them.
- Better Version should be short enough to imitate.
- Top Version is secondary, not absurdly advanced.
- Avoid vague praise dumps.
`;

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
