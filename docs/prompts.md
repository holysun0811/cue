# Prompts

本文件梳理 Cue V0.4 当前版本里**所有送给 LLM 的 Prompt**，包括：
- 每条 Prompt 在前端的哪个页面 / 哪个场景下被触发；
- 对应的 API 路由与代码位置；
- 代码中写死的 Prompt 原文（逐字复制）；
- 当前 Prompt 的问题点评；
- 一份我建议的改进版 Prompt（可作为下一轮迭代的候选，非当前实现）。

本文件只梳理和建议，不修改代码。任何实际替换都必须另行评估，并尊重 `docs/handoff.md` 中「Do Not Revert These Decisions」一节。

---

## 0. Prompt 分布总览

- 所有 LLM Prompt 集中在 `backend/src/services/gemini.service.js` 一个文件内，共 **10 条主 Prompt + 2 条遗留 Prompt**。
- 前端（`frontend/src/**`）没有任何直接面向 LLM 的 Prompt；前端只有：
  - 本地化 UI 文案（`frontend/src/locales/*.json`）；
  - 本地启发式的 `persona` 建议（`LearnScreen.jsx` 的 `personaSuggestionsForTopic`）；
  - 本地化「推荐练习题」模板（`frontend/src/lib/practicePrompts.js`）——当前只在 Bridge 推荐题兜底时使用，不会进入 LLM。
- Mock fallback 文案集中在 `backend/src/services/mock.service.js`，在 `GEMINI_API_KEY` 缺失或 LLM 解析失败时被用作演示数据。它本身**不是 Prompt**，但许多 Prompt 的结构要求都与 mock 的形状一一对应。

Prompt 与 API/页面的对应关系：

| # | 函数 | API 路由 | 触发页面 / 场景 | 是否当前主路径 |
|---|------|----------|----------------|----------------|
| 1 | `analyzePromptInput` | `POST /api/input/analyze`（并在 `/api/speak/prepare` 内被二次调用） | ① LearnScreen 聊天附带图片；② PrepRoom Start Exam 设置页（文字 / 语音转写 / 图片三种源） | ✅ |
| 2 | `startLearnExploration` | `POST /api/learn/start` | LearnScreen 首次发送话题 / 材料后 | ✅ |
| 3 | `continueLearnExploration` | `POST /api/learn/message` | LearnScreen 已有会话里继续发消息 | ✅ |
| 4 | `generateBridgeRecap` | `POST /api/bridge/generate` | LearnScreen 点击 Recap 条目进入 Bridge | ✅ |
| 5 | `buildSpeakingPlan` | `POST /api/speak/prepare`（兼带 `POST /api/plan`） | PrepRoom 载入、从 Bridge 选题跳转、切换自定义思路 | ✅ |
| 6 | `generateExaminerPrompt` | `POST /api/speak/prepare` 内部 | PrepRoom 准备完成进入 StageScreen 前，生成考官首句文本与 TTS | ✅ |
| 7 | `generateExaminerFollowUp` | `POST /api/speak/submit` | StageScreen 每次发送回答后生成考官下一句 | ✅ |
| 8 | `generatePracticeHintData` | `POST /api/speak/submit` | StageScreen 每次发送回答后生成下一轮的 Phrase 提示 | ✅ |
| 9 | `generateSampleAnswer` | `POST /api/audio/preview` | PrepRoom 点击 sample answer 音频预听 | ✅ |
| 10 | `generateActionableReview` | `POST /api/review/generate` | ReviewScreen 打开后异步加载反馈 | ✅ |
| A1 | `streamCueCards` / `buildCuePrompt` | `POST /api/ai/cue-cards`（SSE） | 无（前端当前不再调用） | ❌ 遗留 |
| A2 | `rewriteSpeech` | `POST /api/ai/review` | 无（前端当前不再调用） | ❌ 遗留 |

说明：表中 1/5/6 三个 Prompt 都在一次 `/api/speak/prepare` 里被串联调用；7/8 都在一次 `/api/speak/submit` 里被调用。

---

## 1. `analyzePromptInput` — 归一化用户输入为练习题

- **文件**：`backend/src/services/gemini.service.js`，`analyzePromptInput()`
- **调用者**：
  - `backend/src/controllers/input.controller.js` → `POST /api/input/analyze`
  - `backend/src/controllers/speak.controller.js` 的 `prepareSpeak()` 内部
- **前端页面 / 场景**：
  - `LearnScreen`：当用户在 Learn 聊天里附带图片提交时，`App.jsx → startLearnFlow / sendLearnThought` 会先调一次 `/api/input/analyze`，把图片 / 文字归一化成 `extractedText` 与 `promptSummary`，再送入 `/api/learn/start` 或 `/api/learn/message`。
  - `PrepRoom` 的 Start Exam 设置页（`DirectExamSetup`）：不论选 typed prompt / spoken topic / material image，`App.jsx → createDirectSpeakSession` 都会先调一次 `/api/input/analyze` 拿到 `promptSummary`，再送入 `/api/speak/prepare`。
- **关键入参**：`taskType, appLanguage, targetLanguage, text, imageBase64?, audioBase64?`

### 当前 Prompt 原文

```text
You are Cue, a school oral-task rehearsal coach.
Normalize the user input into a concise task-ready prompt summary.

Task type: ${taskType}
App language: ${appLanguage}
Target language: ${targetLanguage}
Text input: ${text || '(none)'}
Image provided: ${imageBase64 ? 'yes, OCR is not available in this environment, infer only if text mentions it' : 'no'}
Audio provided: ${audioBase64 ? 'yes, transcript may be generated separately' : 'no'}

Return strict JSON:
{
  "promptSummary": "one concise practice prompt summary in targetLanguage",
  "detectedAppLanguage": "${appLanguage}",
  "extractedText": "normalized extracted text",
  "suggestedTaskType": "${taskType}"
}

Rules:
- Keep promptSummary short.
- Do not invent complex context.
- promptSummary should use targetLanguage because it may become the practice prompt.
- extractedText may preserve the user's material language when it is raw source material.
```

### 现状点评

- `promptSummary` 的「short」没有量化阈值，LLM 返回长度波动大，会直接变成考官首句的素材，过长会让 TTS 读起来累。
- 明确告知「OCR is not available」但却允许「infer only if text mentions it」——模型在无图像特征描述时仍会经常编造图片内容，是 Learn 图片上传流最容易露馅的地方。
- `suggestedTaskType` 被硬塞回原值，模型没有真正做分类，这个字段在当前流程里等同于 echo，语义上是冗余设计。
- 未区分「用户用 App 语言描述题目」和「材料本身就是 Target 语言」这两种常见情况。

### 建议改进版

```text
You are Cue's input normaliser for school oral-task rehearsal.
Your only job: turn the learner's raw input into a clean, short practice prompt.

Inputs:
- Task type hint: ${taskType}
- App language (learner's UI / explanation language): ${appLanguage}
- Target language (the language the learner will actually speak): ${targetLanguage}
- Text input: ${text || '(none)'}
- Image provided: ${imageBase64 ? 'yes — no OCR available, treat as unknown unless text describes it' : 'no'}
- Audio provided: ${audioBase64 ? 'yes — transcript already merged into text input' : 'no'}

Return strict JSON only:
{
  "promptSummary": "<= 30 words, written in ${targetLanguage}, one sentence, spoken-style, no meta labels",
  "extractedText": "cleaned source text; keep the original material language",
  "suggestedTaskType": "answer_prompt | describe_photo | summarize_text | short_presentation",
  "inputConfidence": "high | medium | low"
}

Hard rules:
- If no useful content is provided, set promptSummary to an empty string and inputConfidence to "low". Do NOT invent a topic.
- NEVER invent image content; if an image is attached but no descriptive text exists, rely only on generic wording.
- promptSummary must be directly speakable as one exam question, not a paragraph.
- extractedText is source-faithful: do not translate, only clean whitespace / OCR noise.
- Do not output explanations, markdown, code fences, or comments outside the JSON.
```

要点：① 强制字长与单句；② 明确在无法识别时输出空串而不是编造；③ `suggestedTaskType` 收窄到已知枚举并真正要求分类；④ 新增 `inputConfidence` 给前端一个「是否要提示用户补充」的信号。

---

## 2. `startLearnExploration` — 开启 Learn 会话

- **文件**：`backend/src/services/gemini.service.js`，`startLearnExploration()`
- **调用者**：`backend/src/controllers/learn.controller.js` → `POST /api/learn/start`
- **前端页面 / 场景**：`LearnScreen` 第一次发话题时触发（`App.jsx → startLearnFlow`）。
- **关键入参**：`topicOrMaterial, appLanguage, targetLanguage, persona`

### 当前 Prompt 原文

```text
You are Cue in Learn mode. Help a student understand a topic before speaking.

Topic or material:
${topicOrMaterial || '(none)'}

App language: ${appLanguage}
Target language: ${targetLanguage}
Persona: ${JSON.stringify(persona)}

Return strict JSON:
{
  "title": "short topic title",
  "openingMessage": "focused opening message for the learner",
  "suggestedQuestions": ["question 1", "question 2", "question 3"],
  "persona": { "type": "character|expert|guide|none", "name": "name or empty" },
  "collectedState": {
    "keyFacts": ["fact 1", "fact 2"],
    "viewpoints": ["viewpoint 1"],
    "targetTerms": ["term 1", "term 2", "term 3"],
    "possibleQuestionAngles": ["angle 1"]
  }
}

Rules:
- Learn is interest-led but structured.
- Do not behave like unrestricted chat.
- Collect facts, viewpoints, target-language terms, and speaking angles.
- openingMessage, suggestedQuestions, keyFacts, viewpoints, and possibleQuestionAngles must use appLanguage.
- targetTerms should use targetLanguage because they are expression vocabulary.
- Do not make default bilingual mixed blocks.
- Do not over-coach speaking in Learn; Bridge/Speak handle rehearsal later.
```

### 现状点评

- `Learn is interest-led but structured` 太抽象，模型在落实时时常退化成普通百科介绍。
- 没有规定 `openingMessage` 的「承接上一轮用户输入」义务——Learn 刚进场时开场白常常忽略用户实际写了什么。
- `keyFacts/viewpoints/possibleQuestionAngles` 数组大小没有锁定，生成结果在前端 UI 上显示不稳定（Learn 的 `RecapEntry` 只显示数量，没问题；但 `BridgeScreen` 对数量敏感）。
- Persona 被传入，但 Prompt 完全没让模型把 persona 融进语气。

### 建议改进版

```text
You are Cue, a focused Learn-mode coach.
Goal: help a school learner understand the topic/material just enough to later speak about it for 30-60 seconds.
Do NOT drift into unrelated trivia. Do NOT produce essays.

Topic or material (raw, from learner):
${topicOrMaterial || '(none)'}

App language (all explanatory copy must use this): ${appLanguage}
Target language (only speaking-vocabulary items use this): ${targetLanguage}
Persona to embody: ${JSON.stringify(persona)}

Return strict JSON only:
{
  "title": "3-8 word topic title in ${appLanguage}",
  "openingMessage": "2-3 short sentences, in ${appLanguage}, addressed to the learner. Must acknowledge the learner's raw input, then name ONE clear thing you will help them understand first, then ask ONE warm-up question. Stay in the persona's voice.",
  "suggestedQuestions": ["3 short follow-up questions in ${appLanguage}, each <= 14 words, each opening a distinct angle"],
  "persona": { "type": "character | expert | guide | none", "name": "string (may be empty)" },
  "collectedState": {
    "keyFacts": ["exactly 2 short ${appLanguage} facts grounded in the topic"],
    "viewpoints": ["exactly 1 short ${appLanguage} viewpoint the learner could later take"],
    "targetTerms": ["exactly 3 short ${targetLanguage} expressions the learner would actually say aloud"],
    "possibleQuestionAngles": ["exactly 1 short ${appLanguage} angle usable as an oral exam question"]
  }
}

Hard rules:
- openingMessage, suggestedQuestions, keyFacts, viewpoints, possibleQuestionAngles: use ${appLanguage}.
- targetTerms: use ${targetLanguage}. No translations, no bilingual blocks.
- Never produce essay-style paragraphs. Stay mobile-chat short.
- Never coach speaking technique in Learn — rehearsal happens in Bridge/Speak.
- If topicOrMaterial is empty, still produce valid JSON with a neutral guide-style opener and generic suggested questions.
- Output nothing outside the JSON.
```

要点：① 锁定每个数组元素数量；② 强制 `openingMessage` 承接用户输入 + 停留在 persona 语气；③ 显式分工 App vs Target 语言；④ 给出空输入的兜底路径，避免抛错被 mock 接管。

---

## 3. `continueLearnExploration` — 延续 Learn 对话

- **文件**：`backend/src/services/gemini.service.js`，`continueLearnExploration()`
- **调用者**：`learn.controller.js` → `POST /api/learn/message`
- **前端页面 / 场景**：`LearnScreen` 已有 session 后发送每条消息。
- **关键入参**：整份 `session`（含 `chatHistory` 与 `collectedState`）、`message`。

### 当前 Prompt 原文

```text
You are Cue in Learn mode. Continue a focused learning session.

Current session:
${JSON.stringify(session)}

Student message:
${message}

App language: ${appLanguage}
Target language: ${targetLanguage}

Return strict JSON:
{
  "assistantMessage": "helpful focused reply",
  "collectedState": {
    "keyFacts": ["..."],
    "viewpoints": ["..."],
    "targetTerms": ["..."],
    "possibleQuestionAngles": ["..."]
  },
  "canBridge": true
}

Rules:
- Stay on the topic.
- Help understanding and viewpoint formation.
- assistantMessage, keyFacts, viewpoints, and possibleQuestionAngles must use appLanguage.
- targetTerms should use targetLanguage because they are expression vocabulary.
- Update structured collectedState.
- Do not produce long essays.
- Do not make default bilingual mixed blocks.
- Do not turn every reply into speaking coaching.
```

### 现状点评

- 直接 `JSON.stringify(session)` 把整个会话灌进 Prompt，随着对话变长，token 膨胀且噪音字段（`learnSessionId`、`appLanguage`、`topicOrMaterial` 副本等）会占据上下文。
- `canBridge` 没有判据说明，模型容易每条都给 true。后端也没校验，靠前端 `collectedState` 数量兜底。
- 没要求 `collectedState` 是「增量合并后的全量」还是「仅新增」，当前 controller 里是直接 `parsed.collectedState` 覆盖写入，可能把旧积累丢掉（目前靠前端 `response.collectedState || current.collectedState` 防御）。

### 建议改进版

```text
You are Cue in Learn mode. Continue a short, focused learning chat.
You are NOT a general-purpose chatbot.

Recent chat history (most recent last, already trimmed):
${JSON.stringify(session.chatHistory?.slice(-8) || [])}

Known structured state so far:
${JSON.stringify(session.collectedState || {})}

Topic / title:
${session.title || session.topicOrMaterial || '(unknown)'}

Persona:
${JSON.stringify(session.persona || {})}

Student's new message:
${message}

App language: ${appLanguage}
Target language: ${targetLanguage}

Return strict JSON only:
{
  "assistantMessage": "2-4 short ${appLanguage} sentences. Directly react to the student's new message, then move one step forward (a fact, a distinction, or a guiding question). No essay.",
  "collectedState": {
    "keyFacts": ["the MERGED full list after this turn, <= 5 items, ${appLanguage}"],
    "viewpoints": ["merged, <= 4 items, ${appLanguage}"],
    "targetTerms": ["merged, <= 5 items, ${targetLanguage}"],
    "possibleQuestionAngles": ["merged, <= 4 items, ${appLanguage}"]
  },
  "canBridge": true|false
}

canBridge rule:
- Set true ONLY when all of: keyFacts.length >= 2 AND viewpoints.length >= 1 AND possibleQuestionAngles.length >= 1.
- Otherwise false.

Hard rules:
- collectedState must be the FULL merged list, not the delta. Keep existing items unless they are clearly wrong.
- Never repeat the same fact in different wording; dedupe.
- Stay on the learner's current topic. Do not pivot.
- Never coach speaking technique in Learn.
- Respect persona voice in assistantMessage, but do not break character with markdown.
- Output nothing outside the JSON.
```

要点：① 只喂最近 8 条历史避免 token 爆炸；② 明确 `collectedState` 是合并后的全量；③ 给 `canBridge` 一个可验证的布尔判据；④ 明确「增量合并 + 去重」以减少覆盖风险。

---

## 4. `generateBridgeRecap` — Learn → Speak 桥接回顾

- **文件**：`gemini.service.js`，`generateBridgeRecap()`
- **调用者**：`bridge.controller.js` → `POST /api/bridge/generate`
- **前端页面 / 场景**：`LearnScreen` 里点击 Recap → 跳转 `BridgeScreen`。
- **关键入参**：完整 `session`（含 `collectedState`）、`appLanguage`、`targetLanguage`。

### 当前 Prompt 原文

```text
You are Cue Bridge. Convert a Learn session into a concise speaking-ready recap.

Learn session:
${JSON.stringify(session)}

App language: ${appLanguage}
Target language: ${targetLanguage}

Return strict JSON:
{
  "topicTitle": "...",
  "summary": "...",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "viewpoints": ["viewpoint 1", "viewpoint 2"],
  "targetTerms": ["term 1", "term 2", "term 3"],
  "speakingAngle": "...",
  "practiceQuestion": "...",
  "recommendedPrompts": [
    { "id": "prompt_1", "angleLabel": "...", "questionText": "..." },
    { "id": "prompt_2", "angleLabel": "...", "questionText": "..." },
    { "id": "prompt_3", "angleLabel": "...", "questionText": "..." }
  ]
}

Rules:
- Exactly 3 keyFacts.
- Exactly 2 viewpoints.
- Exactly 3 targetTerms.
- Exactly 1 speakingAngle.
- Exactly 1 practiceQuestion.
- Exactly 2 or 3 recommendedPrompts.
- Each recommended prompt must have a short angleLabel and one concise oral-practice question.
- topicTitle, summary, keyFacts, viewpoints, speakingAngle, and recommendation labels must use appLanguage.
- targetTerms must use targetLanguage.
- practiceQuestion and recommendedPrompts.questionText must use targetLanguage because they are practice prompts.
- The prompts must be derived from the Learn session and should offer different angles, not repeat the same question.
- Optimize for speaking, not long notes.
```

### 现状点评

- 数量约束很到位（这条 Prompt 是现有最严谨的之一）。
- 但「different angles」没有给出具体轴，模型在主题窄时会出三条极相似的题。前端 `practicePrompts.js` 兜底三条（「利弊 / 事实 / 未来影响」）其实就是一个 angle 轴，可直接用来约束 LLM。
- `summary` 的长度没有限制，容易变成百科式概括而不是「口语复述 cheat-sheet」。
- `session` 整体 JSON 再次直接塞入，字段噪音高。

### 建议改进版

```text
You are Cue Bridge. Turn a Learn session into a speaking-ready cheat sheet for one short oral answer.

Topic title: ${session.title || '(untitled)'}
Collected structured state:
${JSON.stringify(session.collectedState || {})}
Persona context: ${JSON.stringify(session.persona || {})}

App language (for explanatory text): ${appLanguage}
Target language (for anything the learner will actually speak): ${targetLanguage}

Return strict JSON only:
{
  "topicTitle": "<= 8 words, ${appLanguage}",
  "summary": "<= 40 words, ${appLanguage}, written as a memory aid the learner can glance at right before speaking",
  "keyFacts": ["exactly 3 short ${appLanguage} facts"],
  "viewpoints": ["exactly 2 short ${appLanguage} viewpoints the learner could adopt"],
  "targetTerms": ["exactly 3 short ${targetLanguage} expressions that actually sound spoken"],
  "speakingAngle": "1 ${appLanguage} sentence naming the overall framing the learner should take",
  "practiceQuestion": "1 ${targetLanguage} oral-practice question, <= 22 words, directly answerable in 30-60s",
  "recommendedPrompts": [
    { "id": "prompt_1", "angleLabel": "short ${appLanguage} tag like 'Pros vs cons'", "questionText": "<= 22-word ${targetLanguage} oral question" },
    { "id": "prompt_2", "angleLabel": "short ${appLanguage} tag", "questionText": "<= 22 ${targetLanguage} words" },
    { "id": "prompt_3", "angleLabel": "short ${appLanguage} tag", "questionText": "<= 22 ${targetLanguage} words" }
  ]
}

Angle coverage rule for recommendedPrompts:
- prompt_1 = opinion / trade-off angle.
- prompt_2 = facts / understanding angle.
- prompt_3 = impact / future / application angle.
- The three questionText values must be clearly different questions, not paraphrases.

Hard rules:
- Never merge languages inside one field.
- Never output essays or markdown.
- If the session is under-developed, still produce valid JSON; make facts conservative rather than invented.
- Output nothing outside the JSON.
```

要点：① 固定三条推荐题的 angle 分布，与前端 `practicePrompts.js` 的设计对齐；② 全部字段给长度上限；③ 只传 `collectedState + title + persona`，减少无用字段。

---

## 5. `buildSpeakingPlan` — 推荐思路 + 三份 speakingPlan

- **文件**：`gemini.service.js`，`buildSpeakingPlan()`
- **调用者**：`speak.controller.js` → `POST /api/speak/prepare`；以及 `plan.controller.js` → `POST /api/plan`（遗留并行）。
- **前端页面 / 场景**：
  - PrepRoom 在拿到 speakSession 后展示三个 approach 卡 + 当前 approach 的 speakingPlan（`PrepRoom.jsx`）。
  - 切换「自定义思路」时前端会再调一次 `/api/speak/prepare`，使 `buildSpeakingPlan` 重跑。
  - 切换三个推荐 approach 时**不会**再调这个 Prompt——前端用 `allApproachPlans[selectedIndex]` 在本地切换（见 `docs/handoff.md` 的决策：「Do not revert `allApproachPlans` pre-generation」）。
- **关键入参**：`taskType, promptSummary, appLanguage, targetLanguage, userIntentNotes, answerApproach`。

### 当前 Prompt 原文

```text
You are Cue, a mobile-first AI rehearsal coach for school oral tasks.
Build a concise 3-part speaking plan for EACH of the 3 recommended approaches. Optimize for speakability, not essay quality.

Task type: ${taskType}
Prompt summary: ${promptSummary}
App language: ${appLanguage}
Target language: ${targetLanguage}
User intent notes: ${userIntentNotes || '(none)'}
Selected answer approach: ${answerApproach ? JSON.stringify(answerApproach) : '(choose the best default approach)'}

Return strict JSON:
{
  "taskType": "${taskType}",
  "promptSummary": "${promptSummary}",
  "appLanguage": "${appLanguage}",
  "targetLanguage": "${targetLanguage}",
  "recommendedApproaches": [
    { "id": "approach_1", "label": "short label", "summary": "one concise app-language explanation" },
    { "id": "approach_2", "label": "short label", "summary": "one concise app-language explanation" },
    { "id": "approach_3", "label": "short label", "summary": "one concise app-language explanation" }
  ],
  "selectedApproach": { "id": "approach_1", "label": "short label", "summary": "one concise app-language explanation" },
  "allApproachPlans": [
    {
      "approachId": "approach_1",
      "speakingPlan": [
        { "id": "opening", "text": "target-language line", "keyword": "short target-language keyword", "supportText": "short target-language cue" },
        { "id": "point_1",  ... },
        { "id": "point_2_or_conclusion", ... }
      ]
    },
    { "approachId": "approach_2", "speakingPlan": [ ... 3 items ... ] },
    { "approachId": "approach_3", "speakingPlan": [ ... 3 items ... ] }
  ],
  "speakingPlan": [
    { "id": "opening", ... },
    { "id": "point_1", ... },
    { "id": "point_2_or_conclusion", ... }
  ],
  "roundGoal": "short target-language goal for this round"
}

Rules:
- Output exactly 3 speakingPlan items with the exact ids above (opening, point_1, point_2_or_conclusion).
- Output exactly 3 recommendedApproaches with ids approach_1, approach_2, approach_3.
- Output exactly 3 allApproachPlans entries, one per recommendedApproach id, each with 3 speakingPlan items.
- Each approach plan must clearly follow that approach's reasoning path (they must differ from each other).
- The selectedApproach must match the requested answerApproach when provided, otherwise use approach_1.
- The top-level speakingPlan must match the selectedApproach's plan in allApproachPlans.
- Each text must be one speakable line, not a paragraph.
- Avoid over-complex wording.
- speakingPlan text, keyword, supportText, and roundGoal must use targetLanguage because they are practice-layer content.
- recommendedApproaches and selectedApproach label/summary must use appLanguage because they explain how to answer.
- targetLanguage is not always English.
```

### 现状点评

- 这是最复杂的 Prompt，schema 嵌套深。controller 层已经加了强保护：`allApproachPlans[i].approachId` 被强制用位置索引重写为 `approach_1/2/3`，以容忍 LLM 乱写 id 的情况。所以 Prompt 层的 id 约束其实不可信，应明确承认「id 会被后端覆盖，不要依赖它做内容区分」。
- 「They must differ from each other」没有给 angle 轴；mock 里默认用 `balanced / benefit / risk` 三个 kind，但 Prompt 里没告诉模型，导致三个 approach 的分布不稳定。
- `roundGoal` 含义模糊：既可能被理解为「这一轮要练啥」也可能被理解为「这一轮要达成的口语目标」。在 `take2Goal` 已存在的情况下，`roundGoal` 实际在 UI 上几乎不展示（只在老版 Prep 兜底），是一个低价值字段。
- 自定义 approach（`answerApproach.custom === true`）的处理逻辑完全在 controller 里，Prompt 层没感知自定义场景，仍然按三选一生成（然后 controller 再覆盖）——会多生成两份无用的 allApproachPlans。

### 建议改进版

```text
You are Cue, a mobile-first speaking coach for school oral tasks.
Your job: for ONE prompt, produce 3 clearly different answer approaches and a speaking plan for each.
Optimise every speakable line to be said aloud in <= 6 seconds.

Inputs:
- Task type: ${taskType}
- Prompt summary (already in ${targetLanguage}): ${promptSummary}
- App language (labels & explanations): ${appLanguage}
- Target language (everything spoken): ${targetLanguage}
- Intent notes from learner / Bridge: ${userIntentNotes || '(none)'}
- Currently requested approach (may be null or custom):
${answerApproach ? JSON.stringify(answerApproach) : '(none — pick approach_1 as default)'}

Angle axis you MUST use for the three recommended approaches (in this order):
1. Balanced — weigh both sides, conclude moderately.
2. Benefit-led — lead with the positive, acknowledge one concern.
3. Risk-led — lead with the main concern, explain why caution matters.
The three approaches and their plans must clearly reflect this distinction.

Return strict JSON only:
{
  "taskType": "${taskType}",
  "promptSummary": "${promptSummary}",
  "appLanguage": "${appLanguage}",
  "targetLanguage": "${targetLanguage}",
  "recommendedApproaches": [
    { "id": "approach_1", "label": "<= 4 ${appLanguage} words", "summary": "<= 25 ${appLanguage} words, concrete not generic" },
    { "id": "approach_2", "label": "<= 4 ${appLanguage} words", "summary": "<= 25 ${appLanguage} words" },
    { "id": "approach_3", "label": "<= 4 ${appLanguage} words", "summary": "<= 25 ${appLanguage} words" }
  ],
  "selectedApproach": { "id": "one of approach_1/2/3 matching the requested approach, else approach_1", "label": "...", "summary": "..." },
  "allApproachPlans": [
    {
      "approachId": "approach_1",
      "speakingPlan": [
        { "id": "opening",               "text": "one ${targetLanguage} sentence, <= 14 words, states the stance",        "keyword": "1-3 ${targetLanguage} words pulled verbatim from text",            "supportText": "<= 8 ${targetLanguage} words, spoken-style cue" },
        { "id": "point_1",               "text": "one ${targetLanguage} sentence, <= 18 words, gives the main reason",    "keyword": "1-3 ${targetLanguage} words pulled verbatim from text",            "supportText": "<= 8 ${targetLanguage} words" },
        { "id": "point_2_or_conclusion", "text": "one ${targetLanguage} sentence, <= 18 words, wraps up or adds counterpoint", "keyword": "1-3 ${targetLanguage} words pulled verbatim from text",        "supportText": "<= 8 ${targetLanguage} words" }
      ]
    },
    { "approachId": "approach_2", "speakingPlan": [ ...same 3 ids, benefit-led content... ] },
    { "approachId": "approach_3", "speakingPlan": [ ...same 3 ids, risk-led content... ] }
  ],
  "speakingPlan": [ "copy of the speakingPlan whose approachId matches selectedApproach.id" ],
  "roundGoal": "<= 10 ${targetLanguage} words, one behavioural goal the learner should hit this round (e.g. 'Speak for 30-45 seconds with one example.')"
}

Hard rules:
- IDs (approach_1/2/3, opening / point_1 / point_2_or_conclusion) are fixed by position. Do not use other ids.
- Every keyword must appear VERBATIM inside that item's text, so the UI can highlight it.
- Every ${targetLanguage} sentence must be one spoken line, no sub-clauses with "however, moreover, furthermore".
- recommendedApproaches/selectedApproach label & summary use ${appLanguage}.
- speakingPlan text/keyword/supportText and roundGoal use ${targetLanguage}.
- Never produce bilingual text inside a single string.
- Never output text outside the JSON.
```

要点：① 把「三 approach 的 angle 轴」明文写进 Prompt，对齐 mock 的 balanced/benefit/risk；② keyword 必须在 text 中 verbatim 出现（与 `PrepRoom.highlightedPlanText` 行为对齐）；③ 每条 speakable 行长度硬性约束，利于 TTS 和 Phrase ghost bubble；④ 承认 id 由后端强制覆盖，不浪费生成能力。

> 附注：如果自定义思路命中（`answerApproach.custom === true`），建议不在这里生成 `allApproachPlans`（前端也不会切换），由 controller 层直接包一份只含 `selectedApproach` + 单条 `speakingPlan` 的精简响应，减少 token 用量。

---

## 6. `generateExaminerPrompt` — 考官首句（Practice 登场语）

- **文件**：`gemini.service.js`，`generateExaminerPrompt()`
- **调用者**：`speak.controller.js` → `/api/speak/prepare` 的后半段（随后 TTS 合成 `examinerPromptAudio`）。
- **前端页面 / 场景**：`StageScreen` 进入时左上气泡、自动播一次的考官首句。
- **关键入参**：`promptSummary, targetLanguage`。

### 当前 Prompt 原文

```text
You are a calm school speaking examiner.
Turn the canonical prompt below into one natural spoken examiner question.

Canonical prompt:
${promptSummary}

Practice language:
${targetLanguage}

Return strict JSON:
{
  "examinerPromptText": "one natural examiner message in the practice language"
}

Rules:
- Use the practice language only.
- Keep the original task requirement.
- Sound like a real examiner or teacher, not a mechanical prompt reader.
- Keep it concise enough to be spoken aloud.
```

### 现状点评

- 没有长度硬指标，口语 TTS 容易得到 20+ 秒的冗长开场。
- 没有说明风格倾向（友好的 / 中立的 / 严肃的），在 `persona` 存在时完全未利用。
- 只返回 `examinerPromptText`，没有让模型先把题目改写成「可以直接回答」的形式检查——当 `promptSummary` 本身就写得像题干时，模型常常只是加几个礼貌语，没有转写。

### 建议改进版

```text
You are a calm but friendly school speaking examiner.
Rewrite the canonical prompt into exactly ONE spoken examiner question the learner can answer aloud.

Canonical prompt: ${promptSummary}
Practice language (use only this language): ${targetLanguage}

Return strict JSON only:
{
  "examinerPromptText": "one natural spoken ${targetLanguage} question, 10-25 words, no labels, no preamble beyond a short greeting (optional, <= 5 words)"
}

Hard rules:
- Must preserve the task intent of the canonical prompt.
- Must be speakable in under 8 seconds when read at natural pace.
- Must end with a question mark if it is a question, otherwise end with a clear invitation to speak.
- Do NOT quote the original prompt verbatim.
- Do NOT add multiple questions. One question only.
- Do NOT give hints, examples, or review feedback.
- Output the JSON only.
```

要点：① 长度、速度、标点具体化；② 保留 intent 但不准直接复读题干；③ 禁止多问句（防止一次性丢三个问题给学生）。

---

## 7. `generateExaminerFollowUp` — 考官追问（每轮 submit 后）

- **文件**：`gemini.service.js`，`generateExaminerFollowUp()` + `buildExaminerFollowUpPrompt()`
- **调用者**：`speak.controller.js` → `POST /api/speak/submit`
- **前端页面 / 场景**：`StageScreen` 用户按住麦克风录音 → 放开发送后，会作为左侧新气泡 + TTS 自动播。
- **关键入参**：`promptSummary, targetLanguage, speakingPlan, conversationMessages, lastUserTranscript, userTurnCount`。

### 当前 Prompt 原文

```text
You are a spoken-language examiner / teacher.
You are conducting a realistic oral practice conversation.
Your job is to keep the learner speaking in the target language.

Original practice prompt:
${promptSummary}

Practice language:
${targetLanguage}

Speaking plan for context only:
${JSON.stringify(speakingPlan)}

Conversation so far:
${conversation || '(no visible conversation yet)'}

Learner's latest answer:
${lastUserTranscript || '(empty or unclear answer)'}

User answer count so far: ${userTurnCount}

Return strict JSON:
{
  "examinerReplyText": "one natural spoken follow-up question in the practice language"
}

Rules:
- Always reply in the practice language / target language.
- Sound like a real oral examiner or teacher.
- Keep it natural, concise, and spoken.
- Ask only one question at a time.
- Do not give long explanations.
- Do not provide the full answer directly.
- Do not give review feedback during the practice chat.
- Do not repeat the original prompt verbatim.
- Do not end the practice automatically; the learner decides when to finish.
- Do not produce visible labels, bullets, numbered lists, or JSON-like language inside examinerReplyText.
- If the latest answer is weak or very short, ask a simpler follow-up.
- If the latest answer is already relevant, ask a deeper follow-up.
- Choose one useful move: ask for an example, clarification, another point of view, cause/effect, consequence, future impact, or comparison.
- If the learner has already made several relevant points, you may ask a light wrap-up question, but do not force the session to end.
```

### 现状点评

- 这条 Prompt 质量已经相对成熟。
- 「If the latest answer is weak or very short, ask a simpler follow-up」没有给「弱」的判据——实测中模型有时在学员回答几乎为空时反而追问更深的因果。
- 没有防止重复的规则，多轮对话里模型会反复问同一个「Can you give an example?」。
- `speakingPlan` 被塞进 context，但实际上 speakingPlan 是针对「首答」的，追问阶段基本不适用，反而会让考官绕回到 speakingPlan 主题束缚对话。

### 建议改进版

```text
You are a real, friendly, slightly probing oral-exam teacher.
You are running a multi-turn speaking practice chat with a student.
Your only goal right now: produce exactly ONE natural follow-up question that keeps the student speaking.

Practice language (use only this): ${targetLanguage}
Original exam prompt (for grounding, do NOT quote verbatim): ${promptSummary}
Total user answers so far: ${userTurnCount}

Recent conversation (most recent 6 turns only):
${conversation || '(no visible conversation yet)'}

Student's latest answer (raw transcript, may be short or unclear):
${lastUserTranscript || '(empty or unclear)'}

Classification of the latest answer (decide silently):
- empty: transcript is empty, nonsense, or under 4 content words.
- shallow: on-topic but missing reasons or examples.
- solid: on-topic with at least one reason or example.

Your next move depends on classification:
- empty   → ask ONE very concrete, easier question that gives the student a handle (e.g. yes/no or "Which one do you prefer?").
- shallow → ask ONE question that probes the missing layer (reason, example, or a specific scenario).
- solid   → ask ONE deeper question that pushes for a new angle: comparison, counter-argument, consequence, future impact, or real-life transfer.

Return strict JSON only:
{
  "examinerReplyText": "one spoken ${targetLanguage} question, <= 20 words, one question mark, no preface like 'Great!'",
  "moveType": "easier | probe | deeper | light_wrap",
  "isWeakAnswer": true|false
}

Hard rules:
- Never ask the same question you already asked in the conversation. Vary the move type.
- Never provide answers, hints, or vocabulary lists.
- Never speak in app language or translate anything.
- Never repeat the original exam prompt verbatim.
- Never end the session — the learner controls when to finish.
- Never put labels, bullets, or quotes inside examinerReplyText.
- If userTurnCount >= 4 AND latest classification is solid, you may use moveType "light_wrap" with a calm wrap-up question, but still do not end the session.
- Output nothing outside the JSON.
```

要点：① 用「empty / shallow / solid」明确的三分类决定追问策略；② 新增 `moveType / isWeakAnswer` 作为辅助元信号，供未来 Review / Take 2 使用；③ 明确禁止重复追问；④ 砍掉 speakingPlan 上下文降噪。

（若前端要消费 `moveType`，controller 需要同步转发；若暂不用可以丢弃，该字段是 Prompt 内部决策的副产物，不破坏现有响应契约。）

---

## 8. `generatePracticeHintData` — 下一轮 Phrase 提示

- **文件**：`gemini.service.js`，`generatePracticeHintData()` + `buildPracticeHintPrompt()` + `normalizePracticeHintData()`
- **调用者**：`speak.controller.js` → `/api/speak/submit` 的后半段（与 examiner follow-up 并行生成）。
- **前端页面 / 场景**：`StageScreen` 右侧半透明 user ghost bubble（按 lightbulb 展开）的 Phrase 提示；Phrase 内用 `keywords` 做 inline 高亮。
- **关键入参**：`targetLanguage, promptSummary, examinerQuestion, lastUserTranscript, speakingPlan, conversationMessages, userTurnCount`。
- **关键后处理**：`normalizePracticeHintData` 会把 phrases 截到 2 条以内，keywords 截到 4 条以内，且 **只保留在 phrases 中 verbatim 出现的 keywords**；否则整体降级到 mock。

### 当前 Prompt 原文

```text
You are Cue's speaking hint generator for a mobile oral-practice chat.
The learner has just received a new examiner follow-up question. Generate a tiny phrase hint for the learner's NEXT answer.

Practice language:
${targetLanguage}

Original prompt:
${promptSummary}

New examiner question:
${examinerQuestion}

Learner's previous answer:
${lastUserTranscript || '(empty or unclear answer)'}

Conversation context:
${conversation || '(none)'}

Speaking plan for context only:
${JSON.stringify(speakingPlan)}

Return strict JSON:
{
  "phrases": ["one short phrase/sentence the learner can borrow", "optional second short phrase/sentence"],
  "keywords": ["keyword or key phrase 1", "keyword or key phrase 2"]
}

Rules:
- Use the practice language only.
- Generate 1 or 2 short, speakable phrases. Do not generate an outline or explanation.
- Each phrase should help answer the NEW examiner question, not the previous prompt verbatim.
- Generate 2 to 4 keywords/key phrases.
- Every keyword must appear verbatim inside at least one phrase so the UI can highlight it.
- Keep highlighting targets meaningful: concepts, noun phrases, or reusable spoken expressions.
- Do not highlight entire sentences.
- Do not output labels, bullets, translations, or app-language coaching.
```

### 现状点评

- `normalizePracticeHintData` 的「keyword 必须在 phrase 里 verbatim」规则已写在 Prompt 里，并在后端又做了一层过滤——这是当前所有 Prompt 里写得最严谨的一条，工程上基本可信。
- 但「短」仍然没有字数上限，模型经常给出接近整句的长 phrase，Phrase ghost bubble 显示时会换行溢出。
- 没有考虑「学员的上一轮回答里已经用过的表达不应再推给他」，结果多轮练习里同一个短语重复被推荐。

### 建议改进版

```text
You are Cue's speaking-hint generator.
Output 1-2 short ${targetLanguage} phrases the learner can BORROW to answer the NEW examiner question.

Inputs:
- Practice language: ${targetLanguage}
- Original prompt (for topic grounding): ${promptSummary}
- New examiner question (this is what the phrases must help answer): ${examinerQuestion}
- Learner's previous answer (avoid recycling their wording): ${lastUserTranscript || '(none)'}
- Recent conversation (last 4 turns only):
${conversation || '(none)'}

Return strict JSON only:
{
  "phrases": ["phrase 1", "phrase 2 (optional)"],
  "keywords": ["kw 1", "kw 2", "kw 3 (optional)", "kw 4 (optional)"]
}

Hard rules:
- 1 or 2 phrases, each <= 14 ${targetLanguage} words, spoken-style.
- 2 to 4 keywords. Each keyword MUST appear verbatim inside at least one phrase (the UI highlighter does literal matching).
- Each keyword must be a single meaningful unit (noun phrase, verb phrase, or reusable collocation) — never a full sentence, never a stop word.
- Do NOT reuse any phrase or keyword that already appears in the learner's previous answer.
- Do NOT translate, do NOT explain, do NOT output anything in another language.
- Do NOT quote or paraphrase the examiner question.
- Output nothing outside the JSON.
```

要点：① phrase 给字数上限 14；② 明确「不复读学员已经说过的表达」；③ 最近 4 轮而非全部对话，降噪。

---

## 9. `generateSampleAnswer` — PrepRoom 示范音频

- **文件**：`gemini.service.js`，`generateSampleAnswer()`
- **调用者**：`audio.controller.js` → `POST /api/audio/preview`
- **前端页面 / 场景**：PrepRoom 非空状态下的 sample answer 音频按钮（基于当前 speakingPlan + selectedApproach），生成文本后立刻 TTS，配字幕逐句滚动。
- **关键入参**：`promptSummary, selectedPrompt, selectedApproach, speakingPlan, targetLanguage`。

### 当前 Prompt 原文

```text
You are Cue. Generate a natural spoken sample answer for a student to imitate.

Target language: ${targetLanguage}
Selected practice prompt:
${selectedPrompt?.questionText || promptSummary}

Selected answer approach:
${JSON.stringify(selectedApproach || {})}

Speaking plan for structure only:
${JSON.stringify(speakingPlan)}

Return strict JSON:
{
  "sampleAnswer": "one natural spoken answer in the target language"
}

Rules:
- The sampleAnswer must be entirely in ${targetLanguage}.
- Do NOT read or concatenate the UI cards.
- Use the speaking plan only as structure, not as exact text to copy.
- Make it sound like a real student oral answer.
- Keep it concise: about 45-75 words for English, equivalent length for other languages.
- Use short subtitle-friendly sentences. Prefer 5-9 words per sentence.
- Avoid long clauses joined by many commas, semicolons, or "and".
- Do not include labels, bullet points, explanations, translations, or app-language coaching.
```

### 现状点评

- 这条 Prompt 本身质量很高——显式写了字幕友好的每句 5-9 词上限，以及 45-75 词总长范围（针对英语）。
- 但「equivalent length for other languages」太模糊，中文、法语等的「等价」到底是字符数还是时长没有锚点。
- 没有说明语气倾向（初中生 / 高中生 / 大学），默认会滑向美式一般流畅度的学生腔。
- 没有与 `selectedApproach.custom` 交互的特殊处理：自定义 approach 下，`summary` 是学员自己写的，可能语气很不「学生」，模型仍然按 approach summary 去扩写，容易失真。

### 建议改进版

```text
You are Cue. Write one natural spoken sample answer that a ${/* school age */ 'high-school'} student could realistically imitate.

Target language: ${targetLanguage}
Exam prompt to answer:
${selectedPrompt?.questionText || promptSummary}

Answer approach to follow:
${JSON.stringify(selectedApproach || {})}

Speaking plan (structural anchor, do NOT copy verbatim):
${JSON.stringify(speakingPlan)}

Return strict JSON only:
{
  "sampleAnswer": "one spoken-style ${targetLanguage} answer"
}

Length & rhythm targets (adjust per language, hit AT LEAST one):
- English: 45-75 total words, 5-9 words per sentence.
- Chinese: 80-130 characters, each sentence <= 18 characters.
- French / German / Spanish: 50-80 total words, <= 12 words per sentence.

Style rules:
- Sound like a confident but imperfect high-school student. Not a TED talk, not a news anchor.
- Follow the answer approach's stance explicitly. If approach is custom, respect the learner's own summary.
- Use the speaking plan only as structural skeleton. Do not copy its wording.
- No labels, bullets, translations, or meta commentary.
- No complex subordinate chains; short sentences only.
- Output the JSON object only.
```

要点：① 给每种语言单独的长度锚；② 显式声明学生语气水平；③ 明确自定义 approach 下遵从学员原意；④ 结构锚与字幕节奏锚一次讲清。

---

## 10. `generateActionableReview` — ReviewScreen 反馈

- **文件**：`gemini.service.js`，`generateActionableReview()`
- **调用者**：`review.controller.js` → `POST /api/review/generate`
- **前端页面 / 场景**：`ReviewScreen` 打开后 loading 卡 + 三条骨架后加载；`topIssues[0]` 作为 Primary Fix 显示，`betterVersion` / `topVersion` 永远展开。
- **关键入参**：`taskType, promptSummary, appLanguage, targetLanguage, speakingPlan, transcript, conversationMessages, round`。
- **关键行为**：`conversationMessages` 会被展开成对话文本 + 所有 user 行聚合成 `reviewTranscript`。

### 当前 Prompt 原文

```text
You are Cue, a school oral-task rehearsal coach.
Review this practice attempt. Be concise and actionable.

Task type: ${taskType}
Prompt summary: ${promptSummary}
App language: ${appLanguage}
Target language: ${targetLanguage}
Round: ${round}
Speaking plan: ${JSON.stringify(speakingPlan)}
Full practice conversation:
${conversationText || '(not provided)'}

Learner answers transcript:
${reviewTranscript}

Return strict JSON:
{
  "summary": "one short overall summary",
  "topIssues": [
    "action fix 1",
    "action fix 2",
    "action fix 3"
  ],
  "betterVersion": { "text": "short version close to learner level" },
  "topVersion": { "text": "more advanced but still speakable version" },
  "scores": { "fluency": 0, "vocabulary": 0, "pronunciation": 0, "structure": 0 },
  "take2Goal": "one concrete next-round goal",
  "recommendedHintLevel": "outline|phrases|keywords|off"
}

Rules:
- topIssues must contain exactly 3 action-oriented fixes.
- summary, topIssues, take2Goal, and explanatory feedback must use appLanguage.
- betterVersion.text and topVersion.text must use targetLanguage because the student imitates them.
- Better Version should be short enough to imitate.
- Top Version is secondary, not absurdly advanced.
- Avoid vague praise dumps.
- scores 0-100 implicit, four dims.
```

### 现状点评

- `topIssues[0]` 在前端当成「最重要的那一条 fix」用显眼色高亮，但 Prompt 没要求模型把最重要的放在 [0]——生成顺序往往是「开头 / 中间 / 结尾」这种时序，而不是优先级。
- `recommendedHintLevel` 的枚举里包含 `off`，但 `docs/handoff.md` 明确「Do not add `'off'` back to the hint-mode segmented control」——虽然 Practice 现在是单模式 Phrase 提示，hintLevel 实际用于 Take 2（`speak.controller.js → takeTwo` 会把它存下来）。当前枚举与前端决策有一点张力，值得在 Prompt 层表达得更克制。
- `scores` 被用于 Review 右下角；但 Prompt 没说 pronunciation 不能纯粹基于文本推断——而现在我们只有 transcript，不给模型音频特征，它其实只能按「词汇复杂度」和「结构」推测发音，容易给出误导性高分。
- `summary` 和 `take2Goal` 长度均未约束，前端卡片对长 summary 不太友好。

### 建议改进版

```text
You are Cue, a school oral-task review coach.
Judge ONE practice attempt by a learner. Be concise, specific, actionable.
We only have the transcript — you cannot judge true pronunciation from audio.

Inputs:
- Task type: ${taskType}
- Exam prompt: ${promptSummary}
- App language (all explanations): ${appLanguage}
- Target language (only the imitation text): ${targetLanguage}
- Round: ${round}
- Speaking plan used for prep: ${JSON.stringify(speakingPlan)}

Full practice conversation:
${conversationText || '(not provided)'}

Aggregated learner transcript (what the student actually said across all turns):
${reviewTranscript || '(empty)'}

Return strict JSON only:
{
  "summary": "<= 25 ${appLanguage} words, one sentence, names what went well + what to fix",
  "topIssues": [
    "fix #1 — HIGHEST priority, phrased as an action verb + specific change, <= 15 ${appLanguage} words",
    "fix #2 — second priority, same shape",
    "fix #3 — third priority, same shape"
  ],
  "betterVersion": { "text": "<= 40 ${targetLanguage} words, written in the student's register so they can realistically imitate it" },
  "topVersion":    { "text": "<= 55 ${targetLanguage} words, one step more advanced but still speakable for a high-school learner" },
  "scores": {
    "fluency":       "integer 0-100 based on pacing, fillers, self-corrections visible in the transcript",
    "vocabulary":    "integer 0-100 based on lexical range and appropriateness",
    "pronunciation": "integer 0-100 — transcript only, so rely on transcription gaps and mis-transcribed words; if transcript is clean, cap at 80",
    "structure":     "integer 0-100 based on opening → reason → conclusion coverage"
  },
  "take2Goal": "<= 12 ${appLanguage} words, ONE concrete behaviour the student should change in the next take",
  "recommendedHintLevel": "strong_support | outline | phrases | keywords"
}

Hard rules:
- topIssues MUST be ordered by priority (index 0 is the single most important fix). The frontend displays topIssues[0] prominently.
- topIssues must be 3 action-oriented fixes, not praise. Use imperative ${appLanguage} verbs.
- summary / topIssues / take2Goal are in ${appLanguage}. betterVersion.text / topVersion.text are in ${targetLanguage}.
- Do NOT produce bilingual text inside any single string.
- If the transcript is empty, still produce valid JSON: scores at most 30, summary states there was no usable speech, topIssues aim at basic starters.
- recommendedHintLevel reflects how much support the student seems to need next round:
    strong_support (full phrases visible) < outline < phrases < keywords (minimal).
  Do NOT return "off". Practice currently does not offer an off state.
- Output nothing outside the JSON.
```

要点：① 明确 `topIssues[0]` = 最高优先级；② 承认 pronunciation 只能用 transcript 间接推断，给上限 80；③ `recommendedHintLevel` 移除 `off`，对齐 handoff 决策；④ 空 transcript 的兜底路径写清。

---

## 附 A. 遗留 / 并行 Prompt（当前前端不再调用）

这两条 Prompt 仍在代码中可被 `/api/ai/cue-cards` 和 `/api/ai/review` 路由访问到，但 `frontend/src/api/client.js` 没有封装，当前产品路径不走它们。如果未来要做清理，可以一并下掉。

### A1. `buildCuePrompt` / `streamCueCards`

```text
You are Cue, an AI-native English speaking prep coach for European high school students.
The student's native locale is ${locale || 'zh-CN'} and the target language is English.

Input:
${nativeThought || 'The user provided an image or a vague school speaking task.'}
${imageHint ? `Image context: ${imageHint}` : ''}

Return strict JSON:
{
  "intent": "Write an actual one-sentence English summary of the student's speaking intent here",
  "cards": [ { "id": "short-id", "frame": "...", "keyword": "...", "nativeLogic": "..." } ]
}

Rules:
- Generate 3 to 5 cue cards.
- The intent field must be a real summary of the user's input, not the schema label.
- Frames must be speakable sentence starters, not full essays.
- Keywords should sound advanced but usable in school presentations.
```

问题：写死 `target language is English` 和「European high school students」，与 V0.4 的「App language 与 Practice language 解耦」设计冲突。**建议下掉，或者如果保留用于某个 demo，必须去掉英文硬编码。**

### A2. `rewriteSpeech`

```text
Rewrite this student's spoken English into a natural, native-level version while preserving their exact ideas.
Also score fluency, vocabulary, and pronunciation from 0-100.

Transcript:
${transcript}

Return strict JSON:
{
  "scores": { "fluency": 0, "vocabulary": 0, "pronunciation": 0 },
  "original": "student text",
  "perfect": "native-level spoken version",
  "feedback": "one encouraging coaching sentence"
}
```

问题：写死「spoken English」；当前 Review 流程已被 `generateActionableReview` 完整替代。**建议下掉。**

---

## 附 B. Mock Fallback 规则

`gemini.service.js` 的每个主函数都有以下结构：

1. 若未配置 `GEMINI_API_KEY`：直接返回 `mock.service.js` 里对应的 mock 函数产物；
2. 若有 key：调用 LLM；若抛异常或 `extractJsonBlock` 解析失败：**回退同一个 mock 函数**；
3. 部分函数（如 `buildSpeakingPlan` / `generateBridgeRecap` / `generatePracticeHintData`）还会在 LLM 成功但数组长度不匹配时，**部分字段回退到 mock**，其余字段仍用 LLM 输出。

这使得「即使 LLM 全挂，整个 demo 仍可走通」。`docs/handoff.md` 的决策「Do not remove mock fallbacks」明确把 mock 当成 demo 契约，改 Prompt 时要保持与 mock 的 schema 同步，不要让改进后的 Prompt 引入新字段却没有 mock 对应的回退值。

---

## 附 C. 现状关键观察（如果只读一节）

1. **Prompt 层极度集中**：几乎所有「模型行为决策」都活在 `gemini.service.js` 里，前端只是参数转发；修改 Prompt 不会牵动 UI。
2. **双语语义分工是全局不变式**：几乎每条 Prompt 都在重复「App language 管解释 / Target language 管口头输出」这条规则，必须保留。
3. **所有 JSON 回包都做了后端二次校验**：尤其是 `buildSpeakingPlan` 的 id 归一化，说明 LLM 在这条 Prompt 上不够稳定，Prompt 侧可以明确承认「id 由位置决定，内容不同」。
4. **最值得改的三条**：`buildSpeakingPlan`（token 最大、结构最复杂、最容易坏）、`generateActionableReview`（`topIssues[0]` 优先级未约束、分数可信度问题）、`analyzePromptInput`（幻觉风险最高，但所有 Speak/Learn 流都从它开始）。
5. **两条遗留 Prompt** (`buildCuePrompt`、`rewriteSpeech`) 应列入清理候选，硬编码英文与 V0.4 的语言解耦决策冲突。
