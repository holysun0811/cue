import { Router } from 'express';
import { submitPractice } from '../controllers/practice.controller.js';

const router = Router();

router.post('/submit', submitPractice);

export default router;
