import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { flushSync } from 'react-dom';
import { ArrowLeft, BadgeCheck, BookMarked, Check, Lightbulb, ListChecks, Sparkles } from 'lucide-react';
import { pageTransition, springPop } from '../lib/motion.js';
import { targetLanguagePrompts } from '../lib/practicePrompts.js';

function BridgeSection({ children, icon: Icon, title }) {
  return (
    <motion.article
      className="rounded-[24px] border border-white bg-white/82 p-4 shadow-[0_14px_32px_rgba(99,102,241,0.1)] backdrop-blur-xl"
      variants={springPop}
    >
      <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">
        <Icon size={14} />
        {title}
      </p>
      {children}
    </motion.article>
  );
}

export default function BridgeScreen({ bridgeData, busy, onContinue, onPractice }) {
  const { t } = useTranslation();
  const [localBusy, setLocalBusy] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const practiceStartedRef = useRef(false);
  const loading = busy || localBusy;

  const startPractice = async () => {
    const selectedPrompt = recommendedPrompts.find((prompt) => prompt.id === selectedPromptId);
    if (practiceStartedRef.current || !selectedPrompt) return;
    practiceStartedRef.current = true;
    flushSync(() => setLocalBusy(true));
    try {
      await Promise.resolve(onPractice(selectedPrompt));
    } finally {
      practiceStartedRef.current = false;
      setLocalBusy(false);
    }
  };

  if (!bridgeData) {
    return (
      <motion.section className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-5 pt-5 text-center" {...pageTransition}>
        <Sparkles className="text-violet-500" size={28} />
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">{t('bridge.emptyTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('bridge.emptyBody')}</p>
        <button className="mt-5 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700" onClick={onContinue} type="button">
          {t('bridge.continue')}
        </button>
      </motion.section>
    );
  }

  const recommendedPrompts = bridgeData.recommendedPrompts?.length
    ? bridgeData.recommendedPrompts.slice(0, 3)
    : targetLanguagePrompts({
        targetLanguage: bridgeData.targetLanguage,
        title: bridgeData.topicTitle,
        fallbackTopic: bridgeData.practiceQuestion || bridgeData.topicTitle || t('bridge.defaultPromptAngle')
      }).slice(0, 1);
  const selectedPrompt = recommendedPrompts.find((prompt) => prompt.id === selectedPromptId);

  return (
    <motion.section className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 pt-5" {...pageTransition}>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-500">
          <Sparkles size={13} />
          {t('bridge.eyebrow')}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{bridgeData.topicTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{bridgeData.summary}</p>
      </div>

      <motion.div animate="show" className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto" initial="hidden">
        <BridgeSection icon={ListChecks} title={t('bridge.keyFacts')}>
          <div className="space-y-2">
            {bridgeData.keyFacts.map((fact, index) => (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-snug text-slate-700" key={fact}>
                {index + 1}. {fact}
              </p>
            ))}
          </div>
        </BridgeSection>

        <BridgeSection icon={Lightbulb} title={t('bridge.viewpoints')}>
          <div className="grid gap-2">
            {bridgeData.viewpoints.map((viewpoint) => (
              <p className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm leading-snug text-slate-700" key={viewpoint}>
                {viewpoint}
              </p>
            ))}
          </div>
        </BridgeSection>

        <BridgeSection icon={BookMarked} title={t('bridge.terms')}>
          <div className="flex flex-wrap gap-2">
            {bridgeData.targetTerms.map((term) => (
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-600" key={term}>
                {term}
              </span>
            ))}
          </div>
        </BridgeSection>

        <BridgeSection icon={BadgeCheck} title={t('bridge.recommendedPrompts')}>
          <p className="text-sm leading-relaxed text-slate-500">{t('bridge.promptIntro')}</p>
          <div className="mt-3 space-y-2">
            {recommendedPrompts.map((prompt) => {
              const selected = selectedPromptId === prompt.id;
              return (
                <button
                  className={`group w-full rounded-2xl border p-3 text-left transition active:scale-[0.99] disabled:opacity-55 ${
                    selected
                      ? 'border-violet-300 bg-gradient-to-r from-violet-50 to-sky-50 shadow-[0_10px_22px_rgba(99,102,241,0.12)]'
                      : 'border-slate-100 bg-white shadow-[0_8px_18px_rgba(99,102,241,0.06)]'
                  }`}
                  disabled={loading}
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  type="button"
                >
                  <span className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-500">{prompt.angleLabel}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        selected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 bg-slate-50 text-transparent'
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </span>
                  <span className="block text-sm font-black leading-snug text-slate-800">{prompt.questionText}</span>
                </button>
              );
            })}
          </div>
        </BridgeSection>
      </motion.div>

      <div className="mt-3 flex shrink-0 gap-2 border-t border-white/60 pt-3">
        <button
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/78 px-3 text-xs font-black text-slate-700"
          onClick={onContinue}
          type="button"
        >
          <ArrowLeft size={16} />
          {t('bridge.continue')}
        </button>
        <button
          className="flex min-h-11 flex-[1.25] items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-sky-400 px-3 text-xs font-black text-white shadow-[0_8px_18px_rgba(99,102,241,0.18)] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
          disabled={!selectedPrompt || loading}
          onClick={startPractice}
          type="button"
        >
          {loading ? t('loading.preparingSpeak') : selectedPrompt ? t('bridge.startSelectedPrompt') : t('bridge.choosePromptFirst')}
        </button>
      </div>
    </motion.section>
  );
}
