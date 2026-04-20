import { transcribeAudio } from '../services/stt.service.js';
import { createPreviewAudio, createSpeechAudio } from '../services/tts.service.js';

export async function previewOutline(req, res, next) {
  try {
    const audio = await createPreviewAudio(req.body);
    res.json(audio);
  } catch (error) {
    next(error);
  }
}

export async function synthesizePerfectSpeech(req, res, next) {
  try {
    const audio = await createSpeechAudio(req.body);
    res.json(audio);
  } catch (error) {
    next(error);
  }
}

export async function transcribeSpeech(req, res, next) {
  try {
    const transcript = await transcribeAudio({
      audioBuffer: req.file?.buffer,
      mimeType: req.file?.mimetype,
      languageCode: req.body.languageCode || 'en-US'
    });
    res.json(transcript);
  } catch (error) {
    next(error);
  }
}
