import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import aiRoutes from './routes/ai.routes.js';
import audioRoutes from './routes/audio.routes.js';
import bridgeRoutes from './routes/bridge.routes.js';
import inputRoutes from './routes/input.routes.js';
import learnRoutes from './routes/learn.routes.js';
import planRoutes from './routes/plan.routes.js';
import practiceRoutes from './routes/practice.routes.js';
import reviewRoutes from './routes/review.routes.js';
import sessionRoutes from './routes/session.routes.js';
import speakRoutes from './routes/speak.routes.js';
import voiceRoutes from './routes/voice.routes.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'cue-backend' });
});

app.use('/api/ai', aiRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/input', inputRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/bridge', bridgeRoutes);
app.use('/api/speak', speakRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/session', sessionRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'production' ? undefined : error.message
  });
});

export default app;
