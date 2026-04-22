import { Router } from 'express';
import { analyzeInput } from '../controllers/input.controller.js';

const router = Router();

router.post('/analyze', analyzeInput);

export default router;
