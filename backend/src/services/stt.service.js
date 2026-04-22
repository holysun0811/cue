import { toTtsLanguageCode } from '../utils/language.js';

export async function transcribeAudio({ audioBuffer, mimeType, languageCode = 'en-US' }) {
  // Google STT requires full BCP-47 codes (e.g. en-US, not en).
  // Reuse the same normalisation map used for TTS.
  languageCode = toTtsLanguageCode(languageCode);
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      transcript:
        'I think this topic is important because it affects students in real life. For example, it changes how people learn and communicate.',
      mocked: true
    };
  }

  if (!audioBuffer) {
    return {
      transcript:
        'I think this topic is important because it affects students in real life. For example, it changes how people learn and communicate.',
      mocked: true
    };
  }

  // TODO: Replace with your production Google Cloud auth setup if not using ADC.
  const speech = await import('@google-cloud/speech');
  const client = new speech.SpeechClient();
  const audio = { content: audioBuffer.toString('base64') };
  // latest_long has strong accuracy for English but limited support for other languages;
  // fall back to default for everything else.
  const model = languageCode.startsWith('en') ? 'latest_long' : 'default';
  const config = {
    languageCode,
    enableAutomaticPunctuation: true,
    model
  };

  if (mimeType?.includes('webm')) {
    config.encoding = 'WEBM_OPUS';
  }

  const [response] = await client.recognize({ audio, config });
  const transcript = response.results
    .map((result) => result.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(' ');

  return {
    transcript,
    mocked: false
  };
}
