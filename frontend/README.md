## Cue Frontend

Vite + React mobile-in-web app for Cue V0.4.

### Run

```bash
cp .env.example .env
npm install
npm run dev
```

The frontend expects the backend at `VITE_API_BASE_URL`, defaulting to `http://localhost:8787/api`.

### V0.4 Flow

Cue now has two visible modes:

1. Learn: explore a topic, material, idea, or character with structured accumulation.
2. Speak: prepare, practice, review, and Take 2.

Bridge is hidden inside the Learn flow:

```text
Home -> Learn -> Bridge -> Speak Prep -> Speak Practice -> Speak Review
Home -> Speak Prep -> Speak Practice -> Speak Review
```

### Language Model

The app keeps two language concepts:

- App language (`uiLanguage` in frontend settings, sent to APIs as `appLanguage`): UI, guidance, explanations, recaps, answer approaches, and review feedback.
- Practice language (`targetLanguage`): practice prompts, speaking plans, cue content, sample answers, subtitles/audio, and answer versions the learner imitates.

### Mock Mode

The frontend calls the backend V0.4 contracts. If backend credentials are missing, the backend returns mock data, so the full demo still runs without real Gemini, STT, TTS, or OCR setup.
