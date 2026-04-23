import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, Languages, Mic2, Sparkles } from 'lucide-react';
import BottomSheet from '../components/common/BottomSheet.jsx';
import { pageTransition, springPop } from '../lib/motion.js';
import { uiTheme } from '../lib/uiTheme.js';

const LANGUAGE_OPTIONS = ['en', 'zh-CN', 'fr', 'de', 'es'];

function LanguageRow({ helper, icon: Icon, label, onOpen, value }) {
  const { t } = useTranslation();

  return (
    <motion.button
      className={`flex w-full items-center gap-3 rounded-[24px] p-3 text-left transition hover:bg-white/90 ${uiTheme.surface.elevated}`}
      onClick={onOpen}
      type="button"
      variants={springPop}
      whileTap={{ scale: 0.985 }}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] ${uiTheme.accent.iconSoft}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black tracking-tight text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{helper}</span>
      </span>
      <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black ${uiTheme.chip.base}`}>
        {t(`languages.${value}`)}
        <ChevronRight size={14} />
      </span>
    </motion.button>
  );
}

function LanguagePickerSheet({ onClose, onSelect, open, title, value }) {
  const { t } = useTranslation();

  return (
    <BottomSheet onClose={onClose} open={open} title={title}>
      <div className="space-y-2 pb-1">
        {LANGUAGE_OPTIONS.map((language) => {
          const selected = language === value;
          return (
            <button
              className={`flex min-h-[56px] w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition ${
                selected
                  ? `${uiTheme.selectable.selected} text-slate-950`
                  : `${uiTheme.selectable.muted} text-slate-600`
              }`}
              key={language}
              onClick={() => onSelect(language)}
              type="button"
            >
              <span>
                <span className="block text-sm font-black">{t(`languages.${language}`)}</span>
                <span className="mt-0.5 block text-xs font-bold text-slate-400">{language}</span>
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  selected ? uiTheme.selectionMark.selected : uiTheme.selectionMark.idle
                }`}
              >
                <Check size={16} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

export default function SettingsScreen({ onSettingsChange, settings }) {
  const { t, i18n } = useTranslation();
  const [picker, setPicker] = useState(null);
  const activeValue = picker === 'uiLanguage' ? settings.uiLanguage || i18n.language : settings[picker];

  const updateSetting = (key, value) => {
    onSettingsChange((current) => ({ ...current, [key]: value }));
  };

  const updateUiLanguage = (value) => {
    updateSetting('uiLanguage', value);
    i18n.changeLanguage(value);
  };

  const selectLanguage = (value) => {
    if (picker === 'uiLanguage') updateUiLanguage(value);
    if (picker === 'targetLanguage') updateSetting('targetLanguage', value);
    setPicker(null);
  };

  const pickerTitle =
    picker === 'uiLanguage'
      ? t('settings.uiLanguage')
      : picker === 'targetLanguage'
        ? t('settings.targetLanguage')
        : '';

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-4" {...pageTransition}>
      <div className={`pointer-events-none absolute -right-24 top-0 h-60 w-60 rounded-full blur-3xl ${uiTheme.background.warmGlow}`} />
      <div className={`pointer-events-none absolute -left-20 bottom-20 h-52 w-52 rounded-full blur-3xl ${uiTheme.background.softGlow}`} />

      <div className="relative">
        <p className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] ${uiTheme.accent.eyebrow}`}>
          <Sparkles size={13} />
          {t('settings.eyebrow')}
        </p>
        <h1 className="mt-3 text-[2rem] font-black leading-tight tracking-tight text-slate-950">{t('settings.title')}</h1>
        <p className="mt-2 max-w-[20rem] text-[14px] leading-relaxed text-slate-500">{t('settings.subtitle')}</p>
      </div>

      <motion.div animate="show" className="relative mt-6 space-y-3" initial="hidden">
        <LanguageRow
          helper={t('settings.uiLanguageHelper')}
          icon={Languages}
          label={t('settings.uiLanguage')}
          onOpen={() => setPicker('uiLanguage')}
          value={settings.uiLanguage || i18n.language}
        />
        <LanguageRow
          helper={t('settings.targetLanguageHelper')}
          icon={Mic2}
          label={t('settings.targetLanguage')}
          onOpen={() => setPicker('targetLanguage')}
          value={settings.targetLanguage}
        />
      </motion.div>

      <div className="relative mt-auto rounded-[28px] border border-white/80 bg-white/54 p-4 text-sm leading-relaxed text-slate-500 shadow-[0_16px_34px_rgba(91,92,126,0.08)] backdrop-blur-xl">
        {t('settings.helper')}
      </div>

      <LanguagePickerSheet
        onClose={() => setPicker(null)}
        onSelect={selectLanguage}
        open={Boolean(picker)}
        title={pickerTitle}
        value={activeValue}
      />
    </motion.section>
  );
}
