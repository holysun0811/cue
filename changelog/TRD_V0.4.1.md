Continue from the current Cue V0.4 branch and make concrete code changes now.

Do not stop at planning.
Do not only describe what you will do.
Modify the codebase directly.

This task has 3 high-priority goals:

1. Remove current mock data usage and switch the app to real API calls
2. Fix the Learn entry bug so Learn mode always starts from the topic-creation flow instead of incorrectly jumping into the last Dolly session
3. Restyle the UI to be much closer to the existing app style shown in the reference screenshot, while keeping the V0.4 product logic and information architecture

================================
IMPORTANT PRODUCT CONSTRAINT
================================

Keep the V0.4 logic and flow:
- Home has 2 main entries: Learn and Speak
- Learn -> Bridge -> Speak
- Speak = Prep -> Practice -> Review
- Bridge is not a home-level mode
- Learn is interest-led but can bridge into speaking practice

Only change:
- data source behavior
- Learn entry behavior
- UI style / visual system

Do NOT revert back to the old Roleplay/Exam product logic.
Do NOT change the V0.4 information architecture.
Do NOT reintroduce dashboard-like or web-form-heavy layouts.

================================
TASK 1 — REMOVE MOCK DATA, USE REAL API CALLS
================================

Current problem:
The current implementation still relies on mock data / fake generated Learn sessions / mock recap / mock speaking session.

Required outcome:
The app should use real backend API calls instead of front-end mock content.

Do this:

1. Audit all current mock data usage in frontend and backend
Find and remove or replace:
- hardcoded fake Learn topics
- hardcoded Dolly conversation bootstrap
- hardcoded Bridge recap content
- hardcoded speaking plan data
- hardcoded review output
- fake local session generators used in normal flow

2. Frontend must call real APIs for production flow
Use actual API calls for:
- /api/input/analyze
- /api/learn/start
- /api/learn/message
- /api/bridge/generate
- /api/speak/prepare
- /api/audio/preview
- /api/speak/submit
- /api/review/generate
- /api/speak/take2

3. Backend must provide real implementations for these routes
If any of these routes are still missing, incomplete, or only returning fake seeded objects, implement them properly.

4. Remove mock-driven happy path from normal user flow
The normal app flow should no longer depend on mock data.
Loading states and error states must still exist.

5. Keep developer-safe fallbacks only where necessary
Do NOT keep visible fake content in normal use.
If credentials are missing, backend should fail gracefully with clear errors, or use a clearly isolated provider fallback layer only if absolutely necessary.
But the frontend should not display fake placeholder learning sessions as the main flow anymore.

6. Update API client layer
Clean up the client/API wrappers so all Learn / Bridge / Speak flows use consistent real request/response contracts.

Acceptance for Task 1:
- Starting Learn creates a real learn session through backend
- Sending a Learn message uses backend response
- Generating Bridge uses backend response
- Preparing Speak uses backend response
- Review and Take 2 use backend response
- No visible hardcoded mock content remains in the main product flow

================================
TASK 2 — FIX LEARN ENTRY BUG
================================

Current bug:
Clicking Learn mode often skips the topic creation page and directly enters the Dolly conversation.
This seems to happen after the first session because the app keeps reopening a previous learn session.

Required product behavior:
Clicking the main Learn entry from Home must ALWAYS take the user to the Learn creation/composer page for starting a new topic.

Only explicit “continue” actions should reopen an existing Learn session.

Implement this behavior:

1. Separate “start new Learn session” from “continue existing Learn session”
- Main Learn card on Home => always route to new Learn composer screen
- Continue card / recent session card => route to existing Learn session
- Do not auto-resume previous Learn session when user taps the main Learn entry

2. Add a dedicated Learn creation/start screen behavior
The Learn entry page must let the user:
- enter topic/material
- optionally upload image/material
- optionally choose persona
- choose support mode
- then explicitly start the Learn session

3. Fix state/routing bug
Inspect current routing/store/session restoration logic.
Likely causes:
- persistent last learnSessionId auto-hydrating into LearnPage
- LearnPage treating “has last session” as “resume immediately”
- route guard or initial effect redirecting to active session

Fix it so:
- /learn or the main Learn entry = new topic creation flow
- /learn/:sessionId or explicit continue action = existing session
- no silent auto-redirect into Dolly or prior sessions

4. Preserve recent sessions / continue behavior
Recent Learn sessions can still be shown on Home, but tapping them should be a deliberate resume path, separate from “Learn”.

Acceptance for Task 2:
- Every time the main Learn entry is tapped, the user lands on the topic creation flow
- Existing sessions are only reopened from explicit continue/recent actions
- The Dolly auto-entry bug is gone

================================
TASK 3 — RESTYLE UI TO MATCH EXISTING APP STYLE
================================

Current problem:
The current V0.4 UI is still too visually novel and too different from the existing app style.
For the hackathon, the final concept should feel like it could realistically land inside the current product.

Important:
Only use the reference screenshot for STYLE DIRECTION.
Keep the V0.4 product logic, screen architecture, and flows.

Reference style characteristics to adopt:
- lighter, calmer canvas
- soft card-based interface
- rounded white / light-gray surfaces
- subtle shadows instead of heavy neon glow
- modern but less futuristic
- purple / blue gradient accents used sparingly
- cleaner, more grounded app aesthetic
- more “shipping product” and less “concept cyberpunk prototype”

Do this:

1. Replace the current heavy cyberpunk / dark neon emphasis
Reduce or remove:
- strong neon glow around many elements
- overly dark black backgrounds as the default
- aggressive glassmorphism everywhere
- overly futuristic control styling
- too much visual drama on every card

2. Move toward the style of the reference screenshot
Adopt:
- light background as main page canvas where appropriate
- soft, rounded cards
- clearer spacing
- calmer typography
- slightly playful but production-ready gradients
- subtle colored accents for primary modes/actions
- cleaner icon containers
- friendlier but still premium feel

3. Keep mobile-app feeling
Preserve:
- mock phone shell
- native-like page transitions
- polished interactions
- sticky CTA where needed

4. Update Home page style
Home should visually align much more closely with the reference screenshot:
- two large main mode cards: Learn and Speak
- compact language summary
- recent sessions lower on the page
- optional top greeting / lightweight stats can exist only if they fit naturally
- avoid making it look like a dashboard clone, but do align its visual tone to the screenshot

5. Update Learn / Bridge / Speak pages to the same visual family
Need a consistent visual system across:
- Home
- Learn composer / Learn chat
- Bridge
- Speak Prep
- Speak Practice
- Speak Review

That means:
- same card radius language
- same spacing rhythm
- same typography tone
- same button shapes
- same accent usage
- less visual fragmentation

6. Replace overly custom controls with calmer productized patterns
Examples:
- segmented controls should feel more like production app pills
- input areas should feel like actual shipping UI, not concept renders
- cards should be softer and simpler
- emphasis should come from layout and hierarchy, not from glow

7. Do not copy the screenshot literally
Do NOT change the product back to Roleplay/Exam structure.
Do NOT copy the screenshot’s exact content or old logic.
Only adapt the style system.

Acceptance for Task 3:
- the app clearly looks closer to the current product family
- the visual tone is lighter, calmer, and more realistic
- V0.4 logic is preserved
- Learn / Bridge / Speak all feel like part of the same product family
- the UI no longer feels like a separate cyberpunk experiment

================================
IMPLEMENTATION PLAN TO EXECUTE NOW
================================

Please do the work in this order:

Phase A:
- inspect current code for mock usage + Learn auto-resume bug
- implement routing/state fix for Learn entry
- ensure main Learn entry always opens new topic creation flow

Phase B:
- replace frontend mock data paths with real API calls
- wire Learn / Bridge / Speak flows to real backend contracts
- implement missing backend routes/services if needed

Phase C:
- restyle the shared design system and affected screens
- update Home, Learn, Bridge, Speak pages into the lighter app style

Phase D:
- run validation
- fix broken imports/types/contracts
- provide a concise summary of changed files and what is working

================================
TECHNICAL REQUIREMENTS
================================

1. Reuse existing code where reasonable
- keep shared components if they can be restyled
- do not rewrite everything from scratch unless necessary

2. Keep route architecture aligned to V0.4
Expected route pattern:
- Home
- Learn entry / new topic page
- Learn session page
- Bridge page
- Speak prep
- Speak practice
- Speak review

3. Distinguish clearly:
- new Learn flow
- resumed Learn session flow

4. Use real API calls from the frontend
Do not keep silent front-end fake fallback content for normal flow.

5. Keep i18n intact
All new copy must remain localized.

6. Keep uiLanguage / sourceLanguage / targetLanguage model intact

================================
VALIDATION
================================

After implementation:
- run build
- run lint if available
- fix obvious runtime issues
- report:
  - files changed
  - what was removed from mock flow
  - how Learn entry bug was fixed
  - which API routes are now used
  - which UI primitives/screens were restyled

================================
START NOW
================================

Start coding now.
Do not pause after planning.
Make concrete file edits and continue until these 3 issues are resolved or you hit a real blocker.