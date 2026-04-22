const TTS_LANGUAGE_BY_TARGET = {
  en: 'en-US',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  zh: 'cmn-CN',
  'zh-CN': 'cmn-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES'
};

export function toTtsLanguageCode(language = 'en') {
  return TTS_LANGUAGE_BY_TARGET[language] || language || 'en-US';
}

export function languageLabel(language = 'en') {
  const labels = {
    en: 'English',
    'zh-CN': 'Chinese',
    fr: 'French',
    de: 'German',
    es: 'Spanish'
  };

  return labels[language] || language;
}
