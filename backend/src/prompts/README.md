# Prompts

All LLM prompts for the Cue backend live here as plain `.md` template files.

## Why

Previously every prompt was an inline template literal inside `services/gemini.service.js`, mixed with code that built the variables, called the model, parsed the response, and merged mock fallbacks. That made the actual prompt text hard to find, hard to diff, and impossible to iterate on without touching service code.

This directory holds **only the prompt text**. The service layer prepares the variables and calls `renderPrompt()` to load and substitute them. To tune a prompt, edit a `.md` file — no JS changes required.

## Directory layout

Two levels: **module** / **flow**. Module mirrors the product surface (Learn / Bridge / Speak / Review), flow is the specific endpoint inside it.

```
prompts/
├── _loader.js                          # renderPrompt(path, vars)
├── input/analyze/prompt.md             # /api/input/analyze
├── learn/start/prompt.md               # /api/learn/start
├── learn/continue/prompt.md            # /api/learn/message
├── bridge/recap/prompt.md              # /api/bridge/generate
├── speak/plan/prompt.md                # /api/speak/prepare (speaking plan + approaches)
├── speak/examiner-prompt/prompt.md     # /api/speak/prepare (opening examiner question)
├── speak/examiner-followup/prompt.md   # /api/speak/submit (examiner follow-up)
├── speak/practice-hint/prompt.md       # /api/speak/submit (phrase + keyword hints)
├── speak/sample-answer/prompt.md       # /api/audio/preview
├── review/generate/prompt.md           # /api/review/generate
└── legacy/                             # disabled in V0.4, kept for reference
    ├── cue-cards/prompt.md
    └── rewrite-speech/prompt.md
```

## Template syntax

Plain text with `{{variable}}` placeholders. Whitespace inside the braces is allowed (`{{ foo }}` works). Dotted names are not supported — pass flat variables.

Caller is responsible for:
- JSON-stringifying objects/arrays before passing them in.
- Substituting placeholder strings like `(none)` / `(empty or unclear answer)` for missing inputs.
- Joining conversation messages into a single string.

The loader **throws** if a placeholder in the template has no matching key in `vars` — this catches typos at request time instead of silently producing `undefined` in the prompt.

## Adding a new prompt

1. Create `prompts/<module>/<flow>/prompt.md` with `{{vars}}`.
2. In the corresponding service function, import and call:
   ```js
   import { renderPrompt } from '../prompts/_loader.js';
   const prompt = renderPrompt('<module>/<flow>/prompt.md', { ...vars });
   ```
3. Keep all variable preparation (JSON.stringify, fallbacks, conversation formatting) in the service file, not in the template.

## Caching

Templates are read from disk once and cached in memory. Set `PROMPTS_NO_CACHE=1` to disable the cache — useful when iterating on prompt text against a running dev server.
