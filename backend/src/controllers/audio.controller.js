import { synthesizeText } from '../services/tts.service.js';
import { generateSampleAnswer } from '../services/gemini.service.js';

export async function previewSampleAnswerAudio(req, res, next) {
  try {
    const targetLanguage = req.body.targetLanguage || 'en';
    const transcript = await generateSampleAnswer({
      promptSummary: req.body.promptSummary,
      selectedPrompt: req.body.selectedPrompt,
      selectedApproach: req.body.selectedApproach,
      speakingPlan: req.body.speakingPlan,
      targetLanguage
    });
    const audio = await synthesizeText({
      text: transcript,
      language: targetLanguage
    });

    res.json({
      audioUrl: audio.audioUrl,
      transcript,
      mode: 'demo_answer'
    });
  } catch (error) {
    next(error);
  }
}
