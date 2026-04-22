## Cue Backend

Express API for Cue V0.4: Learn, Bridge, Speak, Review, and audio preview.

### Run

```bash
cp .env.example .env
npm install
npm run dev
```

The frontend defaults to `http://localhost:8787/api`.

### Mock Mode

Cue is demo-safe without external credentials. Leave these empty in `.env`:

```env
GEMINI_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
```

When credentials are missing:

- Learn start/message returns deterministic structured mock exploration.
- Bridge returns exactly 3 facts, 2 viewpoints, 3 terms, 1 speaking angle, and 1 question.
- Speak prepare returns a 3-part plan.
- Submit uses mock STT when needed.
- Review returns 3 actionable fixes, Better/Top versions, scores, and Take 2 guidance.
- Audio preview/review audio returns local data URLs.

### Real APIs

Put real credentials in `backend/.env`:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3-flash-preview
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

Never commit `.env` or service account JSON files.

### V0.4 Endpoints

- `POST /api/input/analyze`
- `POST /api/learn/start`
- `POST /api/learn/message`
- `POST /api/bridge/generate`
- `POST /api/speak/prepare`
- `POST /api/audio/preview`
- `POST /api/speak/submit`
- `POST /api/review/generate`
- `POST /api/speak/take2`

Older V2 route wrappers are still present during the incremental refactor, but new frontend code uses the V0.4 contracts above.
