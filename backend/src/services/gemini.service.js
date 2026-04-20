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
    throw new Error('GEMINI_API_KEY is required for cue-card generation.');
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
    throw new Error('GEMINI_API_KEY is required for speech review.');
  }

  if (!transcript) {
    throw new Error('A transcript is required for speech review.');
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
