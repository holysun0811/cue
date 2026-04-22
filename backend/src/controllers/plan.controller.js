import { buildSpeakingPlan } from '../services/gemini.service.js';
import { createSession } from '../services/session.service.js';

export async function buildPlan(req, res, next) {
  try {
    const plan = await buildSpeakingPlan(req.body);
    const session = createSession({
      taskType: plan.taskType,
      promptSummary: plan.promptSummary,
      appLanguage: plan.appLanguage,
      targetLanguage: plan.targetLanguage,
      speakingPlan: plan.speakingPlan,
      roundGoal: plan.roundGoal,
      round: 1,
      hintLevel: 'phrases'
    });

    res.json({
      ...plan,
      sessionId: session.sessionId
    });
  } catch (error) {
    next(error);
  }
}
