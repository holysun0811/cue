import { Router } from 'express';
import { continueLearn, startLearn } from '../controllers/learn.controller.js';

const router = Router();

router.post('/start', startLearn);
router.post('/message', continueLearn);

export default router;
