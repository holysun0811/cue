const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

async function parseJsonResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function streamCueCards(payload, handlers) {
  const response = await fetch(`${API_BASE_URL}/ai/cue-cards/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok || !response.body) {
    throw new Error(`Cue stream failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const rawEvent of events) {
      const lines = rawEvent.split('\n');
      const eventName = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
      const dataLine = lines.find((line) => line.startsWith('data:'))?.replace('data:', '').trim();

      if (!eventName || !dataLine) continue;

      const payloadData = JSON.parse(dataLine);
      handlers?.onEvent?.(eventName, payloadData);
    }
  }
}

export async function requestPreviewAudio(payload) {
  const response = await fetch(`${API_BASE_URL}/voice/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function requestPerfectAudio(payload) {
  const response = await fetch(`${API_BASE_URL}/voice/perfect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function requestReview(payload) {
  const response = await fetch(`${API_BASE_URL}/ai/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response);
}

export async function requestTranscription(audioBlob) {
  const formData = new FormData();
  if (audioBlob) {
    formData.append('audio', audioBlob, 'answer.webm');
  }
  formData.append('languageCode', 'en-US');

  const response = await fetch(`${API_BASE_URL}/voice/stt`, {
    method: 'POST',
    body: formData
  });

  return parseJsonResponse(response);
}
