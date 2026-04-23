import { Router } from 'express';

// LEGACY — V0.4 no longer exposes /api/ai/cue-cards/stream or /api/ai/review.
// See controllers/ai.controller.js for the disabled handlers and the matching
// commented-out service functions in services/gemini.service.js.
//
// import { createCueCardsStream, reviewSpeech } from '../controllers/ai.controller.js';

const router = Router();

// router.post('/cue-cards/stream', createCueCardsStream);
// router.post('/review', reviewSpeech);

export default router;
