import { Router } from 'express';
import { buildPlan } from '../controllers/plan.controller.js';

const router = Router();

router.post('/build', buildPlan);

export default router;
