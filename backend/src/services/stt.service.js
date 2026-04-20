export async function transcribeAudio({ audioBuffer, mimeType, languageCode = 'en-US' }) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required for speech-to-text.');
  }

  if (!audioBuffer) {
    throw new Error('Audio file is required for speech-to-text.');
  }

  const speech = await import('@google-cloud/speech');
  const client = new speech.SpeechClient();
  const audio = { content: audioBuffer.toString('base64') };
  const config = {
    languageCode,
    enableAutomaticPunctuation: true,
    model: 'latest_long'
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
    transcript
  };
}
