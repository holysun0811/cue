import { generateBridgeRecap } from '../services/gemini.service.js';
import { createBridge, getLearnSession } from '../services/session.service.js';

export async function generateBridge(req, res, next) {
  try {
    const session = getLearnSession(req.body.learnSessionId);
    if (!session) {
      res.status(404).json({ error: 'Learn session not found.' });
      return;
    }

    const recap = await generateBridgeRecap({
      session,
      appLanguage: req.body.appLanguage || session.appLanguage,
      targetLanguage: req.body.targetLanguage || session.targetLanguage
    });
    const bridge = createBridge({
      learnSessionId: session.learnSessionId,
      appLanguage: req.body.appLanguage || session.appLanguage,
      targetLanguage: req.body.targetLanguage || session.targetLanguage,
      ...recap
    });

    res.json(bridge);
  } catch (error) {
    next(error);
  }
}
