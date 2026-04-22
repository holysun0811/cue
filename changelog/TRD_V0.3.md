You are a senior full-stack engineer refactoring an existing hackathon app called “Cue”.

The existing project already has:
- frontend and backend root folders
- frontend stack: React + Tailwind + Framer Motion + react-i18next
- backend stack: Node.js + Express
- AI integrations planned via Gemini + Google STT/TTS
- existing product flow based on multimodal input → prep room → conversation mode → review → take 2
- existing visual direction: cyberpunk dark mode, mobile-in-web mock phone, polished native-like motion
- existing requirement that API keys must live in .env and backend endpoints must still work with mocked/dummy data if keys are missing

Please preserve that spirit, but refactor the product flow and data contracts to the new Cue V2 specification below. The current docs emphasize cyberpunk dark mode, multimodal input, dual-language scaffolding, listening practice, review, and a Take 2 loop, as well as React/Tailwind/Framer Motion frontend and Express backend with Gemini/STT/TTS plus mock fallback. Build on that instead of replacing it. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

====================
GOAL
====================

Refactor Cue into a mobile-first AI rehearsal coach for school oral tasks.

Core value:
Turn a school prompt into a speakable answer.

New primary flow:
1. Choose Task
2. Build Answer
3. Speak
4. Review & Take 2

This is not a general chat app and not a course app.
It is a single-task rehearsal flow optimized for:
- class speaking
- oral exams
- short presentations
- photo description
- prompt response
- text summary

====================
HIGH-LEVEL PRODUCT RULES
====================

1. Fast to first speech
The user should be able to start speaking quickly.

2. Scaffold, then fade
Support is strongest in prep, lighter in practice, reduced further in Take 2.

3. One main CTA per screen
Do not create multiple competing primary actions.

4. Less reading, more speaking
Reduce long text blocks and long card stacks.

5. Actionable review
Review should tell the user exactly what to fix next, not just score them.

====================
LANGUAGE MODEL
====================

The app must support:
- uiLanguage: follows system/browser language by default, user can manually switch
- sourceLanguage: the user’s thinking language, default to uiLanguage but editable
- targetLanguage: the language being practiced, default to English but editable and not hardcoded to English

Important:
- All UI text must go through i18n
- The app must work with any target language, not just English
- Prep can use sourceLanguage as scaffolding
- Practice must reduce sourceLanguage exposure
- Review should primarily show targetLanguage content

====================
REFACTOR PLAN
====================

Refactor the existing app into these 4 screens:

1. Home / Task Start
2. Build Answer / Prep
3. Speak / Practice
4. Review / Take 2

Replace the old UI patterns where needed:
- replace the large homepage “input-first” emphasis with task-first entry
- replace the old long cue-card stack with a concise 3-part speaking plan
- replace the continuous Assist Slider with a 4-level segmented hint control
- replace review-first score emphasis with “3 actionable fixes + better version + take 2 goal”

====================
SCREEN SPECS
====================

--------------------------------
SCREEN 1: HOME / TASK START
--------------------------------

Goal:
Let the user understand in 3 seconds that this app helps turn a school prompt into a speakable answer.

Required UI:
- small Cue logo/header
- language toggle in header
- hero area with short title/subtitle
- task type selector (2x2 grid or similar)
- one main input card
- one primary CTA

Task types:
- describe_photo
- answer_prompt
- summarize_text
- short_presentation

Input methods:
- text input
- voice input
- camera
- gallery upload

Rules:
- user chooses task type first
- primary CTA disabled until task type selected and some input exists
- voice input can produce transcribed text
- image input can produce OCR/extracted prompt summary
- one main CTA only: “Build my answer”

Suggested component names:
- TaskTypeSelector
- PromptInputCard
- MediaInputActions
- PrimaryActionButton

--------------------------------
SCREEN 2: BUILD ANSWER / PREP
--------------------------------

Goal:
Help the user understand how to answer within ~10 seconds.

Required UI:
- top header with back + page title + thin progress line
- optional +30s secondary control
- prompt summary card
- main speaking plan card
- secondary CTA: Preview plan
- primary CTA: Start speaking
- one small round goal chip

Do NOT keep the old long vertically stacked cue cards as the main pattern.

Instead, show a concise 3-part speaking plan:
- opening
- main point
- example or conclusion

Each section must contain:
- one targetLanguage line
- one highlighted keyword
- optional support_text in sourceLanguage behind expand/collapse or tooltip-like disclosure

Required example shape:
speaking_plan = [
  { id: "opening", text: "...", keyword: "...", support_text: "..." },
  { id: "point_1", text: "...", keyword: "...", support_text: "..." },
  { id: "point_2_or_conclusion", text: "...", keyword: "...", support_text: "..." }
]

Rules:
- main CTA is Start speaking
- Preview plan is secondary
- Regenerate must not appear as a big equal-priority button; place it in a subtle icon or overflow action
- no large countdown box
- support text hidden by default

--------------------------------
SCREEN 3: SPEAK / PRACTICE
--------------------------------

Goal:
Get the user speaking quickly with minimal screen reading.

Required UI:
- compact header with Round 1 / Round N
- prompt summary strip
- segmented hint level control (NOT a continuous slider)
- lightweight hint panel
- single recording zone / single main action
- optional live guidance chip

Replace the old Assist Slider with a 4-state segmented control:
- Outline
- Phrases
- Keywords
- Off

Default behavior:
- first round default: Phrases
- second round can recommend Keywords
- user may manually change hint level

Hint panel rules:
- max 3 hints visible
- each hint max 1–2 lines
- no large bilingual stacked cards
- prioritize speakability over completeness

Recording zone states:
- idle: Tap to answer / Start answering
- recording: Listening...
- processing: Analyzing...

Live guidance chip examples:
- On track
- Add one example
- Wrap it up
- Be more direct

Rules:
- only one true start action
- do not show both a big center start control and a bottom start button
- while recording, hints can shrink/collapse
- do not perform noisy real-time interruption
- after finish, auto-transition to Review

--------------------------------
SCREEN 4: REVIEW / TAKE 2
--------------------------------

Goal:
Tell the user what to fix and make them want to immediately try again.

Required UI order:
1. one-line summary
2. top 3 actionable fixes
3. Better Version
4. Top Version (collapsed or secondary)
5. optional compact scores chart
6. sticky Take 2 CTA with a clear next-round goal

Top 3 fixes must be action-style, e.g.:
- Start with your opinion earlier.
- Add one concrete example.
- End with a stronger conclusion.

Better Version:
- near the user’s current level
- short enough to imitate
- audio playable

Top Version:
- more advanced / more native-like
- secondary, not the first thing users see
- audio playable

Sticky CTA:
- Take 2
- with a clear take2_goal shown above it, e.g.:
  “This time: add one concrete example.”

Rules:
- do not make radar chart the hero of the page
- review must be more actionable than decorative
- Take 2 returns user to Practice with same prompt/session context
- hint level can auto-step down/up based on recommendation

====================
FRONTEND IMPLEMENTATION REQUIREMENTS
====================

Use the existing frontend stack, preserving mobile-in-web presentation and polished motion.

Keep:
- React
- TailwindCSS
- Framer Motion
- react-i18next
- lucide-react
- clsx + tailwind-merge if not already installed

Global UI requirements:
- mobile mock phone shell centered on page
- dark cyberpunk tool-like aesthetic
- native-feeling page transitions
- reduced “web form” feeling
- sticky bottom CTA pattern where appropriate

Do:
- use AnimatePresence for page transitions
- keep scrollbars hidden
- use overscroll-behavior and tap highlight suppression
- keep one glow focal element per screen
- reduce oversized headings from the current design
- favor compact, high-clarity layouts over long glowing stacks

Do NOT:
- keep the giant homepage microphone as the dominant primary pattern
- keep the continuous assist slider
- keep large “Conversation Mode” hero text
- keep multiple same-priority CTAs on prep screen
- overuse glow on every element

Recommended frontend structure:

frontend/src/
  app/
    router.tsx
    providers.tsx
    store/
      sessionStore.ts
      settingsStore.ts
  components/
    common/
      AppShell.tsx
      Header.tsx
      LanguageToggle.tsx
      SegmentedControl.tsx
      StickyCTA.tsx
      AudioButton.tsx
      LoadingState.tsx
      EmptyState.tsx
    home/
      TaskTypeSelector.tsx
      PromptInputCard.tsx
      MediaInputActions.tsx
    prep/
      PromptSummaryCard.tsx
      SpeakingPlanCard.tsx
      PlanSection.tsx
      RoundGoalChip.tsx
    practice/
      PromptStrip.tsx
      HintPanel.tsx
      RecordingZone.tsx
      LiveGuidanceChip.tsx
    review/
      SummaryCard.tsx
      ActionFixList.tsx
      BetterVersionCard.tsx
      TopVersionCard.tsx
      ScoreMiniChart.tsx
  pages/
    HomePage.tsx
    PrepPage.tsx
    PracticePage.tsx
    ReviewPage.tsx
  lib/
    api.ts
    i18n.ts
    media.ts
    ocr.ts
    audio.ts
    utils.ts
  locales/
    en/
    zh-CN/
    fr/
    de/
    es/
  types/
    api.ts
    session.ts
    ui.ts

Use Zustand or existing local state solution if already present.
Do not over-engineer with heavy global frameworks if unnecessary.

====================
BACKEND CHANGES REQUIRED
====================

Yes, backend changes are required.

Reason:
The old backend contract was oriented around:
- cue cards
- preview audio
- STT/TTS
- review/perfect version

The new frontend requires new structured contracts:
- task-aware input analysis
- 3-part speaking plan
- concise review with 3 action items
- better_version + top_version
- take2_goal
- language-agnostic behavior
- stable mock mode

Keep Express backend, but update/add endpoints to support Cue V2.

Recommended backend structure:

backend/src/
  server.ts
  app.ts
  routes/
    session.routes.ts
    input.routes.ts
    plan.routes.ts
    practice.routes.ts
    review.routes.ts
    audio.routes.ts
  controllers/
    input.controller.ts
    plan.controller.ts
    practice.controller.ts
    review.controller.ts
    audio.controller.ts
  services/
    gemini.service.ts
    stt.service.ts
    tts.service.ts
    ocr.service.ts
    session.service.ts
    mock.service.ts
  prompts/
    buildPlan.prompt.ts
    review.prompt.ts
    promptSummary.prompt.ts
  schemas/
    session.schema.ts
    plan.schema.ts
    review.schema.ts
  middleware/
    error.middleware.ts
    validate.middleware.ts
  utils/
    env.ts
    logger.ts
    ids.ts
    language.ts
  types/
    api.ts
    domain.ts

====================
NEW BACKEND ENDPOINTS
====================

1. POST /api/input/analyze
Purpose:
Normalize multimodal input into a task-ready prompt summary.

Input:
{
  "taskType": "answer_prompt",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "text": "...",
  "imageBase64": "... optional ...",
  "audioBase64": "... optional ..."
}

Output:
{
  "promptSummary": "...",
  "detectedSourceLanguage": "zh-CN",
  "extractedText": "...",
  "suggestedTaskType": "answer_prompt"
}

Notes:
- if imageBase64 provided, run OCR or mock OCR
- if audioBase64 provided, run STT or mock STT
- in mock mode return realistic extracted content

2. POST /api/plan/build
Purpose:
Generate the 3-part speaking plan for the Prep screen.

Input:
{
  "taskType": "answer_prompt",
  "promptSummary": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "userIntentNotes": "... optional user thoughts ..."
}

Output:
{
  "sessionId": "sess_xxx",
  "taskType": "answer_prompt",
  "promptSummary": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "speakingPlan": [
    {
      "id": "opening",
      "text": "...",
      "keyword": "...",
      "supportText": "..."
    },
    {
      "id": "point_1",
      "text": "...",
      "keyword": "...",
      "supportText": "..."
    },
    {
      "id": "point_2_or_conclusion",
      "text": "...",
      "keyword": "...",
      "supportText": "..."
    }
  ],
  "roundGoal": "Speak for 30-45 seconds."
}

3. POST /api/audio/preview
Purpose:
Generate short preview audio for the speaking plan.

Input:
{
  "sessionId": "sess_xxx",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "speakingPlan": [...]
}

Output:
{
  "audioUrl": "/mock/preview/sess_xxx.mp3",
  "transcript": "..."
}

Rules:
- short, concise, peer-like preview
- can be code-switched
- in mock mode return stub URL + transcript

4. POST /api/practice/submit
Purpose:
Submit recorded practice speech.

Input:
{
  "sessionId": "sess_xxx",
  "round": 1,
  "targetLanguage": "en",
  "audioBase64": "... optional ...",
  "transcript": "... optional if frontend already has transcript ...",
  "hintLevel": "phrases"
}

Output:
{
  "attemptId": "att_xxx",
  "transcript": "...",
  "durationSec": 34
}

Notes:
- if audioBase64 present, run STT or mock STT
- if transcript present, skip STT
- keep response fast

5. POST /api/review/generate
Purpose:
Generate actionable review after a speaking attempt.

Input:
{
  "sessionId": "sess_xxx",
  "attemptId": "att_xxx",
  "taskType": "answer_prompt",
  "promptSummary": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "speakingPlan": [...],
  "transcript": "...",
  "round": 1
}

Output:
{
  "summary": "Clear answer, but still sounds translated.",
  "topIssues": [
    "Start with your opinion earlier.",
    "Add one concrete example.",
    "End with a stronger conclusion."
  ],
  "betterVersion": {
    "text": "...",
    "audioUrl": "/mock/review/better.mp3"
  },
  "topVersion": {
    "text": "...",
    "audioUrl": "/mock/review/top.mp3"
  },
  "scores": {
    "fluency": 72,
    "vocabulary": 68,
    "pronunciation": 74,
    "structure": 80
  },
  "take2Goal": "Add one concrete example.",
  "recommendedHintLevel": "keywords"
}

6. POST /api/session/take2
Purpose:
Prepare the next round while reusing context.

Input:
{
  "sessionId": "sess_xxx",
  "previousRound": 1,
  "recommendedHintLevel": "keywords"
}

Output:
{
  "sessionId": "sess_xxx",
  "nextRound": 2,
  "hintLevel": "keywords",
  "take2Goal": "Add one concrete example."
}

====================
PROMPT / MODEL REQUIREMENTS
====================

Build-plan prompt requirements:
- output exactly 3 sections
- optimize for speakability, not essay quality
- avoid over-complex wording
- adapt to taskType
- include keyword + short support text
- respect sourceLanguage and targetLanguage
- do not generate an overlong answer

Review prompt requirements:
- produce 1 short overall summary
- produce exactly 3 action-oriented issues
- produce a Better Version close to the learner’s level
- produce a Top Version that is better but not absurdly advanced
- produce one take2Goal
- optionally produce 4 scalar scores
- avoid vague praise dumps
- avoid 10-item issue lists
- avoid only giving a native-perfect answer

====================
SCHEMAS / TYPES
====================

Create shared backend/frontend types where practical.

Type suggestions:

type TaskType =
  | "describe_photo"
  | "answer_prompt"
  | "summarize_text"
  | "short_presentation";

type HintLevel =
  | "outline"
  | "phrases"
  | "keywords"
  | "off";

type SpeakingPlanItem = {
  id: "opening" | "point_1" | "point_2_or_conclusion";
  text: string;
  keyword: string;
  supportText?: string;
};

type BuildPlanResponse = {
  sessionId: string;
  taskType: TaskType;
  promptSummary: string;
  sourceLanguage: string;
  targetLanguage: string;
  speakingPlan: SpeakingPlanItem[];
  roundGoal: string;
};

type ReviewResponse = {
  summary: string;
  topIssues: string[];
  betterVersion: {
    text: string;
    audioUrl?: string;
  };
  topVersion: {
    text: string;
    audioUrl?: string;
  };
  scores?: {
    fluency: number;
    vocabulary: number;
    pronunciation: number;
    structure: number;
  };
  take2Goal: string;
  recommendedHintLevel: HintLevel;
};

====================
MOCK MODE REQUIREMENTS
====================

This is critical.

The backend must fully function without real API keys.
If Gemini / STT / TTS / OCR credentials are missing:
- do not crash
- return deterministic mock data
- keep frontend fully demo-able

Implement:
- env detection
- service-level fallbacks
- fake audio URLs or local mock audio assets
- realistic mock speaking plans
- realistic mock review data

Add clear TODO comments where actual SDK setup belongs.

Never hardcode secrets.
Use .env.example files for both frontend and backend.

====================
I18N REQUIREMENTS
====================

Frontend:
- all UI strings in locale files
- detect browser language on first load
- persist manual language selection
- separate uiLanguage from sourceLanguage and targetLanguage

Provide at least:
- en
- zh-CN
- fr
- de
- es

For coding speed, untranslated strings can fallback to en if needed, but architecture must support full i18n cleanly.

====================
AUDIO / MEDIA REQUIREMENTS
====================

Frontend:
- support file upload for image/audio where needed
- camera capture for prompt image
- microphone recording for practice audio
- waveform/listening animation can stay lightweight

Backend:
- support audio/transcript submission
- support preview audio and review audio
- mock audio URLs acceptable in demo mode

====================
STATE / FLOW REQUIREMENTS
====================

Maintain a session object across the flow:
- sessionId
- taskType
- sourceLanguage
- targetLanguage
- promptSummary
- speakingPlan
- round
- hintLevel
- latestAttempt
- latestReview

Practice flow state machine:
idle -> recording -> processing -> review

Take 2 flow:
review -> take2 -> practice

====================
DESIGN EXECUTION REQUIREMENTS
====================

Keep the cyberpunk dark aesthetic, but make it cleaner and more focused.

Rules:
- only one glowing focal element per screen
- compact typography hierarchy
- no huge redundant hero text on practice screen
- no oversized input-first homepage layout
- no long stacks of bilingual cards
- sticky CTA on review screen
- polished but restrained motion

You may keep:
- mock phone shell
- neon accent
- premium pill buttons
- subtle glassy surfaces
- listening animation
- compact chart in review

====================
ACCEPTANCE CRITERIA
====================

The implementation is complete when:

1. The app has 4 clear screens:
   Home, Prep, Practice, Review

2. User can:
   - pick a task type
   - input by text / image / voice
   - build a 3-part speaking plan
   - preview the plan
   - start practice
   - adjust hint level with segmented control
   - submit a speaking attempt
   - see actionable review
   - play Better Version / Top Version
   - click Take 2 and continue

3. Backend supports the new response contracts

4. App works in mock mode with no external credentials

5. UI language is separate from sourceLanguage and targetLanguage

6. Existing cyberpunk/native-app visual direction is preserved but simplified

====================
DELIVERABLES
====================

Please produce:

1. Updated frontend code inside frontend/
2. Updated backend code inside backend/
3. Any new types/schemas/utils needed
4. .env.example files
5. Minimal README update explaining:
   - how to run frontend/backend
   - how mock mode works
   - where to put real API keys later

====================
IMPORTANT IMPLEMENTATION NOTES
====================

- Prefer incremental refactor over total rewrite unless the current code is unusable
- Reuse existing components/styles where helpful
- Keep code modular and readable
- Use TypeScript if the existing project already uses it; if not, keep the project’s current language consistent
- Do not break existing mock-phone layout
- Do not hardcode English-only assumptions
- Do not overcomplicate with unnecessary abstractions
- Optimize for a polished hackathon demo that also feels like a real product

Now inspect the existing repository and implement this refactor end-to-end.