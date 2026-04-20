## Cue Backend

Express API for Gemini cue generation, Google Cloud STT, and Google Cloud TTS.

### Setup

```bash
cp .env.example .env
npm install
npm run dev
```

AI and voice endpoints require real Gemini and Google Cloud credentials. Missing credentials now produce explicit API errors instead of silent demo data.
