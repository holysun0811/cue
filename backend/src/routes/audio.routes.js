import { Router } from 'express';
import { previewSampleAnswerAudio } from '../controllers/audio.controller.js';

const router = Router();

router.post('/preview', previewSampleAnswerAudio);

export default router;
