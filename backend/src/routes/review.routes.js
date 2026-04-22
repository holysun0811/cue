import { Router } from 'express';
import { generateReview } from '../controllers/review.controller.js';

const router = Router();

router.post('/generate', generateReview);

export default router;
