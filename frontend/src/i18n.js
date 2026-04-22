import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import zhCN from './locales/zh-CN.json';

const supportedLanguages = ['en', 'zh-CN', 'fr', 'de', 'es'];

function detectUiLanguage() {
  const saved = window.localStorage.getItem('cue-ui-language');
  if (supportedLanguages.includes(saved)) return saved;

  const browser = navigator.language || 'en';
  if (browser.startsWith('zh')) return 'zh-CN';
  if (browser.startsWith('fr')) return 'fr';
  if (browser.startsWith('de')) return 'de';
  if (browser.startsWith('es')) return 'es';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es }
  },
  lng: detectUiLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

i18n.on('languageChanged', (language) => {
  window.localStorage.setItem('cue-ui-language', language);
});

export default i18n;
