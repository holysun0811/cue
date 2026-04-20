import { Router } from 'express';
import multer from 'multer';
import { previewOutline, synthesizePerfectSpeech, transcribeSpeech } from '../controllers/voice.controller.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/preview', previewOutline);
router.post('/perfect', synthesizePerfectSpeech);
router.post('/stt', upload.single('audio'), transcribeSpeech);

export default router;
