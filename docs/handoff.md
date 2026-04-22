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
- Practice hint mode no longer includes an "off" option in the UI. The three visible modes are outline, phrases, and keywords. "off" is still handled gracefully in logic but is not selectable.
- Review shows loading skeletons while generating, surfaces the single most important fix prominently, and only renders the CTA after review data is ready.

## Recent Changes

### StageScreen (Practice page)
- Removed `'off'` from the hint-mode segmented control. Control now has exactly 3 options: outline / phrases / keywords.
- Removed the large circular mic button and `AudioWave` animation component. CTA is now a `StickyCTA` sticky bottom button with three text states: "Start answering" / "I finished" / "Analyzing...".
- Removed the "直接一点" / "Stay direct" guidance pill (`guidanceIdle` locale key deleted from all 5 locales).
- Added a one-line hint description below the segmented control (`hintDesc.outline/phrases/keywords` locale keys added to all 5 locales).
- Page structure: eyebrow + prompt text → hint mode segmented control → description line → hints card → sticky CTA.

### ReviewScreen
- Added a proper loading state: spinner card with title/subtitle + three skeleton placeholder blocks. CTA is hidden during loading.
- Removed separate "Review" eyebrow line; `Sparkles` icon is now inline with the main title.
- Replaced both `CollapseSection` instances (Other Notes, Top Version) with always-expanded plain cards. Removed `CollapseSection` component, `ChevronDown` icon, and all open/close state.
- CTA (`helper` prop removed from `StickyCTA`): "Try again" button is clean with no floating hint text above it.
- "Take 2" renamed to "Try again" (en) / "按建议再试一遍" (zh-CN) / equivalent in fr, de, es.
- New locale keys added: `loadingTitle`, `loadingHint`, `topFixLabel`, `otherNotes` across all 5 locales.

### STT Service (bug fix)
- `stt.service.js` now normalises `languageCode` via `toTtsLanguageCode()` before calling Google STT. Fixes `INVALID_ARGUMENT` errors caused by short codes like `en` or `zh-CN` being passed directly to the API.
- Model selection is now automatic: `latest_long` for `en-*`, `default` for all other languages. Fixes failures when practising in non-English languages (e.g. Chinese).

## Recent Repository State

- Frontend has screens for Home, Learn, Bridge, Prep, Practice, Review, and Settings.
- Frontend has common components for bottom sheets, sticky CTA, audio playback, segmented controls, and global loading.
- Backend is split into route/controller/service layers for input, learn, bridge, speak, audio, review, and older AI/voice/plan/practice/session routes.
- Gemini service owns structured generation; normalises all `recommendedApproaches` and `allApproachPlans` IDs to `approach_1/2/3` by position index before returning to controller.
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
- Do not make the Review CTA visible during loading; it must only appear after review data is present.

## Known Issues And Constraints

- Backend persistence is in memory only. Refreshes/backend restarts lose sessions, attempts, Learn sessions, and bridges.
- Frontend session state is also in memory except language settings in local storage/i18n persistence.
- Browser speech recognition depends on browser support and is separate from backend STT.
- Image input is passed as base64; there is no real OCR pipeline documented in the current code.
- `MediaRecorder` uploads webm audio; Google STT encoding support is inferred by MIME type.
- Some older routes remain for compatibility or earlier flows and are not the primary frontend path.
- No automated test suite is visible in package scripts beyond lint/build-style checks.
- `SegmentedControl` uses `layoutId="hintLevel"` for the spring animation; if Practice and Prep hint selectors are ever mounted simultaneously this will conflict.

## Todo

- Add persistence if session continuity across refresh/restart matters.
- Decide whether old `/api/ai`, `/api/voice`, `/api/plan`, `/api/practice`, and `/api/session` routes should stay public or be pruned.
- Add focused tests for direct Speak, Learn-to-Bridge-to-Speak, review generation, and Take 2.
- Validate real Gemini/STT/TTS credentials against the current route payloads.
- Consider real image/OCR handling if image-based school prompts become important.
- Fix `SegmentedControl` `layoutId` collision if Prep and Practice are ever rendered simultaneously.

## Maintenance Rule

After larger product or flow changes, update:

- `docs/current-state.md` for product shape, page duties, and confirmed interactions.
- `docs/handoff.md` for decisions, recent changes, todos, and known issues.

Update `docs/architecture.md` when routes, state ownership, API shapes, or shared components change.
