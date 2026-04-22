import { Router } from 'express';
import { generateBridge } from '../controllers/bridge.controller.js';

const router = Router();

router.post('/generate', generateBridge);

export default router;
