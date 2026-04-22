import { generateActionableReview } from '../services/gemini.service.js';
import { synthesizeText } from '../services/tts.service.js';
import { updateSession } from '../services/session.service.js';

export async function generateReview(req, res, next) {
  try {
    const review = await generateActionableReview(req.body);
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

    const sessionId = req.body.speakSessionId || req.body.sessionId;
    if (sessionId) {
      updateSession(sessionId, { latestReview: result });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}
