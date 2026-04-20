function buildPreviewScript(cards = [], locale = 'zh-CN') {
  const topCards = cards.slice(0, 3);
  const keywords = topCards.map((card) => card.keyword).filter(Boolean);

  if (locale.startsWith('zh')) {
    return `开头先抓住 ${keywords[0] || 'the main point'}，然后转到 ${
      keywords[1] || 'the reason'
    }，最后用 ${keywords[2] || 'the impact'} 收尾。按这个逻辑来，稳。`;
  }

  return `Start with ${keywords[0] || 'the main point'}, connect it to ${
    keywords[1] || 'the reason'
  }, then land on ${keywords[2] || 'the impact'}. Keep it simple and confident.`;
}

async function synthesizeWithGoogle({ text, languageCode = 'en-US' }) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required for text-to-speech.');
  }

  const textToSpeech = await import('@google-cloud/text-to-speech');
  const client = new textToSpeech.TextToSpeechClient();
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode,
      ssmlGender: 'NEUTRAL'
    },
    audioConfig: { audioEncoding: 'MP3' }
  });

  return {
    audioUrl: `data:audio/mpeg;base64,${response.audioContent.toString('base64')}`,
    mimeType: 'audio/mpeg'
  };
}

export async function createPreviewAudio({ cards = [], locale = 'zh-CN' }) {
  const script = buildPreviewScript(cards, locale);
  const audio = await synthesizeWithGoogle({
    text: script,
    languageCode: locale.startsWith('zh') ? 'cmn-CN' : 'en-US'
  });

  return {
    script,
    audioUrl: audio.audioUrl,
    mimeType: audio.mimeType
  };
}

export async function createSpeechAudio({ text }) {
  if (!text) {
    throw new Error('Text is required for text-to-speech.');
  }

  const script = text;
  const audio = await synthesizeWithGoogle({ text: script, languageCode: 'en-US' });

  return {
    script,
    audioUrl: audio.audioUrl,
    mimeType: audio.mimeType
  };
}
