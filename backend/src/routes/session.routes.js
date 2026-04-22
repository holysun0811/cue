import { Router } from 'express';
import { takeTwo } from '../controllers/session.controller.js';

const router = Router();

router.post('/take2', takeTwo);

export default router;
