import { continueLearnExploration, startLearnExploration } from '../services/gemini.service.js';
import { createLearnSession, getLearnSession, updateLearnSession } from '../services/session.service.js';

export async function startLearn(req, res, next) {
  try {
    const result = await startLearnExploration(req.body);
    const session = createLearnSession({
      topicOrMaterial: req.body.topicOrMaterial,
      title: result.title,
      appLanguage: req.body.appLanguage,
      targetLanguage: req.body.targetLanguage,
      persona: result.persona || req.body.persona,
      chatHistory: [{ role: 'assistant', content: result.openingMessage }],
      collectedState: result.collectedState
    });

    res.json({
      learnSessionId: session.learnSessionId,
      title: session.title,
      openingMessage: result.openingMessage,
      suggestedQuestions: result.suggestedQuestions || [],
      persona: session.persona,
      collectedState: session.collectedState
    });
  } catch (error) {
    next(error);
  }
}

export async function continueLearn(req, res, next) {
  try {
    const session = getLearnSession(req.body.learnSessionId);
    if (!session) {
      res.status(404).json({ error: 'Learn session not found.' });
      return;
    }

    const result = await continueLearnExploration({
      session,
      message: req.body.message,
      appLanguage: req.body.appLanguage || session.appLanguage,
      targetLanguage: req.body.targetLanguage || session.targetLanguage
    });

    updateLearnSession(session.learnSessionId, {
      chatHistory: [
        ...(session.chatHistory || []),
        { role: 'user', content: req.body.message },
        { role: 'assistant', content: result.assistantMessage }
      ],
      collectedState: result.collectedState
    });

    res.json({
      assistantMessage: result.assistantMessage,
      collectedState: result.collectedState,
      canBridge: Boolean(result.canBridge)
    });
  } catch (error) {
    next(error);
  }
}
