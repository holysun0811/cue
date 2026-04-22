# Architecture

Short implementation map for new Codex sessions.

## Frontend

- Stack: Vite, React 19, React Router 7, Tailwind CSS, Framer Motion, i18next/react-i18next, lucide-react.
- Entry: `frontend/src/main.jsx` renders `App` inside the router.
- App state lives mostly in `frontend/src/App.jsx`: settings, Learn session, Bridge data, Speak session, busy/error flags, and global loading overlay state.
- Route-to-step mapping is manual in `App.jsx`:
  - `/` -> Home
  - `/settings` -> Settings
  - `/learn` and `/learn/:id` -> Learn
  - `/bridge` -> Bridge
  - `/speak/prep` -> Prep
  - `/speak/practice` -> Practice
  - `/speak/review` -> Review
- API wrapper: `frontend/src/api/client.js`, using `VITE_API_BASE_URL` or `http://localhost:8787/api`.
- Media helpers: `frontend/src/lib/media.js` handles file-to-data-URL, blob-to-base64, and browser speech recognition.
- i18n: `frontend/src/i18n.js` loads `en`, `zh-CN`, `fr`, `de`, `es` JSON files and persists UI language.

## Shared Frontend Components

- `PhoneFrame`: fixed phone-shell presentation container.
- `Header`: home/settings/back navigation, with Learn routes returning to home.
- `BottomSheet`: used for Learn recap, persona picker, custom approach, and media picker.
- `SegmentedControl`: tab-style segmented picker; used in Prep answer approaches. Renders 2, 3, or 4 columns. The default `layoutId="hintLevel"` spring animation can collide if multiple instances mount simultaneously; use distinct `layoutId` props if reused in parallel.
- `StickyCTA`: fixed bottom CTA pattern used in Prep and Review. Accepts optional `helper` text displayed above the button; Review no longer passes a `helper` (CTA is clean text only).
- `AudioButton`: plays generated audio URLs.
- `GlobalLoadingOverlay`: full phone overlay during bridge/speak preparation.

## Backend

- Stack: Node ESM, Express 5, CORS, dotenv, multer, `@google/genai`, Google Cloud Speech, Google Cloud Text-to-Speech.
- Entry: `backend/src/server.js`; app setup in `backend/src/app.js`.
- CORS origin defaults to `http://localhost:5173`; JSON body limit is 15mb.
- State: `backend/src/services/session.service.js` stores sessions, attempts, Learn sessions, and bridges in memory.
- AI orchestration: `backend/src/services/gemini.service.js`; falls back to `mock.service.js` when `GEMINI_API_KEY` is missing or parsing fails.
- STT/TTS: `stt.service.js` and `tts.service.js`; both return mock data when `GOOGLE_APPLICATION_CREDENTIALS` is missing.

## Key API Routes

- `GET /api/health`: backend health.
- `POST /api/input/analyze`: normalizes text/image/audio into prompt summary/extracted text.
- `POST /api/learn/start`: creates an in-memory Learn session with opening message and collected state.
- `POST /api/learn/message`: continues Learn chat and updates collected state.
- `POST /api/bridge/generate`: creates a bridge recap from a Learn session.
- `POST /api/speak/prepare`: prepares direct or bridge-based Speak session, approaches, speaking plan, examiner prompt/TTS, initial conversation messages, and hint data.
- `POST /api/speak/submit`: transcribes/submits a practice attempt.
- `POST /api/review/generate`: creates actionable review and TTS audio for better/top versions.
- `POST /api/speak/take2`: increments round and returns next hint goal.
- `POST /api/audio/preview`: generates a sample answer and audio preview.

Legacy/parallel routes still exist under `/api/ai`, `/api/voice`, `/api/plan`, `/api/practice`, and `/api/session`; the current frontend mainly uses the routes listed above.

## Data Shape Notes

- Settings expose two languages: App language (`uiLanguage` in React, `appLanguage` in API payloads) and Practice language (`targetLanguage`).
- App language owns UI/help/explanation data; Practice language owns practice prompts, examiner prompt/TTS, speaking plans, Phrase hint content/highlights, sample answers, subtitles/audio, and imitation answer versions.
- Speak sessions use both `sessionId` and `speakSessionId`; the frontend normalizes `speakSessionId || sessionId` into `session.sessionId`.
- Practice sessions also carry IM-ready fields: `canonicalPrompt`, `examinerPromptText`, `examinerPromptAudio`, `hintData`, `initialMessages`, `conversationMessages`, `mode`, and `followUpEnabled`. Message roles are intended to support `examiner`, `user`, and `system`; message types are intended to support `text` and `audio`.
- A speaking plan is expected to have exactly three items: `opening`, `point_1`, and `point_2_or_conclusion`.
- `hintData` may contain legacy `outline`, `phrases`, `keywords`, and `scale`, but `StageScreen` currently consumes only `phrases` for the right-side user ghost bubble and `keywords` for inline highlighting.
- `StageScreen` renders the Phrase hint as a right-side user ghost bubble. This ghost bubble is not persisted as a conversation message; it exits before the submitted user audio bubble is inserted.
- Recommended answer approaches are expected to be three items. The response now also includes `allApproachPlans` — an array of `{ approachId, speakingPlan }` with IDs forcibly normalised to `approach_1/2/3` by position. Frontend uses positional-index lookup first, ID-based match as fallback.
- Bridge prompts are `{ id, angleLabel, questionText }`.
- Review includes `summary`, `topIssues` (exactly 3), `betterVersion`, `topVersion`, `scores`, and usually `take2Goal`.

## STT Language Code Handling

`stt.service.js` normalises any incoming `languageCode` through `toTtsLanguageCode()` before calling Google STT (maps short codes like `en` → `en-US`, `zh-CN` → `cmn-CN`, etc.). Model selection is also automatic: `latest_long` for `en-*` languages, `default` for everything else. This prevents `INVALID_ARGUMENT` errors from the Google STT v1 API when non-English language codes are used with the `latest_long` model.
