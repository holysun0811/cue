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
Home -> Speak Prep -> Speak Practice -> Speak Review
```

## Pages And Responsibilities

- `HomeScreen`: two entry cards for Learn and Speak, plus resume buttons for the most recent in-memory Learn/Speak sessions.
- `LearnScreen`: chat-like topic exploration. Supports text, image attachment, browser speech recognition, persona suggestions, and a recap bottom sheet.
- `BridgeScreen`: shows a generated recap with key facts, viewpoints, target terms, and recommended practice prompts. The student must pick a prompt before starting Speak.
- `PrepRoom`: either collects a direct Speak prompt, or shows the prepared speaking plan. Supports approach selection (three pre-generated recommended approaches + custom), custom approach text/voice input, and sample-answer audio preview. All three recommended approach plans are fetched in one shot on entry; switching recommended approaches is instant local state update with no backend request.
- `StageScreen`: recording screen. Lets the student choose hint mode (outline / phrases / keywords — the "off" option has been removed from the UI), records audio with `MediaRecorder`, submits the attempt, then moves to review. CTA is a sticky bottom button that changes state between "Start answering" / "I finished" / "Analyzing...".
- `ReviewScreen`: generates feedback, displays primary fix prominently, shows Better Version with audio, Other Notes, and Top Version with scores. All sections are always expanded. CTA ("Try again") only appears after review data loads.
- `SettingsScreen`: manages App language and Practice language.

## Confirmed Interactions

- Learn starts with a local starter assistant message, then calls `/api/input/analyze` for image input and `/api/learn/start`.
- The app has only two language concepts: App language for UI/help/explanations, and Practice language for content the student will say or imitate.
- Practice language persists in local storage. App language is handled by i18n and also persisted by i18next.
- Persona suggestions are local heuristics based on topic keywords; the first suggestion auto-applies when a new Learn session has no persona.
- Recap entry in Learn either generates a bridge or opens the recap sheet if collected facts/terms already exist.
- Bridge prompt selection is mandatory before starting Speak from Bridge.
- Speak preparation fetches all three recommended approach plans in a single `/api/speak/prepare` call. Each plan contains `id`, `label`, `summary`, and a full `speakingPlan`. The backend normalises all `recommendedApproaches[i].id` and `allApproachPlans[i].approachId` to `approach_1/2/3` by position index so client-side switching is always reliable.
- Switching between recommended approaches patches session state locally (zero network requests). Only the custom approach option triggers a new `/api/speak/prepare` call.
- Answer approaches and custom-approach explanations use App language; speaking plan text, sample-answer audio/subtitles, practice prompts, and review answer versions use Practice language.
- Practice hint modes are `outline`, `phrases`, and `keywords`. The `off` option has been removed from the segmented control; if a saved session carries `off` it is coerced to `keywords` on screen load.
- A one-line hint description (e.g. "Locks in the key words") is shown below the segmented control and updates when the mode changes.
- Take 2 increments the round, uses the review's recommended hint level when available, clears the latest attempt, and returns to Practice.
- Review loads asynchronously; during loading the page shows a spinner card and three skeleton placeholder blocks. The "Try again" CTA is not rendered until review data is present.
- Review surfaces `topIssues[0]` as the primary fix with `summary` as the "why", `betterVersion` (text + audio) as the imitation example, and remaining issues and top version always expanded below.
