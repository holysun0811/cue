import { Router } from 'express';
import { createCueCardsStream, reviewSpeech } from '../controllers/ai.controller.js';

const router = Router();

router.post('/cue-cards/stream', createCueCardsStream);
router.post('/review', reviewSpeech);

export default router;
