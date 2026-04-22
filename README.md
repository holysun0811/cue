## Cue V0.4

Cue helps students first understand what they want to say, then practice saying it well.

### Apps

- `frontend/`: Vite + React mobile-in-web app.
- `backend/`: Express API with Gemini, Google STT/TTS, and mock fallbacks.

### Run

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the frontend dev URL and keep `VITE_API_BASE_URL` pointed at `http://localhost:8787/api`.

### Mock Mode

Cue V0.4 runs without external credentials. Leave `GEMINI_API_KEY` and `GOOGLE_APPLICATION_CREDENTIALS` empty in `backend/.env`.

Mock mode keeps the full demo clickable:

- Learn start/message
- Bridge recap generation
- Speak preparation
- Practice submission
- Review generation
- Take 2
- Audio preview data URLs

### Real Credentials

Put real backend credentials in `backend/.env`:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3-flash-preview
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

Do not commit `.env` or service account files.

### Product Architecture

Visible modes:

- Learn
- Speak

Hidden transition:

- Bridge

Core flows:

```text
Home -> Learn -> Bridge -> Speak Prep -> Speak Practice -> Speak Review
Home -> Speak Prep -> Speak Practice -> Speak Review
```

Language concepts are separate:

- `uiLanguage`: app interface language.
- `sourceLanguage`: learner thinking/learning language.
- `targetLanguage`: speaking practice language.
