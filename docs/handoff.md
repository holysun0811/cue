# Handoff

Short operational notes for the next Codex session. Keep this updated after larger changes.

## Latest Product Decisions

- Cue is currently V0.4: Learn first, then Speak, with Bridge as the hidden transition.
- Home keeps Learn and Speak as separate visible modes. Bridge is not exposed as a top-level mode.
- Language concepts are intentionally only two:
  - App language: UI, guidance, explanations, recaps, answer approaches, and review feedback.
  - Practice language: practice prompts, speaking plans, sample answers, subtitles/audio, and answer versions the learner imitates.
- Learn should reduce cognitive load before output pressure; explanations stay in App language by default.
- Speak prep should offer answer-approach choice before practice, including a custom approach option.
- All three recommended approach plans are pre-fetched in one call on Speak Prep entry; switching between them is instant local state with no network request.
- Only the custom approach option triggers a new backend generation call.
- Bridge-to-Speak requires choosing a recommended practice prompt first.
- Mock mode is part of the demo contract, not just a temporary fallback.
- Practice hint UI is now single-mode: the floating lightbulb toggles a Phrase ghost bubble directly. There is no Outline / Phrases / Keywords switch in Practice.
- Practice is now a multi-turn IM-style examiner conversation, not a static answer card or a one-answer flow. Examiner messages are conversation content; hints are shown as a temporary user-side ghost bubble and must not be inserted into the real chat message stream.
- Practice does not auto-enter Review after a user answer. Review starts only when the learner taps "Finish practice" after sending at least one answer.
- Phrase hint content and highlighted key terms use Practice language.
- Review shows loading skeletons while generating, surfaces the single most important fix prominently, and only renders the CTA after review data is ready.
- Direct Speak/Exam entry is a full-screen Start Exam creation modal, not a Build Answer or answer-plan generator. The learner enters a text/voice seed or opens the photo-material demo route, then starts a multi-turn examiner IM exam directly.
- Multi-turn examiner follow-up is the default Exam behavior and should not be exposed as a one-round/multi-round setting.

## Recent Changes

### StageScreen (Practice page)
- Replaced the static prompt + hint card + sticky CTA layout with an IM-style examiner chat.
- Practice now initializes from `initialMessages` and can hold `conversationMessages` with `role = examiner | user | system` and `type = text | audio`.
- Examiner first message appears as a left-side bubble and auto-plays `examinerPromptAudio` once on entry; a replay button remains on the bubble.
- User answering is press-and-hold: pointer down starts recording, pointer up creates a preview. Recording is not auto-submitted.
- The preview state shows a compact audio preview with play, duration, `say again` (reset to idle), and send icon actions.
- Before sending, the Phrase hint renders as a translucent/dashed right-side ghost bubble labelled as the answer draft. It stays visible while recording when toggled on, highlights a few matching key terms, and fades/scales out before the real user audio message appears.
- Sent user recordings appear as right-side audio bubbles with waveform, duration, play/pause, and optional transcript.
- The hint UI defaults to a draggable floating lightbulb inside the IM list area, snapped to the left or right edge. Tapping it directly toggles the Phrase ghost bubble; it no longer expands into a large panel or mode switch.
- Sending a recording now stays inside Practice: `/api/speak/submit` transcribes the turn, returns the saved user message plus a generated examiner follow-up, and the follow-up is appended/auto-played as the next left-side message.
- A light "Finish practice" button appears near the chat top only after at least one user message. Tapping it creates a finished conversation attempt and navigates to Review.

### Speak Prepare / Practice data
- `/api/speak/prepare` now returns `canonicalPrompt`, natural `examinerPromptText`, `examinerPromptAudio`, `hintData`, `mode`, `followUpEnabled`, and `initialMessages` in addition to the existing approach/plan fields.
- `gemini.service.js` added `generateExaminerPrompt()` to rewrite the canonical prompt into a natural examiner question in Practice language, with a mock fallback.
- `speak.controller.js` synthesizes examiner TTS during preparation and builds hint data; Practice currently consumes `phrases` for the ghost bubble and `keywords` only for inline highlights.
- `gemini.service.js` now also owns `generateExaminerFollowUp()` and its follow-up examiner prompt. The prompt instructs Gemini to act as a concise spoken-language examiner, ask exactly one natural target-language follow-up, avoid review feedback, avoid repeating the original prompt, and keep the session open until the learner finishes.
- `speak.controller.js` now extends `/api/speak/submit` into the multi-turn Practice endpoint: it transcribes the user answer, merges it into `conversationMessages`, generates/synthesizes the next examiner message, generates fresh Phrase `hintData` for the next answer, stores the updated conversation/hints, and returns both messages.
- `gemini.service.js` also owns `generatePracticeHintData()`, which creates 1-2 target-language phrase hints plus highlight keywords for the next answer. The prompt requires each keyword to appear verbatim in the phrases so the frontend highlighter works.
- Recommended approach switching in `PrepRoom` still stays local and now also refreshes local `hintData` for the selected plan.

### ReviewScreen
- Added a proper loading state: spinner card with title/subtitle + three skeleton placeholder blocks. CTA is hidden during loading.
- Removed separate "Review" eyebrow line; `Sparkles` icon is now inline with the main title.
- Replaced both `CollapseSection` instances (Other Notes, Top Version) with always-expanded plain cards. Removed `CollapseSection` component, `ChevronDown` icon, and all open/close state.
- CTA (`helper` prop removed from `StickyCTA`): "Try again" button is clean with no floating hint text above it.
- "Take 2" renamed to "Try again" (en) / "按建议再试一遍" (zh-CN) / equivalent in fr, de, es.
- New locale keys added: `loadingTitle`, `loadingHint`, `topFixLabel`, `otherNotes` across all 5 locales.
- Review generation now receives the full Practice `conversationMessages` and an aggregate transcript of all user turns. The backend also falls back to stored session conversation history if the request omits messages.

### Direct Exam setup
- Replaced the direct-entry Start Exam route-like setup with a full-screen creation modal over Home.
- The modal uses a content-creation layout: left close button, centered Start Exam title, top-right Start exam action, a large white idea/input card, a card-level voice button, and a bottom photo-material entry card.
- Text and voice input both write into the same large input card. Start exam stays disabled until that card has a useful seed.
- The Start exam action calls `/api/input/analyze` and `/api/speak/prepare` with direct entry, `mode: "exam"`, and `followUpEnabled: true`, then immediately enters the examiner IM Practice page.
- Home's primary Speak/Exam card opens this modal, while the recent Speak button resumes the previous in-memory Speak session.
- The bottom photo-material card is currently a Hackathon demo stub: it closes the modal and navigates to `/camera`, a fake camera page with mock preview, shutter, and album controls.

### STT Service (bug fix)
- `stt.service.js` now normalises `languageCode` via `toTtsLanguageCode()` before calling Google STT. Fixes `INVALID_ARGUMENT` errors caused by short codes like `en` or `zh-CN` being passed directly to the API.
- Model selection is now automatic: `latest_long` for `en-*`, `default` for all other languages. Fixes failures when practising in non-English languages (e.g. Chinese).

## Recent Repository State

- Frontend has screens for Home, Learn, Bridge, Prep, Practice, Review, and Settings.
- The direct empty state under Prep is now a Start Exam setup screen; prepared/resumed sessions still use the existing speaking-plan Prep view.
- Frontend has common components for bottom sheets, sticky CTA, audio playback, segmented controls, and global loading.
- Backend is split into route/controller/service layers for input, learn, bridge, speak, audio, review, and older AI/voice/plan/practice/session routes.
- Gemini service owns structured generation; normalises all `recommendedApproaches` and `allApproachPlans` IDs to `approach_1/2/3` by position index before returning to controller.
- Speak prepare also owns examiner prompt generation/TTS and IM-ready initial message construction.
- Google STT/TTS integrations are wired with language-code normalisation and model-selection logic; mock transcript/audio when credentials are absent.
- Locales exist for `en`, `zh-CN`, `fr`, `de`, and `es`.

## Do Not Revert These Decisions

- Do not merge Learn and Speak into one generic flow; the two-mode structure is intentional.
- Do not make Bridge a visible Home mode unless the product direction explicitly changes.
- Do not remove mock fallbacks; they keep the full app demoable without credentials.
- Do not reintroduce a third language or Learn language-mix modes without a new product decision.
- Do not collapse App language and Practice language into one setting.
- Do not remove answer-approach selection from Speak prep; it is a core interaction.
- Do not bypass prompt selection when entering Speak from Bridge.
- Do not replace the phone-frame app shell with a generic desktop page without a design decision.
- Do not add `'off'` back to the hint-mode segmented control without a product reason; the three-option layout is intentional.
- Do not revert `allApproachPlans` pre-generation; the instant local switching UX depends on all three plans being available at session load.
- Do not turn Practice back into the old static prompt card; the examiner chat shell is now the intended direction.
- Do not put hints into `conversationMessages`; the user-side ghost bubble is UI state, not a real conversation turn.
- Do not make the Review CTA visible during loading; it must only appear after review data is present.
- Do not turn the direct Exam setup back into a Build Answer / Build speaking plan form; the direct entry should create an exam prompt and immediately start the examiner IM conversation.
- Do not add a one-round/multi-round setup control; direct Exam defaults to multi-turn examiner follow-up.

## Known Issues And Constraints

- Backend persistence is in memory only. Refreshes/backend restarts lose sessions, attempts, Learn sessions, and bridges.
- Frontend session state is also in memory except language settings in local storage/i18n persistence.
- Browser speech recognition depends on browser support and is separate from backend STT.
- Image input is passed as base64; there is no real OCR pipeline documented in the current code.
- `MediaRecorder` uploads webm audio; Google STT encoding support is inferred by MIME type.
- Some older routes remain for compatibility or earlier flows and are not the primary frontend path.
- No automated test suite is visible in package scripts beyond lint/build-style checks.
- Examiner prompt TTS is generated during `/api/speak/prepare`; this improves entry playback but adds one TTS step to Speak preparation latency.
- `SegmentedControl` still defaults to `layoutId="hintLevel"` if reused elsewhere; Practice no longer uses it, so the earlier Prep/Practice collision is currently avoided.

## Todo

- Add persistence if session continuity across refresh/restart matters.
- Decide whether old `/api/ai`, `/api/voice`, `/api/plan`, `/api/practice`, and `/api/session` routes should stay public or be pruned.
- Add focused tests for direct Speak, Learn-to-Bridge-to-Speak, review generation, and Take 2.
- Validate real Gemini/STT/TTS credentials against the current route payloads.
- Consider real image/OCR handling if image-based school prompts become important.
- Decide how many follow-up turns exam mode should require before it recommends finishing; Practice currently lets the learner decide when to finish.

## Maintenance Rule

After larger product or flow changes, update:

- `docs/current-state.md` for product shape, page duties, and confirmed interactions.
- `docs/handoff.md` for decisions, recent changes, todos, and known issues.

Update `docs/architecture.md` when routes, state ownership, API shapes, or shared components change.
