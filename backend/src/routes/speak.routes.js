import { Router } from 'express';
import { prepareSpeak, submitSpeak, takeTwo } from '../controllers/speak.controller.js';

const router = Router();

router.post('/prepare', prepareSpeak);
router.post('/submit', submitSpeak);
router.post('/take2', takeTwo);

export default router;
