const promptCopy = {
  en: {
    opinion: 'Pros and cons',
    facts: 'Explain the facts',
    impact: 'Future impact',
    opinionQuestion: (topic) => `Do the benefits of ${topic} outweigh the risks? Explain your answer.`,
    factsQuestion: (topic) => `Why is ${topic} important to understand? Use one key fact in your answer.`,
    impactQuestion: (topic) => `What might ${topic} suggest about the future? Give your opinion with one example.`
  },
  'zh-CN': {
    opinion: '利弊分析',
    facts: '事实解释',
    impact: '未来影响',
    opinionQuestion: (topic) => `${topic} 的好处是否大于风险？请说明你的看法。`,
    factsQuestion: (topic) => `为什么 ${topic} 值得理解？请用一个关键事实说明。`,
    impactQuestion: (topic) => `${topic} 对未来可能有什么影响？请结合一个例子说明。`
  },
  fr: {
    opinion: 'Avantages et risques',
    facts: 'Explication des faits',
    impact: 'Impact futur',
    opinionQuestion: (topic) => `Les avantages de ${topic} l'emportent-ils sur les risques ? Explique ta reponse.`,
    factsQuestion: (topic) => `Pourquoi est-il important de comprendre ${topic} ? Utilise un fait cle dans ta reponse.`,
    impactQuestion: (topic) => `Que peut suggerer ${topic} pour l'avenir ? Donne ton opinion avec un exemple.`
  },
  de: {
    opinion: 'Vor- und Nachteile',
    facts: 'Fakten erklaren',
    impact: 'Zukunftswirkung',
    opinionQuestion: (topic) => `Uberwiegen bei ${topic} die Vorteile die Risiken? Begrunde deine Antwort.`,
    factsQuestion: (topic) => `Warum ist ${topic} wichtig zu verstehen? Nutze einen zentralen Fakt in deiner Antwort.`,
    impactQuestion: (topic) => `Was konnte ${topic} fur die Zukunft bedeuten? Gib deine Meinung mit einem Beispiel.`
  },
  es: {
    opinion: 'Pros y contras',
    facts: 'Explicar hechos',
    impact: 'Impacto futuro',
    opinionQuestion: (topic) => `Los beneficios de ${topic} superan los riesgos? Explica tu respuesta.`,
    factsQuestion: (topic) => `Por que es importante entender ${topic}? Usa un dato clave en tu respuesta.`,
    impactQuestion: (topic) => `Que podria sugerir ${topic} sobre el futuro? Da tu opinion con un ejemplo.`
  }
};

function copyFor(language = 'en') {
  return promptCopy[language] || promptCopy[language.split('-')[0]] || promptCopy.en;
}

function topicForLanguage(topic, targetLanguage) {
  if (!topic) return '';
  if (targetLanguage.startsWith('zh')) return topic;

  const parenthetical = topic.match(/\(([^)]+)\)/)?.[1];
  if (parenthetical && !/[\u4e00-\u9fff]/.test(parenthetical)) return parenthetical;
  if (/[\u4e00-\u9fff]/.test(topic)) return 'this topic';
  return topic;
}

export function targetLanguagePrompts({ targetLanguage = 'en', title = '', fallbackTopic = 'this topic' } = {}) {
  const copy = copyFor(targetLanguage);
  const topic = topicForLanguage(title, targetLanguage) || fallbackTopic;

  return [
    {
      id: 'prompt_1',
      angleLabel: copy.opinion,
      questionText: copy.opinionQuestion(topic)
    },
    {
      id: 'prompt_2',
      angleLabel: copy.facts,
      questionText: copy.factsQuestion(topic)
    },
    {
      id: 'prompt_3',
      angleLabel: copy.impact,
      questionText: copy.impactQuestion(topic)
    }
  ];
}
