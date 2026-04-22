import { generateActionableReview } from '../services/gemini.service.js';
import { synthesizeText } from '../services/tts.service.js';
import { getSession, updateSession } from '../services/session.service.js';

export async function generateReview(req, res, next) {
  try {
    const sessionId = req.body.speakSessionId || req.body.sessionId;
    const session = sessionId ? getSession(sessionId) : null;
    const conversationMessages = req.body.conversationMessages || session?.conversationMessages || [];
    const transcript = req.body.transcript || conversationMessages
      .filter((message) => message.role === 'user')
      .map((message) => message.transcript || message.text || '')
      .filter(Boolean)
      .join('\n');
    const review = await generateActionableReview({
      ...req.body,
      conversationMessages,
      transcript
    });
    const betterAudio = await synthesizeText({
      text: review.betterVersion.text,
      language: req.body.targetLanguage || 'en'
    });
    const topAudio = await synthesizeText({
      text: review.topVersion.text,
      language: req.body.targetLanguage || 'en'
    });

    const result = {
      ...review,
      betterVersion: {
        ...review.betterVersion,
        audioUrl: betterAudio.audioUrl
      },
      topVersion: {
        ...review.topVersion,
        audioUrl: topAudio.audioUrl
      }
    };

    if (sessionId) {
      updateSession(sessionId, { latestReview: result });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}
