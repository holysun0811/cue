const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

async function parseJsonResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function analyzeInput(payload) {
  const response = await fetch(`${API_BASE_URL}/input/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function startLearnSession(payload) {
  const response = await fetch(`${API_BASE_URL}/learn/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function sendLearnMessage(payload) {
  const response = await fetch(`${API_BASE_URL}/learn/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function generateBridge(payload) {
  const response = await fetch(`${API_BASE_URL}/bridge/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function prepareSpeak(payload) {
  const response = await fetch(`${API_BASE_URL}/speak/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function previewSampleAnswerAudio(payload) {
  const response = await fetch(`${API_BASE_URL}/audio/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function submitPractice(payload) {
  const response = await fetch(`${API_BASE_URL}/speak/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function generateReview(payload) {
  const response = await fetch(`${API_BASE_URL}/review/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function requestTake2(payload) {
  const response = await fetch(`${API_BASE_URL}/speak/take2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}
