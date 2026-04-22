import { createId } from '../utils/ids.js';

const sessions = new Map();
const attempts = new Map();
const learnSessions = new Map();
const bridges = new Map();

export function createSession(data) {
  const session = {
    sessionId: createId('sess'),
    round: 1,
    hintLevel: 'phrases',
    latestAttempt: null,
    latestReview: null,
    ...data
  };

  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}

export function updateSession(sessionId, patch) {
  const current = sessions.get(sessionId) || { sessionId };
  const next = { ...current, ...patch };
  sessions.set(sessionId, next);
  return next;
}

export function createAttempt(data) {
  const attempt = {
    attemptId: createId('att'),
    createdAt: new Date().toISOString(),
    ...data
  };

  attempts.set(attempt.attemptId, attempt);
  if (attempt.sessionId) {
    updateSession(attempt.sessionId, { latestAttempt: attempt });
  }

  return attempt;
}

export function getAttempt(attemptId) {
  return attempts.get(attemptId);
}

export function createLearnSession(data) {
  const learnSession = {
    learnSessionId: createId('learn'),
    chatHistory: [],
    collectedState: {
      keyFacts: [],
      viewpoints: [],
      targetTerms: [],
      possibleQuestionAngles: []
    },
    ...data
  };

  learnSessions.set(learnSession.learnSessionId, learnSession);
  return learnSession;
}

export function getLearnSession(learnSessionId) {
  return learnSessions.get(learnSessionId);
}

export function updateLearnSession(learnSessionId, patch) {
  const current = learnSessions.get(learnSessionId) || { learnSessionId };
  const next = {
    ...current,
    ...patch,
    collectedState: {
      ...(current.collectedState || {}),
      ...(patch.collectedState || {})
    }
  };
  learnSessions.set(learnSessionId, next);
  return next;
}

export function createBridge(data) {
  const bridge = {
    bridgeId: createId('bridge'),
    ...data
  };

  bridges.set(bridge.bridgeId, bridge);
  return bridge;
}

export function getBridge(bridgeId) {
  return bridges.get(bridgeId);
}
