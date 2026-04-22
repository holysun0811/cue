import { analyzePromptInput } from '../services/gemini.service.js';
import { transcribeAudio } from '../services/stt.service.js';
import { decodeBase64Payload } from '../utils/media.js';

export async function analyzeInput(req, res, next) {
  try {
    const audioTranscript = req.body.audioBase64
      ? await transcribeAudio({
          audioBuffer: decodeBase64Payload(req.body.audioBase64),
          languageCode: req.body.appLanguage || 'en-US'
        })
      : null;

    const result = await analyzePromptInput({
      ...req.body,
      text: [req.body.text, audioTranscript?.transcript].filter(Boolean).join('\n')
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
