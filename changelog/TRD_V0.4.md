你现在要接手并重构一个已经在开发中的 Hackathon 项目，项目名叫 Cue。

先不要直接开写代码。请先完整阅读仓库，理解现有前后端结构、页面流转、状态管理、接口契约和样式体系，然后基于我提供的 V0.4 产品规格做一次“有策略的重构”，而不是无脑推翻重写。

====================
项目背景 / 目标
====================

Cue 是一个面向学生的 AI 学习与口语练习 App。

这个项目现在已经从“单一口语考试模拟器”升级为双模式产品：

1. Learn
2. Speak

以及一个隐藏的中间层：

3. Bridge

整体逻辑是：

- Learn：先帮助用户理解一个 topic / material / idea / character，形成知识和观点
- Bridge：把 Learn 中聊出来的内容整理成可说出口的 speaking-ready recap
- Speak：按更接近口语考试 / 课堂表达的方式进行练习、获得反馈并 Take 2

一句话理解：
这个产品不是单纯“练口语”，而是先帮助用户知道自己要说什么，再帮助用户把它说出来。

====================
这次重构的核心目标
====================

1. 把产品从“偏 Web 的功能页 / 表单页 / dashboard 感”重构成“更像原生 App 的学习流”
2. 首页只保留两个主入口：Learn 和 Speak
3. Learn 要支持兴趣驱动的 topic exploration，而不是只限于考试内容
4. Learn 结束后必须能生成 Bridge，并能一键进入 Speak
5. Speak 保留更强的口语练习属性：speaking plan、hint level、review、Take 2
6. 前后端接口契约要跟新的产品流对齐
7. 即使没有真实 AI / STT / TTS / OCR 凭证，也必须完整跑通 mock demo
8. 保留现有项目里能复用的代码、视觉资产、组件和工程结构，避免不必要的大爆破式重写

====================
我对你这次工作的要求
====================

你必须按下面的顺序工作：

### 第一步：先读仓库，再输出理解
先检查整个 repo，然后告诉我：

1. 当前 frontend 和 backend 的技术栈
2. 当前目录结构
3. 哪些页面 / 组件 / hooks / services 可以复用
4. 哪些页面 / 组件 / 数据流必须重构
5. 哪些后端接口还能沿用，哪些需要新增或改造
6. 你建议采用“增量重构”还是“局部重写 + 逐步替换”，并说明原因

这一阶段先不要大改代码，先给我一个清晰的实施计划。

### 第二步：按阶段实施，不要一次性乱改
请优先按这个顺序推进：

Phase 1:
- 首页信息架构和页面层级重构
- 建立 Learn / Speak 两条主入口
- 去掉旧的 Web dashboard/form 感首页结构

Phase 2:
- Learn flow
- Learn session 页面
- Bridge 页面
- Learn -> Bridge -> Speak 的流转打通

Phase 3:
- Speak flow 重构
- Prep / Practice / Review / Take 2
- 替换旧的连续 assist slider
- 压缩成更清晰的口语练习体验

Phase 4:
- 后端接口适配
- mock mode 补齐
- i18n / language model 整理
- README 和 .env.example 更新

### 第三步：每做完一个阶段都简短汇报
每个阶段完成后，请说明：
- 改了哪些文件
- 为什么这么改
- 下一阶段准备做什么

====================
必须遵守的产品约束
====================

1. 首页只能有两个主入口：
- Learn
- Speak

2. Bridge 不是首页入口
Bridge 是 Learn 的收口层，只在 Learn 结束或用户触发“Practice this topic”时出现

3. Learn 不能做成纯自由聊天机器人
它要支持兴趣驱动的 topic exploration，但必须有结构化积累，便于后续生成 Bridge

4. Speak 仍然是强任务导向
它不是闲聊页面，而是口语表达练习页面

5. 所有 UI 文案必须支持国际化
并且区分：
- uiLanguage
- sourceLanguage
- targetLanguage

6. 不能硬编码成只支持英语
targetLanguage 默认可以是英语，但架构上必须支持任意目标语言

7. 必须支持 mock mode
没有真实 API key 时，前后端依然要可演示、可点击、可流转

====================
必须避免的旧问题
====================

这次重构最重要的一点，是不要继续保留旧版本里这些体验问题：

- 首页像 dashboard
- 首页像大型表单页
- 首页上出现一堆同等级卡片和配置项
- 首页以 4 个分类大卡片作为主结构
- 页面到处都是同等级按钮
- Speak 页面像 teleprompter dashboard
- 旧的连续 assist slider 继续保留
- Learn 做成 generic chatbot clone
- Bridge 做成文字墙
- Review 只炫图，不给 actionable fixes
- UI 很炫但主任务不清晰
- 太 Web，而不是 App

====================
视觉 / 交互方向
====================

请保留现有项目中这些有价值的东西（如果仓库里已有）：
- mobile-in-web mock phone
- dark mode / cyberpunk-ish modern aesthetic
- native-like motion
- polished transitions
- neon accent
- 适度玻璃拟态 / premium feel

但要做这些优化：
- 页面层级更清晰
- 字更克制
- glow 更节制
- 每屏只保留一个主任务
- 交互更像原生 App，而不是网页表单
- 更少的大块配置项
- 更少的一屏信息堆叠
- CTA 层级更明确

====================
产品流要求
====================

最终产品应该支持这两条主路径：

### Path A
Home -> Learn -> Bridge -> Speak Prep -> Speak Practice -> Speak Review

### Path B
Home -> Speak Prep -> Speak Practice -> Speak Review

Learn 是为了先理解 topic、形成观点。  
Speak 是为了把内容说出来。  
Bridge 负责把 Learn 的内容转成 speaking-ready recap。

====================
实现要求
====================

1. 优先复用已有代码
2. 不要为了“重构”而把一切重写
3. 只有在旧代码非常不适合时，才替换为新实现
4. 保持代码模块化、清晰、可维护
5. 不要引入不必要的复杂依赖
6. 如果现有项目已经使用 TypeScript，就继续保持；如果不是，就保持现有语言风格一致
7. 不要破坏现有 mock phone 基本布局
8. 不要把英语写死
9. 不要过度工程化
10. 以“可赢 Hackathon 的 polished demo + 像真产品的逻辑一致性”为目标

====================
你需要交付的内容
====================

1. 更新后的 frontend 代码
2. 更新后的 backend 代码
3. 新增或修改后的 types / schemas / services / stores
4. mock mode 所需的兜底逻辑
5. .env.example
6. README 更新，说明：
   - 如何启动前后端
   - mock mode 如何工作
   - 真正 API key 放在哪里
   - Learn -> Bridge -> Speak 的新架构

====================
开始工作的方式
====================

请先执行下面这件事：

1. 检查 repo
2. 总结当前代码结构
3. 标出“可复用”和“必须重构”的部分
4. 给出一个分阶段实施计划

在完成这一步之前，不要直接开始大规模改代码。

====================
V0.4 产品规格（请以此为准）
====================

You are a senior full-stack engineer refactoring an existing hackathon app called “Cue”.

The existing repository already has:
- frontend/ and backend/ root folders
- frontend stack: React + TailwindCSS + Framer Motion + react-i18next
- backend stack: Node.js + Express
- planned AI integrations: Gemini + Google STT/TTS + OCR
- current visual direction: mobile-first, mock-phone container, cyberpunk dark mode, polished native-like motion
- requirement that API keys must live in .env and the app must still work in mock mode when keys are missing

Your job is to refactor the product into Cue V0.4.

================================
PRODUCT V0.4 CORE IDEA
================================

Cue is no longer only an oral exam simulator.

Cue V0.4 has 2 user-facing modes:

1. Learn
2. Speak

And 1 hidden transition layer:

3. Bridge

Core product logic:
- Learn = understand a topic, idea, material, or character in a more natural, lower-pressure way
- Bridge = convert what the user learned into speaking-ready material
- Speak = practice giving an oral answer in a more exam-style structure

Important:
- Learn and Speak are both visible on the home screen
- Bridge is NOT a top-level home entry
- Bridge should appear as the structured end state of Learn, then provide a one-tap entry into Speak

One-line product summary:
Cue helps students first understand what they want to say, then practice saying it well.

================================
KEY PRODUCT PRINCIPLES
================================

1. Learn should be interest-led, not exam-only
Do NOT restrict Learn mode to only exam prompts.
Users should be able to explore interesting topics, characters, ideas, or uploaded materials.

2. Output must still be useful for speaking
Even if Learn starts from curiosity, it must end in a structured, speaking-ready recap.

3. Speak is still exam-oriented
Speak mode is where the user rehearses an answer using a speaking plan, hint levels, and review.

4. Home should feel app-like, not web-like
Do not build a settings-heavy dashboard or a form-heavy landing page.

5. One main action per screen
Avoid multiple competing CTAs.

================================
LANGUAGE MODEL
================================

The app must support three different language concepts:

1. uiLanguage
- the app interface language
- defaults to browser/system language
- user can manually change it

2. sourceLanguage
- the language the user is most comfortable thinking/learning in
- often same as uiLanguage, but editable

3. targetLanguage
- the language the user wants to practice speaking
- defaults to English, but must support arbitrary target languages

Important behavior:
- Learn mode can primarily use sourceLanguage
- Learn mode should optionally support different language support styles:
  - native_first
  - mixed
  - target_first
- Speak mode should primarily use targetLanguage
- Review should prioritize targetLanguage output
- All UI strings must go through i18n
- Do NOT hardcode English-only assumptions anywhere

================================
TOP-LEVEL APP STRUCTURE
================================

Visible top-level screens:
1. Home
2. Learn Session
3. Learn Bridge
4. Speak Prep
5. Speak Practice
6. Speak Review

User-facing mental model:
- Learn
- Speak

Product flow options:
A. Home -> Learn Session -> Learn Bridge -> Speak Prep -> Speak Practice -> Speak Review
B. Home -> Speak Prep -> Speak Practice -> Speak Review

Bridge is part of Learn flow, not a home mode.

================================
HOME SCREEN SPEC
================================

Goal:
Make the app feel like a focused mobile app, not a web form or feature dashboard.

Home should have exactly 2 main entry cards:
1. Learn a topic
2. Practice an answer

Suggested copy:
- Learn a topic
  Explore an idea, material, or character before you speak.
- Practice an answer
  Turn a prompt into a speaking plan and rehearse it.

Do NOT use:
- Roleplay Mode
- Exam Mode
- Dashboard-like category grids
- 4 large task-type tiles as the primary home pattern

Home may also contain:
- Continue last session (if exists)
- Recent sessions (compact, secondary)
- Language quick summary (compact)
- settings icon

Compact language summary example:
- Learning: Chinese
- Speaking: English

This should not be a giant settings card.
It should be compact and native-like.

Home visual rules:
- clean hierarchy
- 2 large main cards only
- recent history lower on the page
- one focal CTA area per main card
- not too many glowing elements

================================
LEARN MODE SPEC
================================

Learn mode should allow interest-led exploration.

The user can start Learn mode by:
- typing a topic
- uploading an image/material
- speaking an idea/question
- choosing a suggested character/topic prompt
- optionally choosing a role/persona to talk to

Examples:
- Talk to Dolly the Sheep about cloning
- Ask a scientist about nuclear energy
- Discuss Van Gogh with an art guide
- Explore a historical event
- Understand a social issue

Important:
Learn mode should NOT be a totally unbounded chatbot.
It must stay structured enough to produce a useful bridge.

Learn mode input model:
{
  "topicOrMaterial": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "supportMode": "native_first" | "mixed" | "target_first",
  "persona": {
    "type": "character" | "expert" | "guide" | "none",
    "name": "Dolly the Sheep"
  }
}

Learn session behavior:
- primarily conversational
- lower pressure
- optimized for understanding and viewpoint formation
- can ask guiding questions
- can explain concepts
- can help user clarify opinions
- should gradually collect structured knowledge behind the scenes

Learn session should keep track of:
- topic
- important facts
- key viewpoints
- useful target-language terms
- possible exam-style question angles

The user can stay in Learn and continue chatting.

At any time, offer a subtle CTA:
- Turn this into speaking practice
- Build a speaking recap
- Practice this topic

================================
LEARN BRIDGE SPEC
================================

Bridge is the structured “speaking-ready recap” that appears after Learn.

Bridge is mandatory in the Learn flow.
It is not optional if the user chooses “practice this topic”.

Bridge page goal:
Transform “I understand this topic” into “I can speak about this topic”.

Bridge output must include:
1. topic summary
2. 3 key facts
3. 2 viewpoints / pros and cons / tensions
4. 3 useful target-language terms
5. 1 speaking angle or opinion frame
6. 1 suggested oral practice question

Example structure:
{
  "topicTitle": "Dolly the Sheep and cloning",
  "summary": "...",
  "keyFacts": [
    "...",
    "...",
    "..."
  ],
  "viewpoints": [
    "...",
    "..."
  ],
  "targetTerms": [
    "...",
    "...",
    "..."
  ],
  "speakingAngle": "...",
  "practiceQuestion": "..."
}

Bridge CTA buttons:
- Continue exploring
- Practice this topic

If the user clicks Practice this topic:
- go directly into Speak Prep
- reuse the bridge output as input context
- do NOT send the user back to Home

================================
SPEAK MODE SPEC
================================

Speak mode remains closer to the earlier oral-exam workflow.

Speak mode has 3 stages:
1. Prep
2. Practice
3. Review

--------------------------------
SPEAK PREP
--------------------------------

Input sources:
- direct prompt input from Home
- uploaded image/material
- voice/text description
- bridge output from Learn

Prep goal:
Generate a concise speaking plan, not long study notes.

Prep output:
- prompt summary
- 3-part speaking plan
- keyword per section
- optional short sourceLanguage support text
- round goal

3-part speaking plan format:
- opening
- main point
- example or conclusion

Example:
{
  "promptSummary": "...",
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

Prep UI rules:
- compact prompt summary
- 3-part speaking plan card
- secondary action: Preview plan
- main action: Start speaking
- regenerate is low priority, not a giant CTA
- hidden-by-default support text
- one main CTA only

--------------------------------
SPEAK PRACTICE
--------------------------------

Practice goal:
Get the user speaking quickly.

Replace the old continuous slider with a 4-state segmented hint control:
- Outline
- Phrases
- Keywords
- Off

Default:
- first round: Phrases
- second round: Keywords recommended
- user may manually override

Practice screen must include:
- round indicator
- compact prompt strip
- compact hint level control
- lightweight hint panel
- one recording zone
- optional live guidance chip

Hint panel rules:
- max 3 hints visible
- each hint max 1–2 lines
- not large stacked bilingual cards

Recording states:
- idle
- recording
- processing

Example labels:
- Start answering
- Listening...
- Analyzing...

Optional live guidance chip examples:
- On track
- Add one example
- Wrap it up
- Be more direct

Do NOT:
- show both a giant center start button and a bottom start button
- show large “Conversation Mode” hero text
- overexpose sourceLanguage

--------------------------------
SPEAK REVIEW
--------------------------------

Review goal:
Provide actionable coaching and make the user want to try again.

Review output order:
1. one-line summary
2. top 3 actionable fixes
3. Better Version
4. Top Version
5. optional compact scores
6. sticky Take 2 CTA

Top 3 fixes must be specific action statements, for example:
- Start with your opinion earlier.
- Add one concrete example.
- End with a stronger conclusion.

Better Version:
- close to learner level
- short enough to imitate
- audio playable

Top Version:
- more advanced
- secondary
- audio playable

Review output example:
{
  "summary": "Clear ideas, but your answer still sounds translated.",
  "topIssues": [
    "Start with your opinion earlier.",
    "Add one concrete example.",
    "End with a stronger conclusion."
  ],
  "betterVersion": {
    "text": "...",
    "audioUrl": "..."
  },
  "topVersion": {
    "text": "...",
    "audioUrl": "..."
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

Take 2 behavior:
- return to Speak Practice
- keep same prompt/session context
- use updated hint recommendation
- do not force user back through Home

================================
FRONTEND IMPLEMENTATION REQUIREMENTS
================================

Use the existing frontend stack unless the repo clearly uses something else:
- React
- TailwindCSS
- Framer Motion
- react-i18next
- lucide-react
- clsx + tailwind-merge if needed
- Zustand or existing lightweight state solution

Preserve:
- mock phone shell
- polished native-like animation
- cyberpunk dark mode feel

But simplify:
- less web-form feeling
- less dashboard feeling
- less giant glowing UI everywhere
- less verbose stacked content

Key visual rules:
- one focal glowing element per screen
- compact typography
- short headlines
- strong spacing hierarchy
- sticky CTA where appropriate
- app-like bottom sheets and compact controls
- fewer huge cards on a single screen

Recommended frontend structure:

frontend/src/
  app/
    router.tsx
    providers.tsx
    store/
      appStore.ts
      sessionStore.ts
      settingsStore.ts
  components/
    common/
      AppShell.tsx
      Header.tsx
      LanguageSummary.tsx
      SegmentedControl.tsx
      StickyCTA.tsx
      AudioPlayer.tsx
      BottomSheet.tsx
      LoadingState.tsx
    home/
      ModeEntryCard.tsx
      ContinueCard.tsx
      RecentSessionList.tsx
    learn/
      LearnComposer.tsx
      PersonaPicker.tsx
      SupportModePicker.tsx
      LearnChatThread.tsx
      LearnInputBar.tsx
      BridgeSummaryCard.tsx
      KeyFactsCard.tsx
      ViewpointCard.tsx
      TargetTermsCard.tsx
      PracticeQuestionCard.tsx
    speak/
      PromptInputCard.tsx
      PromptSummaryCard.tsx
      SpeakingPlanCard.tsx
      HintPanel.tsx
      RecordingZone.tsx
      ReviewSummaryCard.tsx
      ActionFixList.tsx
      BetterVersionCard.tsx
      TopVersionCard.tsx
      ScoreMiniChart.tsx
  pages/
    HomePage.tsx
    LearnPage.tsx
    BridgePage.tsx
    SpeakPrepPage.tsx
    SpeakPracticePage.tsx
    SpeakReviewPage.tsx
  lib/
    api.ts
    i18n.ts
    media.ts
    audio.ts
    ocr.ts
    utils.ts
  locales/
    en/
    zh-CN/
    fr/
    de/
    es/
  types/
    app.ts
    api.ts
    learn.ts
    speak.ts

================================
BACKEND CHANGES REQUIRED
================================

Yes, backend changes are required.

Reason:
The old backend only supported the speaking workflow.
V0.4 needs:
- Learn session generation and continuation
- Bridge output generation
- dual-path entry into Speak
- language support modes
- richer session persistence
- stable mock mode for all new flows

Use Express and preserve the current backend style.
Update/add endpoints instead of rewriting the whole architecture unless necessary.

Recommended backend structure:

backend/src/
  server.ts
  app.ts
  routes/
    home.routes.ts
    input.routes.ts
    learn.routes.ts
    bridge.routes.ts
    speak.routes.ts
    review.routes.ts
    audio.routes.ts
    session.routes.ts
  controllers/
    input.controller.ts
    learn.controller.ts
    bridge.controller.ts
    speak.controller.ts
    review.controller.ts
    audio.controller.ts
    session.controller.ts
  services/
    gemini.service.ts
    stt.service.ts
    tts.service.ts
    ocr.service.ts
    session.service.ts
    mock.service.ts
  prompts/
    learn.prompt.ts
    bridge.prompt.ts
    speakPlan.prompt.ts
    review.prompt.ts
  schemas/
    learn.schema.ts
    bridge.schema.ts
    speak.schema.ts
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

================================
NEW / UPDATED BACKEND ENDPOINTS
================================

1. POST /api/input/analyze
Purpose:
Normalize multimodal input.

Input:
{
  "text": "... optional ...",
  "imageBase64": "... optional ...",
  "audioBase64": "... optional ...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en"
}

Output:
{
  "extractedText": "...",
  "promptSummary": "...",
  "detectedSourceLanguage": "zh-CN"
}

Use OCR/STT if available, otherwise mock.

--------------------------------
2. POST /api/learn/start
--------------------------------
Purpose:
Start a Learn session.

Input:
{
  "topicOrMaterial": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "supportMode": "native_first",
  "persona": {
    "type": "character",
    "name": "Dolly the Sheep"
  }
}

Output:
{
  "learnSessionId": "learn_xxx",
  "title": "Dolly the Sheep and cloning",
  "openingMessage": "...",
  "suggestedQuestions": [
    "...",
    "...",
    "..."
  ],
  "supportMode": "native_first"
}

--------------------------------
3. POST /api/learn/message
--------------------------------
Purpose:
Continue a Learn session.

Input:
{
  "learnSessionId": "learn_xxx",
  "message": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "supportMode": "native_first"
}

Output:
{
  "assistantMessage": "...",
  "collectedState": {
    "keyFacts": ["..."],
    "viewpoints": ["..."],
    "targetTerms": ["..."],
    "possibleQuestionAngles": ["..."]
  },
  "canBridge": true
}

Important:
This endpoint should keep internally accumulating structured learning state.

--------------------------------
4. POST /api/bridge/generate
--------------------------------
Purpose:
Generate speaking-ready recap from a Learn session.

Input:
{
  "learnSessionId": "learn_xxx",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en"
}

Output:
{
  "bridgeId": "bridge_xxx",
  "topicTitle": "...",
  "summary": "...",
  "keyFacts": [
    "...",
    "...",
    "..."
  ],
  "viewpoints": [
    "...",
    "..."
  ],
  "targetTerms": [
    "...",
    "...",
    "..."
  ],
  "speakingAngle": "...",
  "practiceQuestion": "..."
}

--------------------------------
5. POST /api/speak/prepare
--------------------------------
Purpose:
Enter Speak Prep either from Home direct input or from Bridge.

Input option A: direct
{
  "entryType": "direct",
  "taskInput": {
    "text": "... optional ...",
    "imageBase64": "... optional ...",
    "audioBase64": "... optional ..."
  },
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en"
}

Input option B: from bridge
{
  "entryType": "bridge",
  "bridgeId": "bridge_xxx",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en"
}

Output:
{
  "speakSessionId": "speak_xxx",
  "promptSummary": "...",
  "taskType": "answer_prompt",
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

--------------------------------
6. POST /api/audio/preview
--------------------------------
Purpose:
Generate preview audio for speaking plan or review versions.

Input:
{
  "mode": "plan" | "better_version" | "top_version",
  "text": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en"
}

Output:
{
  "audioUrl": "...",
  "transcript": "..."
}

--------------------------------
7. POST /api/speak/submit
--------------------------------
Purpose:
Submit speaking attempt.

Input:
{
  "speakSessionId": "speak_xxx",
  "round": 1,
  "hintLevel": "phrases",
  "audioBase64": "... optional ...",
  "transcript": "... optional ..."
}

Output:
{
  "attemptId": "attempt_xxx",
  "transcript": "...",
  "durationSec": 34
}

--------------------------------
8. POST /api/review/generate
--------------------------------
Purpose:
Generate review after speaking attempt.

Input:
{
  "speakSessionId": "speak_xxx",
  "attemptId": "attempt_xxx",
  "promptSummary": "...",
  "speakingPlan": [...],
  "transcript": "...",
  "sourceLanguage": "zh-CN",
  "targetLanguage": "en",
  "round": 1
}

Output:
{
  "summary": "...",
  "topIssues": [
    "...",
    "...",
    "..."
  ],
  "betterVersion": {
    "text": "...",
    "audioUrl": "..."
  },
  "topVersion": {
    "text": "...",
    "audioUrl": "..."
  },
  "scores": {
    "fluency": 72,
    "vocabulary": 68,
    "pronunciation": 74,
    "structure": 80
  },
  "take2Goal": "...",
  "recommendedHintLevel": "keywords"
}

--------------------------------
9. POST /api/speak/take2
--------------------------------
Purpose:
Prepare next round using prior context.

Input:
{
  "speakSessionId": "speak_xxx",
  "previousRound": 1,
  "recommendedHintLevel": "keywords"
}

Output:
{
  "speakSessionId": "speak_xxx",
  "nextRound": 2,
  "hintLevel": "keywords",
  "take2Goal": "..."
}

================================
PROMPT / MODEL RULES
================================

Learn prompt rules:
- prioritize understanding and viewpoint formation
- stay on the selected topic/material
- support persona style, but do not become pure entertainment
- gradually collect structured knowledge
- support sourceLanguage/targetLanguage and supportMode
- avoid drifting into irrelevant free chat

Bridge prompt rules:
- produce concise, structured, speaking-ready recap
- exactly 3 key facts
- exactly 2 viewpoints or tensions
- exactly 3 target-language terms
- exactly 1 speaking angle
- exactly 1 practice question

Speak plan prompt rules:
- produce exactly 3 plan sections
- optimize for speakability, not essay style
- respect targetLanguage level
- avoid over-complex vocabulary
- allow brief supportText in sourceLanguage

Review prompt rules:
- produce exactly 1 short summary
- produce exactly 3 action-oriented issues
- produce 1 Better Version
- produce 1 Top Version
- produce 1 take2Goal
- optionally produce 4 scores
- avoid vague praise and long issue lists

================================
TYPE DEFINITIONS
================================

Create shared types where possible.

type SupportMode =
  | "native_first"
  | "mixed"
  | "target_first";

type HintLevel =
  | "outline"
  | "phrases"
  | "keywords"
  | "off";

type PersonaType =
  | "character"
  | "expert"
  | "guide"
  | "none";

type SpeakingPlanItem = {
  id: "opening" | "point_1" | "point_2_or_conclusion";
  text: string;
  keyword: string;
  supportText?: string;
};

type BridgeResponse = {
  bridgeId: string;
  topicTitle: string;
  summary: string;
  keyFacts: string[];
  viewpoints: string[];
  targetTerms: string[];
  speakingAngle: string;
  practiceQuestion: string;
};

type SpeakPrepareResponse = {
  speakSessionId: string;
  promptSummary: string;
  taskType: string;
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

================================
STATE MANAGEMENT REQUIREMENTS
================================

Maintain persistent session state for:
- uiLanguage
- sourceLanguage
- targetLanguage
- current mode
- learnSession
- bridgeData
- speakSession
- latest review
- recent sessions

Learn session state should include:
- topic title
- persona
- supportMode
- chat history
- collected keyFacts
- collected viewpoints
- collected targetTerms
- possible question angles

Speak session state should include:
- promptSummary
- speakingPlan
- round
- hintLevel
- latestAttempt
- latestReview

================================
MOCK MODE REQUIREMENTS
================================

This is critical.

The entire product must work without real external credentials.

If Gemini / STT / TTS / OCR are missing:
- do not crash
- return deterministic mock data
- keep Home, Learn, Bridge, Speak, Review fully demo-able

Mock requirements:
- realistic Learn opening messages
- realistic persona replies
- realistic Bridge summaries
- realistic speaking plans
- realistic review output
- fake or local audio URLs
- optional seeded mock responses for repeatability

Add TODO comments where real provider integration belongs.
Never hardcode secrets.
Provide .env.example files.

================================
I18N REQUIREMENTS
================================

All static UI strings must be localized.

Provide at least:
- en
- zh-CN
- fr
- de
- es

Persist uiLanguage selection locally.
Keep uiLanguage separate from sourceLanguage and targetLanguage.

================================
UX / DESIGN EXECUTION RULES
================================

Important:
The current design feels too web-like when it looks like:
- a dashboard
- a form
- a category grid
- a page full of same-priority cards

Refactor toward a native-feeling mobile product.

Rules:
- Home = 2 clear main entry cards
- Learn = chat-like but focused
- Bridge = structured recap card layout
- Speak = compact, high-focus rehearsal UI
- Review = actionable coaching with sticky Take 2

Do NOT:
- use 4 large category tiles as primary home structure
- make Learn look like a generic chatbot clone
- make Bridge a text wall
- make Speak look like a teleprompter dashboard
- overuse giant glow, giant headings, or huge empty hero areas

Keep:
- mock phone shell
- premium cyberpunk-dark feel
- tasteful neon accent
- Framer Motion page transitions
- compact glassy surfaces if useful

================================
ACCEPTANCE CRITERIA
================================

The refactor is complete when:

1. Home has 2 main modes:
- Learn
- Speak

2. Learn mode supports:
- text / voice / image / material input
- optional persona
- support mode selection
- structured conversational exploration
- transition into Bridge

3. Bridge supports:
- summary
- 3 key facts
- 2 viewpoints
- 3 target-language terms
- 1 speaking angle
- 1 practice question
- CTA into Speak

4. Speak mode supports:
- prepare
- preview
- practice
- 4-level hint control
- review
- Take 2

5. Backend supports the new contracts

6. Everything works in mock mode without credentials

7. Language system supports uiLanguage, sourceLanguage, and targetLanguage separately

================================
DELIVERABLES
================================

Please produce:

1. Updated frontend code in frontend/
2. Updated backend code in backend/
3. New shared types/schemas/utils as needed
4. .env.example files
5. Updated README with:
- how to run frontend/backend
- how mock mode works
- where to place real API keys
- summary of Learn -> Bridge -> Speak architecture

================================
IMPLEMENTATION NOTES
================================

- Prefer incremental refactor over unnecessary full rewrite
- Reuse existing code and styles where useful
- Keep the result polished enough for a hackathon demo, but product-coherent enough to feel real
- Optimize for clarity, flow, and demo quality
- Do not build unnecessary enterprise complexity
- Inspect the existing repository first, then implement the V0.4 refactor end-to-end

====================
额外说明
====================

如果你发现现有仓库与 V0.4 spec 有冲突：
- 优先保留可复用的工程资产
- 但产品流和信息架构以 V0.4 为准

如果你发现某个功能在短时间内难以完整接入真实 AI 服务：
- 先实现完整 mock flow
- 再为真实接入预留清晰的 service TODO

现在请先从“阅读仓库并输出重构计划”开始。