import { getSession, updateSession } from '../services/session.service.js';

export async function takeTwo(req, res, next) {
  try {
    const session = getSession(req.body.sessionId);
    const nextRound = (req.body.previousRound || session?.round || 1) + 1;
    const hintLevel = req.body.recommendedHintLevel || session?.latestReview?.recommendedHintLevel || 'keywords';
    const take2Goal = session?.latestReview?.take2Goal || 'Make one fix from the review.';

    updateSession(req.body.sessionId, {
      round: nextRound,
      hintLevel,
      take2Goal
    });

    res.json({
      sessionId: req.body.sessionId,
      nextRound,
      hintLevel,
      take2Goal
    });
  } catch (error) {
    next(error);
  }
}
