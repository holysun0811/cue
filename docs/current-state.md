# Current State

Short handoff for the current Cue implementation. Keep this updated after larger product changes.

## Product Shape

Cue V0.4 is a mobile-in-web speaking prep app for students. The product has two visible modes:

- Learn: help the student understand a topic/material first.
- Speak: turn a prompt into a short speaking plan, record an attempt, and review it.

There is one hidden transition mode:

- Bridge: turns Learn recap state into selectable speaking prompts.

The main flow is:

```text
Home -> Learn -> Bridge -> Speak Prep -> Speak Practice -> Speak Review
Home -> Start Exam -> Speak Practice -> Speak Review
Home -> Start Exam -> Fake Camera -> Home
```

## Pages And Responsibilities

- `HomeScreen`: two entry cards for Learn and Speak/Exam, plus resume buttons for the most recent in-memory Learn/Speak sessions. The main Speak/Exam card opens the full-screen `StartExamModal` over Home; the recent Speak button resumes the last in-memory Speak session.
- `LearnScreen`: chat-like topic exploration. Supports text, image attachment, browser speech recognition, persona suggestions, and a recap bottom sheet.
- `StartExamModal`: full-screen content-creation style overlay for starting a mock exam. It has a close button, top-right Start exam action, one large white card for text/voice seed input, and a bottom photo-material entry card.
- `FakeCameraScreen`: demo-only camera/material capture route opened from Start Exam's photo entry. It shows a mock camera preview with shutter and album controls, but does not request real camera permissions or upload files.
- `BridgeScreen`: shows a generated recap with key facts, viewpoints, target terms, and recommended practice prompts. The student must pick a prompt before starting Speak.
- `PrepRoom`: when a prepared prompt already exists (for example from Bridge or resume), it shows the speaking plan with approach selection (three pre-generated recommended approaches + custom), custom approach text/voice input, and sample-answer audio preview. All three recommended approach plans are fetched in one shot on entry; switching recommended approaches is instant local state update with no backend request.
- `StageScreen`: multi-turn IM-style examiner practice screen. Shows examiner messages on the left, auto-plays examiner TTS, and shows a right-side translucent user ghost bubble as the student's temporary hint/draft. The student press-and-holds the bottom mic button to record, releases to create a preview, then can send or say again. Sending inserts the real user audio bubble, calls `/api/speak/submit`, and appends a generated examiner follow-up instead of moving to review. A light "Finish practice" button appears only after at least one user answer and is the only path from Practice to Review.
- `ReviewScreen`: generates feedback, displays primary fix prominently, shows Better Version with audio, Other Notes, and Top Version with scores. All sections are always expanded. CTA ("Try again") only appears after review data loads.
- `SettingsScreen`: manages App language and Practice language.

## Confirmed Interactions

- Learn starts with a local starter assistant message, then calls `/api/input/analyze` for image input and `/api/learn/start`.
- The app has only two language concepts: App language for UI/help/explanations, and Practice language for content the student will say or imitate.
- Practice language persists in local storage. App language is handled by i18n and also persisted by i18next.
- Persona suggestions are local heuristics based on topic keywords; the first suggestion auto-applies when a new Learn session has no persona.
- Recap entry in Learn either generates a bridge or opens the recap sheet if collected facts/terms already exist.
- Bridge prompt selection is mandatory before starting Speak from Bridge.
- Direct Speak/Exam entry starts from a full-screen creation overlay, not a Build Answer form and not a normal route push. The learner provides a text/voice exam seed, then Cue prepares the session and immediately enters the examiner IM flow. The photo-material card currently opens a fake camera demo route and is a demo stub, not a real upload/capture pipeline.
- Speak preparation fetches all three recommended approach plans in a single `/api/speak/prepare` call. Each plan contains `id`, `label`, `summary`, and a full `speakingPlan`. The backend normalises all `recommendedApproaches[i].id` and `allApproachPlans[i].approachId` to `approach_1/2/3` by position index so client-side switching is always reliable.
- Switching between recommended approaches patches session state locally (zero network requests). Only the custom approach option triggers a new `/api/speak/prepare` call.
- Answer approaches, custom-approach explanations, and explanation/system UI use App language; speaking plan text, examiner prompt/TTS, Phrase hint content/highlights, sample-answer audio/subtitles, practice prompts, and review answer versions use Practice language.
- `/api/speak/prepare` now returns `canonicalPrompt`, natural `examinerPromptText`, `examinerPromptAudio`, `hintData`, `mode`, `followUpEnabled`, and `initialMessages` so Practice can render as an examiner conversation instead of a static prompt card. Direct Exam setup sends `mode: "exam"` and `followUpEnabled: true`; multi-turn follow-up is the default and is not exposed as a setup option.
- `/api/speak/submit` is a multi-turn Practice endpoint: it transcribes the user's current answer, stores/returns the user message, generates a target-language examiner follow-up from the conversation, synthesizes that follow-up, returns updated `conversationMessages`, and returns fresh Phrase `hintData` for the next user answer. The hint keywords are intended to appear verbatim inside the phrases so the ghost bubble can highlight them.
- Practice hint UI is a single Phrase hint only. There is no Outline / Phrases / Keywords mode switch in Practice.
- Hint controls default to a draggable floating lightbulb inside the IM area, snapped to the left or right edge. Tapping it toggles the user-side Phrase ghost bubble; the hint content itself appears only in that ghost bubble, not as a central card and not as a real `conversationMessages` turn. Keywords from `hintData.keywords` are used only to highlight matching terms inside the phrases.
- Practice ends only when the learner taps "Finish practice" after at least one sent answer. Review receives the full conversation message history and uses all user transcripts, not just the first answer.
- Take 2 increments the round, uses the review's recommended hint level when available, clears the latest attempt/conversation, and returns to Practice.
- Review loads asynchronously; during loading the page shows a spinner card and three skeleton placeholder blocks. The "Try again" CTA is not rendered until review data is present.
- Review surfaces `topIssues[0]` as the primary fix with `summary` as the "why", `betterVersion` (text + audio) as the imitation example, and remaining issues and top version always expanded below.
