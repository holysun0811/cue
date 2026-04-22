import { transcribeAudio } from '../services/stt.service.js';
import { createAttempt } from '../services/session.service.js';
import { decodeBase64Payload, estimateDurationSecFromBase64 } from '../utils/media.js';

export async function submitPractice(req, res, next) {
  try {
    const transcriptResult = req.body.transcript
      ? { transcript: req.body.transcript }
      : await transcribeAudio({
          audioBuffer: decodeBase64Payload(req.body.audioBase64),
          languageCode: req.body.targetLanguage || 'en-US'
        });

    const attempt = createAttempt({
      sessionId: req.body.sessionId,
      round: req.body.round || 1,
      hintLevel: req.body.hintLevel || 'phrases',
      transcript: transcriptResult.transcript,
      durationSec: req.body.durationSec || estimateDurationSecFromBase64(req.body.audioBase64)
    });

    res.json({
      attemptId: attempt.attemptId,
      transcript: attempt.transcript,
      durationSec: attempt.durationSec
    });
  } catch (error) {
    next(error);
  }
}
