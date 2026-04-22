import { createId } from '../utils/ids.js';

export const MOCK_AUDIO_URL =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

const TASK_SUMMARY_BY_TYPE = {
  describe_photo: 'Describe a school-related image clearly with one main observation and one detail.',
  answer_prompt: 'Answer the school prompt with a clear opinion, one reason, and one example.',
  summarize_text: 'Summarize the text briefly, then explain the main idea in your own words.',
  short_presentation: 'Give a short presentation with a clear opening, one main point, and a simple conclusion.'
};

const TASK_SUMMARY_BY_LANGUAGE = {
  en: TASK_SUMMARY_BY_TYPE,
  'zh-CN': {
    describe_photo: '请清楚描述一张和学校相关的图片，包含一个主要观察和一个细节。',
    answer_prompt: '用清楚的观点、一个理由和一个例子回答这道口语题。',
    summarize_text: '先简短总结文本，再用自己的话解释主要意思。',
    short_presentation: '做一个短展示：开头清楚、一个重点、一个简单结论。'
  },
  fr: {
    describe_photo: 'Decris clairement une image scolaire avec une observation principale et un detail.',
    answer_prompt: 'Reponds au sujet avec une opinion claire, une raison et un exemple.',
    summarize_text: 'Resume brievement le texte, puis explique lidee principale avec tes mots.',
    short_presentation: 'Fais une courte presentation avec une introduction claire, un point principal et une conclusion simple.'
  },
  de: {
    describe_photo: 'Beschreibe ein schulbezogenes Bild klar mit einer Hauptbeobachtung und einem Detail.',
    answer_prompt: 'Beantworte die Aufgabe mit einer klaren Meinung, einem Grund und einem Beispiel.',
    summarize_text: 'Fasse den Text kurz zusammen und erklaere dann die Hauptidee in eigenen Worten.',
    short_presentation: 'Halte eine kurze Praesentation mit klarem Anfang, einem Hauptpunkt und einfachem Schluss.'
  },
  es: {
    describe_photo: 'Describe claramente una imagen escolar con una observacion principal y un detalle.',
    answer_prompt: 'Responde al tema con una opinion clara, una razon y un ejemplo.',
    summarize_text: 'Resume brevemente el texto y luego explica la idea principal con tus propias palabras.',
    short_presentation: 'Haz una presentacion corta con una apertura clara, un punto principal y una conclusion simple.'
  }
};

function topicTitleFromInput(topicOrMaterial = '') {
  const trimmed = topicOrMaterial.trim();
  if (!trimmed) return 'Untitled topic';
  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
}

function topicForTargetLanguage(topicTitle, targetLanguage) {
  if (!topicTitle) return 'this topic';
  if (targetLanguage.startsWith('zh')) return topicTitle;

  const parenthetical = topicTitle.match(/\(([^)]+)\)/)?.[1];
  if (parenthetical && !/[\u4e00-\u9fff]/.test(parenthetical)) return parenthetical;
  return /[\u4e00-\u9fff]/.test(topicTitle) ? 'this topic' : topicTitle;
}

function languageKey(language = 'en') {
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('fr')) return 'fr';
  if (language.startsWith('de')) return 'de';
  if (language.startsWith('es')) return 'es';
  return 'en';
}

const APP_COPY = {
  en: {
    custom: 'Custom',
    approaches: [
      ['Balanced', 'Explain the benefit, name the risk, then give a balanced conclusion.'],
      ['Benefit-led', 'Lead with the positive impact, then add one manageable concern.'],
      ['Risk-focused', 'Lead with the main concern and explain why caution matters.']
    ],
    cloningApproaches: [
      ['Balanced', 'Start with medical potential, discuss ethical risks, then give cautious support.'],
      ['Benefit-led', 'Emphasize medical progress and frame ethical risks as something regulation can manage.'],
      ['Risk-focused', 'Start with ethical boundaries, then explain why benefits do not erase the risks.']
    ],
    learnIntro: (title) => `Let's first understand "${title}" clearly.`,
    learnOpening: (title) => `Let's first understand "${title}" clearly. I will keep the explanation in the app language and save speaking practice for later.`,
    questions: (title) => [
      `What is the most important thing to understand about ${title}?`,
      `What is one controversy or tension behind ${title}?`,
      `How could I explain ${title} in a short oral answer?`
    ],
    facts: (title) => [
      `${title} can be explained through one clear background fact.`,
      `A strong answer should connect ${title} to real life or society.`
    ],
    viewpoint: (title) => `${title} has both benefits and possible concerns.`,
    message: (title) => `Start with the basic background of ${title}, then look at its real-life impact. Keep a few practice terms for later.`,
    definitionFact: (title) => `${title} needs a clear definition before giving an opinion.`,
    tension: (title) => `One useful tension is the benefit of ${title} versus its possible risks.`,
    angle: (title) => `Do the benefits of ${title} outweigh the risks?`,
    bridgeHint: 'Start with background, then give your position.',
    bridgeSummary: (title) => `${title} is a topic you can explain by connecting the basic background, a real-world impact, and a balanced opinion.`,
    bridgeFact1: (title) => `${title} has a clear background that should be introduced first.`,
    bridgeFact2: (title) => `${title} affects how people think, learn, or make decisions.`,
    bridgeFact3: 'A strong oral answer should include one concrete example.',
    bridgeView1: (title) => `${title} can bring meaningful benefits.`,
    bridgeView2: (title) => `${title} can also create risks or ethical concerns.`,
    promptLabels: ['Pros and cons', 'Explain the facts', 'Future impact'],
    reviewSummary: 'Clear idea, but the structure needs one stronger example.',
    reviewIssues: ['Start with your opinion earlier.', 'Add one concrete example.', 'End with a stronger conclusion.'],
    take2Goal: 'Add one concrete example.'
  },
  'zh-CN': {
    custom: '自定义思路',
    approaches: [
      ['平衡分析', '先说明好处，再指出风险，最后给出平衡结论。'],
      ['支持价值', '重点强调积极影响，再补充一个可管理的担忧。'],
      ['强调风险', '先指出主要问题，再说明为什么需要谨慎对待。']
    ],
    cloningApproaches: [
      ['平衡分析', '先承认医学潜力，再讨论伦理风险，最后给出谨慎支持。'],
      ['支持价值', '重点强调医学突破，把伦理风险表述为可监管问题。'],
      ['强调风险', '先强调伦理边界，再说明科学收益不能完全抵消风险。']
    ],
    learnOpening: (title) => `我们先把「${title}」讲清楚。我会用 App language 帮你理解，真正要开口练的内容之后再用 Practice language。`,
    questions: (title) => [`理解 ${title} 最重要的一点是什么？`, `${title} 背后有什么争议或张力？`, `如果要口头回答，可以怎么简短说明 ${title}？`],
    facts: (title) => [`${title} 可以先用一个清楚的背景事实解释。`, `好的回答要把 ${title} 和现实生活或社会影响联系起来。`],
    viewpoint: (title) => `${title} 既有好处，也可能带来担忧。`,
    message: (title) => `可以先从 ${title} 的背景理解起，再看它对现实生活的影响。表达用词先收集起来，等到练口语时再用。`,
    definitionFact: (title) => `${title} 在表达观点前需要先定义清楚。`,
    tension: (title) => `一个有用的张力是：${title} 的好处和潜在风险之间的关系。`,
    angle: (title) => `${title} 的好处是否大于风险？`,
    bridgeHint: '先说明背景，再表达态度。',
    bridgeSummary: (title) => `${title} 可以通过背景事实、现实影响和平衡观点来组织。`,
    bridgeFact1: (title) => `${title} 需要先交代一个清楚的背景。`,
    bridgeFact2: (title) => `${title} 会影响人们的思考、学习或决策。`,
    bridgeFact3: '好的口头回答需要包含一个具体例子。',
    bridgeView1: (title) => `${title} 可能带来有意义的好处。`,
    bridgeView2: (title) => `${title} 也可能带来风险或伦理担忧。`,
    promptLabels: ['利弊分析', '事实解释', '未来影响'],
    reviewSummary: '想法清楚，但结构还需要一个更有力的例子。',
    reviewIssues: ['更早说出你的观点。', '加入一个具体例子。', '用更明确的结论收尾。'],
    take2Goal: '加入一个具体例子。'
  },
  fr: {
    custom: 'Personnalise',
    approaches: [
      ['Equilibre', 'Presente un avantage, nomme un risque, puis donne une conclusion nuancee.'],
      ['Avantage', "Commence par l'effet positif, puis ajoute une inquietude gerable."],
      ['Risque', 'Commence par le probleme principal et explique pourquoi la prudence compte.']
    ],
    cloningApproaches: [
      ['Equilibre', 'Commence par le potentiel medical, puis les risques ethiques, et finis avec un soutien prudent.'],
      ['Avantage', 'Souligne le progres medical et presente les risques comme regulables.'],
      ['Risque', 'Pars des limites ethiques, puis montre que les benefices ne les effacent pas.']
    ],
    learnOpening: (title) => `Commencons par bien comprendre "${title}". Je garde les explications dans la langue de l'app, puis la pratique orale viendra apres.`,
    questions: (title) => [`Quel est le point essentiel a comprendre sur ${title} ?`, `Quelle tension ou controverse existe autour de ${title} ?`, `Comment expliquer ${title} dans une reponse orale courte ?`],
    facts: (title) => [`${title} peut etre explique avec un fait de contexte clair.`, `Une bonne reponse doit relier ${title} a la vie reelle ou a la societe.`],
    viewpoint: (title) => `${title} a des avantages et aussi des points d'inquietude.`,
    message: (title) => `Commence par le contexte de ${title}, puis observe son effet dans la vie reelle. Nous garderons quelques termes utiles pour la pratique.`,
    definitionFact: (title) => `${title} demande une definition claire avant de donner un avis.`,
    tension: (title) => `Une tension utile oppose les benefices de ${title} a ses risques possibles.`,
    angle: (title) => `Les benefices de ${title} depassent-ils les risques ?`,
    bridgeHint: 'Commence par le contexte, puis donne ta position.',
    bridgeSummary: (title) => `${title} peut etre organise avec le contexte, un effet concret et une opinion nuancee.`,
    bridgeFact1: (title) => `${title} demande d'abord un contexte clair.`,
    bridgeFact2: (title) => `${title} influence la facon de penser, d'apprendre ou de decider.`,
    bridgeFact3: 'Une bonne reponse orale inclut un exemple concret.',
    bridgeView1: (title) => `${title} peut apporter des benefices importants.`,
    bridgeView2: (title) => `${title} peut aussi creer des risques ou des questions ethiques.`,
    promptLabels: ['Avantages et risques', 'Expliquer les faits', 'Impact futur'],
    reviewSummary: 'Lidee est claire, mais la structure a besoin dun exemple plus fort.',
    reviewIssues: ['Donne ton opinion plus tot.', 'Ajoute un exemple concret.', 'Termine avec une conclusion plus nette.'],
    take2Goal: 'Ajoute un exemple concret.'
  },
  de: {
    custom: 'Eigener Ansatz',
    approaches: [
      ['Ausgewogen', 'Erklaere den Nutzen, nenne ein Risiko und ende mit einem ausgewogenen Fazit.'],
      ['Nutzen zuerst', 'Beginne mit der positiven Wirkung und ergaenze eine kontrollierbare Sorge.'],
      ['Risiko zuerst', 'Beginne mit dem Hauptproblem und erklaere, warum Vorsicht wichtig ist.']
    ],
    cloningApproaches: [
      ['Ausgewogen', 'Beginne mit medizinischem Potenzial, bespreche ethische Risiken und ende vorsichtig zustimmend.'],
      ['Nutzen zuerst', 'Betone medizinischen Fortschritt und stelle ethische Risiken als regulierbar dar.'],
      ['Risiko zuerst', 'Beginne mit ethischen Grenzen und zeige, dass Nutzen die Risiken nicht aufhebt.']
    ],
    learnOpening: (title) => `Lass uns zuerst "${title}" klar verstehen. Ich erklaere in der App-Sprache; die Sprechpraxis kommt danach.`,
    questions: (title) => [`Was ist das Wichtigste an ${title}?`, `Welche Spannung oder Kontroverse gibt es bei ${title}?`, `Wie kann man ${title} kurz muendlich erklaeren?`],
    facts: (title) => [`${title} laesst sich mit einem klaren Hintergrundfakt erklaeren.`, `Eine starke Antwort verbindet ${title} mit Alltag oder Gesellschaft.`],
    viewpoint: (title) => `${title} hat Vorteile und auch moegliche Bedenken.`,
    message: (title) => `Beginne mit dem Hintergrund von ${title}, dann betrachte die Wirkung im echten Leben. Die passenden Uebungsbegriffe sammeln wir fuer spaeter.`,
    definitionFact: (title) => `${title} braucht eine klare Definition, bevor du eine Meinung gibst.`,
    tension: (title) => `Eine hilfreiche Spannung ist der Nutzen von ${title} gegenueber moeglichen Risiken.`,
    angle: (title) => `Ueberwiegen bei ${title} die Vorteile die Risiken?`,
    bridgeHint: 'Beginne mit dem Hintergrund und gib dann deine Position.',
    bridgeSummary: (title) => `${title} kann mit Hintergrund, realer Wirkung und ausgewogener Meinung strukturiert werden.`,
    bridgeFact1: (title) => `${title} braucht zuerst einen klaren Hintergrund.`,
    bridgeFact2: (title) => `${title} beeinflusst, wie Menschen denken, lernen oder entscheiden.`,
    bridgeFact3: 'Eine gute muendliche Antwort enthaelt ein konkretes Beispiel.',
    bridgeView1: (title) => `${title} kann wichtige Vorteile bringen.`,
    bridgeView2: (title) => `${title} kann auch Risiken oder ethische Fragen schaffen.`,
    promptLabels: ['Pro und Contra', 'Fakten erklaeren', 'Zukuenftige Wirkung'],
    reviewSummary: 'Die Idee ist klar, aber die Struktur braucht ein staerkeres Beispiel.',
    reviewIssues: ['Nenne deine Meinung frueher.', 'Fuege ein konkretes Beispiel hinzu.', 'Ende mit einem klareren Fazit.'],
    take2Goal: 'Fuege ein konkretes Beispiel hinzu.'
  },
  es: {
    custom: 'Personalizado',
    approaches: [
      ['Equilibrado', 'Explica el beneficio, menciona el riesgo y termina con una conclusion equilibrada.'],
      ['Beneficio primero', 'Empieza con el impacto positivo y anade una preocupacion manejable.'],
      ['Riesgo primero', 'Empieza con el problema principal y explica por que hace falta cautela.']
    ],
    cloningApproaches: [
      ['Equilibrado', 'Empieza con el potencial medico, analiza riesgos eticos y termina con apoyo prudente.'],
      ['Beneficio primero', 'Destaca el progreso medico y presenta los riesgos como algo regulable.'],
      ['Riesgo primero', 'Empieza con limites eticos y muestra que los beneficios no eliminan los riesgos.']
    ],
    learnOpening: (title) => `Primero entendamos bien "${title}". Mantengo la explicacion en el idioma de la app y dejamos la practica oral para despues.`,
    questions: (title) => [`Que es lo mas importante de ${title}?`, `Que tension o controversia hay detras de ${title}?`, `Como podria explicar ${title} en una respuesta oral corta?`],
    facts: (title) => [`${title} se puede explicar con un dato de contexto claro.`, `Una buena respuesta conecta ${title} con la vida real o la sociedad.`],
    viewpoint: (title) => `${title} tiene beneficios y tambien posibles preocupaciones.`,
    message: (title) => `Empieza con el contexto de ${title} y luego mira su impacto real. Guardaremos algunos terminos utiles para practicar despues.`,
    definitionFact: (title) => `${title} necesita una definicion clara antes de dar una opinion.`,
    tension: (title) => `Una tension util es el beneficio de ${title} frente a sus posibles riesgos.`,
    angle: (title) => `Los beneficios de ${title} superan los riesgos?`,
    bridgeHint: 'Empieza con el contexto y luego da tu posicion.',
    bridgeSummary: (title) => `${title} se puede organizar con contexto, impacto real y una opinion equilibrada.`,
    bridgeFact1: (title) => `${title} necesita primero un contexto claro.`,
    bridgeFact2: (title) => `${title} influye en como la gente piensa, aprende o decide.`,
    bridgeFact3: 'Una buena respuesta oral incluye un ejemplo concreto.',
    bridgeView1: (title) => `${title} puede aportar beneficios importantes.`,
    bridgeView2: (title) => `${title} tambien puede crear riesgos o preocupaciones eticas.`,
    promptLabels: ['Pros y contras', 'Explicar hechos', 'Impacto futuro'],
    reviewSummary: 'La idea es clara, pero la estructura necesita un ejemplo mas fuerte.',
    reviewIssues: ['Di tu opinion antes.', 'Anade un ejemplo concreto.', 'Termina con una conclusion mas clara.'],
    take2Goal: 'Anade un ejemplo concreto.'
  }
};

const PRACTICE_TERMS = {
  en: ['background', 'impact', 'trade-off'],
  'zh-CN': ['背景', '影响', '取舍'],
  fr: ['contexte', 'impact', 'compromis'],
  de: ['Hintergrund', 'Wirkung', 'Abwaegung'],
  es: ['contexto', 'impacto', 'equilibrio']
};

const PLAN_COPY = {
  en: {
    opening: (kind) => (kind === 'risk' ? 'I think we should be careful because the risks are serious.' : kind === 'benefit' ? 'I think this topic has real value because it can help people.' : 'I think we need a balanced view of this question.'),
    point: (kind) => (kind === 'risk' ? 'One concern is that it can cross ethical boundaries if people use it too freely.' : kind === 'benefit' ? 'One reason is that it can create new possibilities in medicine and science.' : 'On one hand, it can bring important benefits in science and daily life.'),
    conclusion: (kind) => (kind === 'risk' ? 'So even if it has benefits, I think strict limits are necessary.' : kind === 'benefit' ? 'So I support using it carefully, as long as there are clear rules.' : 'On the other hand, we still need rules, so my support is cautious.'),
    keywords: (kind) => (kind === 'risk' ? ['careful view', 'ethical risk', 'strict limits'] : kind === 'benefit' ? ['real value', 'medical value', 'careful support'] : ['balanced view', 'benefit', 'balanced conclusion']),
    support: ['State your main view.', 'Give one reason.', 'Return to the prompt.'],
    roundGoal: 'Speak for 30-45 seconds.'
  },
  'zh-CN': {
    opening: (kind) => (kind === 'risk' ? '我认为我们需要谨慎，因为风险很严重。' : kind === 'benefit' ? '我认为这个话题有价值，因为它能帮助人们。' : '我认为这个问题需要平衡看待。'),
    point: (kind) => (kind === 'risk' ? '一个担忧是，如果使用太随意，它可能越过伦理边界。' : kind === 'benefit' ? '一个原因是，它能给医学和科学带来新可能。' : '一方面，它能给科学和日常生活带来重要好处。'),
    conclusion: (kind) => (kind === 'risk' ? '所以即使它有好处，我也认为必须有严格限制。' : kind === 'benefit' ? '所以我支持谨慎使用它，只要规则清楚。' : '另一方面，我们仍然需要规则，所以我的支持是谨慎的。'),
    keywords: (kind) => (kind === 'risk' ? ['谨慎观点', '伦理风险', '严格限制'] : kind === 'benefit' ? ['实际价值', '医学价值', '谨慎支持'] : ['平衡观点', '好处', '平衡结论']),
    support: ['先说主要观点。', '给出一个理由。', '回到题目收尾。'],
    roundGoal: '说 30-45 秒。'
  },
  fr: {
    opening: (kind) => (kind === 'risk' ? 'Je pense quil faut etre prudent, car les risques sont serieux.' : kind === 'benefit' ? 'Je pense que ce sujet a une vraie valeur, car il peut aider les gens.' : 'Je pense quil faut avoir une vision equilibree de cette question.'),
    point: (kind) => (kind === 'risk' ? 'Un risque est de depasser des limites ethiques si lusage est trop libre.' : kind === 'benefit' ? 'Une raison est quil peut ouvrir de nouvelles possibilites en medecine et en science.' : 'Dun cote, il peut apporter des benefices importants a la science et a la vie quotidienne.'),
    conclusion: (kind) => (kind === 'risk' ? 'Donc, meme sil a des benefices, des limites strictes sont necessaires.' : kind === 'benefit' ? 'Donc je le soutiens prudemment, avec des regles claires.' : 'De lautre cote, il faut encore des regles, donc mon soutien reste prudent.'),
    keywords: (kind) => (kind === 'risk' ? ['prudence', 'risque ethique', 'limites strictes'] : kind === 'benefit' ? ['vraie valeur', 'valeur medicale', 'soutien prudent'] : ['vision equilibree', 'benefice', 'conclusion nuancee']),
    support: ['Donne ton avis principal.', 'Ajoute une raison.', 'Reviens a la question.'],
    roundGoal: 'Parle pendant 30 a 45 secondes.'
  },
  de: {
    opening: (kind) => (kind === 'risk' ? 'Ich finde, wir sollten vorsichtig sein, weil die Risiken ernst sind.' : kind === 'benefit' ? 'Ich finde, dieses Thema hat echten Wert, weil es Menschen helfen kann.' : 'Ich finde, wir brauchen eine ausgewogene Sicht auf diese Frage.'),
    point: (kind) => (kind === 'risk' ? 'Eine Sorge ist, dass ethische Grenzen ueberschritten werden koennen.' : kind === 'benefit' ? 'Ein Grund ist, dass es neue Moeglichkeiten in Medizin und Wissenschaft schaffen kann.' : 'Einerseits kann es wichtige Vorteile fuer Wissenschaft und Alltag bringen.'),
    conclusion: (kind) => (kind === 'risk' ? 'Deshalb sind strenge Grenzen noetig, auch wenn es Vorteile gibt.' : kind === 'benefit' ? 'Deshalb unterstuetze ich es vorsichtig, solange es klare Regeln gibt.' : 'Andererseits brauchen wir Regeln, deshalb ist meine Zustimmung vorsichtig.'),
    keywords: (kind) => (kind === 'risk' ? ['vorsichtige Sicht', 'ethisches Risiko', 'strenge Grenzen'] : kind === 'benefit' ? ['echter Wert', 'medizinischer Wert', 'vorsichtige Zustimmung'] : ['ausgewogene Sicht', 'Vorteil', 'ausgewogenes Fazit']),
    support: ['Nenne deine Hauptmeinung.', 'Gib einen Grund.', 'Komm zur Frage zurueck.'],
    roundGoal: 'Sprich 30 bis 45 Sekunden.'
  },
  es: {
    opening: (kind) => (kind === 'risk' ? 'Creo que debemos tener cuidado porque los riesgos son serios.' : kind === 'benefit' ? 'Creo que este tema tiene valor real porque puede ayudar a la gente.' : 'Creo que necesitamos una vision equilibrada de esta pregunta.'),
    point: (kind) => (kind === 'risk' ? 'Una preocupacion es que puede cruzar limites eticos si se usa con demasiada libertad.' : kind === 'benefit' ? 'Una razon es que puede crear nuevas posibilidades en medicina y ciencia.' : 'Por un lado, puede traer beneficios importantes a la ciencia y a la vida diaria.'),
    conclusion: (kind) => (kind === 'risk' ? 'Por eso, aunque tenga beneficios, hacen falta limites estrictos.' : kind === 'benefit' ? 'Por eso lo apoyo con cuidado, siempre que haya reglas claras.' : 'Por otro lado, todavia necesitamos reglas, asi que mi apoyo es prudente.'),
    keywords: (kind) => (kind === 'risk' ? ['cautela', 'riesgo etico', 'limites estrictos'] : kind === 'benefit' ? ['valor real', 'valor medico', 'apoyo prudente'] : ['vision equilibrada', 'beneficio', 'conclusion equilibrada']),
    support: ['Di tu idea principal.', 'Da una razon.', 'Vuelve a la pregunta.'],
    roundGoal: 'Habla durante 30-45 segundos.'
  }
};

const PRACTICE_PROMPTS = {
  en: (topic) => ({
    opinionQuestion: `Do the benefits of ${topic} outweigh the risks? Explain your answer.`,
    factsQuestion: `Why is ${topic} important to understand? Use one key fact in your answer.`,
    impactQuestion: `What might ${topic} suggest about the future? Give your opinion with one example.`
  }),
  'zh-CN': (topic) => ({
    opinionQuestion: `你认为 ${topic} 的好处是否大于风险？请说明你的看法。`,
    factsQuestion: `为什么 ${topic} 值得理解？请用一个关键事实说明。`,
    impactQuestion: `${topic} 对未来可能有什么影响？请结合一个例子说明。`
  }),
  fr: (topic) => ({
    opinionQuestion: `Les avantages de ${topic} depassent-ils les risques ? Explique ta reponse.`,
    factsQuestion: `Pourquoi ${topic} est-il important a comprendre ? Utilise un fait cle.`,
    impactQuestion: `Que peut suggerer ${topic} pour lavenir ? Donne ton avis avec un exemple.`
  }),
  de: (topic) => ({
    opinionQuestion: `Ueberwiegen bei ${topic} die Vorteile die Risiken? Erklaere deine Antwort.`,
    factsQuestion: `Warum ist ${topic} wichtig zu verstehen? Nutze einen wichtigen Fakt.`,
    impactQuestion: `Was koennte ${topic} ueber die Zukunft zeigen? Gib deine Meinung mit einem Beispiel.`
  }),
  es: (topic) => ({
    opinionQuestion: `Los beneficios de ${topic} superan los riesgos? Explica tu respuesta.`,
    factsQuestion: `Por que es importante entender ${topic}? Usa un dato clave.`,
    impactQuestion: `Que podria sugerir ${topic} sobre el futuro? Da tu opinion con un ejemplo.`
  })
};

const REVIEW_VERSIONS = {
  en: {
    better: 'I think this topic matters because it affects students in real life. For example, it changes how we study and talk with others.',
    top: 'In my view, this topic is worth discussing because it connects directly to students’ daily lives. A simple example is the way it changes how we learn, communicate, and make decisions.'
  },
  'zh-CN': {
    better: '我认为这个话题很重要，因为它会影响学生的现实生活。比如，它会改变我们学习和交流的方式。',
    top: '在我看来，这个话题值得讨论，因为它和学生的日常生活直接相关。一个简单的例子是，它会改变我们学习、交流和做决定的方式。'
  },
  fr: {
    better: 'Je pense que ce sujet est important parce quil touche la vie reelle des eleves. Par exemple, il change notre facon dapprendre et de parler avec les autres.',
    top: 'A mon avis, ce sujet merite detre discute parce quil est lie directement a la vie quotidienne des eleves. Un exemple simple est la facon dont il change notre apprentissage, notre communication et nos decisions.'
  },
  de: {
    better: 'Ich finde dieses Thema wichtig, weil es Schueler im echten Leben betrifft. Zum Beispiel veraendert es, wie wir lernen und mit anderen sprechen.',
    top: 'Meiner Meinung nach ist dieses Thema wichtig, weil es direkt mit dem Alltag von Schuelern verbunden ist. Ein einfaches Beispiel ist, wie es unser Lernen, unsere Kommunikation und unsere Entscheidungen veraendert.'
  },
  es: {
    better: 'Creo que este tema importa porque afecta a los estudiantes en la vida real. Por ejemplo, cambia como estudiamos y hablamos con otras personas.',
    top: 'En mi opinion, vale la pena hablar de este tema porque se conecta directamente con la vida diaria de los estudiantes. Un ejemplo simple es como cambia nuestra forma de aprender, comunicarnos y tomar decisiones.'
  }
};

export function mockInputAnalysis({ taskType = 'answer_prompt', appLanguage = 'zh-CN', targetLanguage = 'en', text = '', imageBase64, audioBase64 }) {
  const taskSummaries = TASK_SUMMARY_BY_LANGUAGE[languageKey(targetLanguage)] || TASK_SUMMARY_BY_TYPE;
  const extractedText =
    text ||
    (imageBase64 && 'The uploaded image appears to contain a school speaking prompt.') ||
    (audioBase64 && 'I need to prepare an answer for a school speaking task.') ||
    taskSummaries[taskType];

  return {
    promptSummary: extractedText.length > 180 ? `${extractedText.slice(0, 177)}...` : extractedText,
    detectedAppLanguage: appLanguage,
    extractedText,
    suggestedTaskType: taskType
  };
}

function mockAnswerApproaches({ promptSummary = '', appLanguage = 'zh-CN' }) {
  const cloning = /clone|cloning|dolly|克隆/i.test(promptSummary);
  const copy = APP_COPY[languageKey(appLanguage)] || APP_COPY.en;
  const approaches = cloning ? copy.cloningApproaches : copy.approaches;
  return approaches.map(([label, summary], index) => ({
    id: `approach_${index + 1}`,
    label,
    summary
  }));
}

export function mockSpeakingPlan({ taskType = 'answer_prompt', promptSummary = '', appLanguage = 'zh-CN', targetLanguage = 'en', answerApproach = null } = {}) {
  const appCopy = APP_COPY[languageKey(appLanguage)] || APP_COPY.en;
  const planCopy = PLAN_COPY[languageKey(targetLanguage)] || PLAN_COPY.en;
  const recommendedApproaches = mockAnswerApproaches({ promptSummary, appLanguage });
  const selectedApproach = answerApproach?.summary
    ? {
        id: answerApproach.id || 'custom',
        label: answerApproach.label || appCopy.custom,
        summary: answerApproach.summary,
        custom: Boolean(answerApproach.custom)
      }
    : recommendedApproaches.find((approach) => approach.id === answerApproach?.id) || recommendedApproaches[0];
  const approachLabel = selectedApproach.label.toLowerCase();
  const isBenefit = /benefit|支持|value|价值/.test(approachLabel);
  const isRisk = /risk|风险|ethical|伦理/.test(approachLabel);
  const kind = isRisk ? 'risk' : isBenefit ? 'benefit' : 'balanced';
  const keywords = planCopy.keywords(kind);

  // Pre-generate speaking plans for all 3 recommended approaches using positional kind mapping:
  // index 0 → balanced, index 1 → benefit, index 2 → risk (consistent across all app languages)
  const POSITIONAL_KINDS = ['balanced', 'benefit', 'risk'];
  const allApproachPlans = recommendedApproaches.map((approach, index) => {
    const aKind = POSITIONAL_KINDS[index] || 'balanced';
    const aKeywords = planCopy.keywords(aKind);
    return {
      approachId: approach.id,
      speakingPlan: [
        { id: 'opening', text: planCopy.opening(aKind), keyword: aKeywords[0], supportText: planCopy.support[0] },
        { id: 'point_1', text: planCopy.point(aKind), keyword: aKeywords[1], supportText: planCopy.support[1] },
        { id: 'point_2_or_conclusion', text: planCopy.conclusion(aKind), keyword: aKeywords[2], supportText: planCopy.support[2] }
      ]
    };
  });

  return {
    sessionId: createId('sess'),
    taskType,
    promptSummary: promptSummary || TASK_SUMMARY_BY_TYPE[taskType],
    appLanguage,
    targetLanguage,
    recommendedApproaches,
    selectedApproach,
    allApproachPlans,
    speakingPlan: [
      {
        id: 'opening',
        text: planCopy.opening(kind),
        keyword: keywords[0],
        supportText: planCopy.support[0]
      },
      {
        id: 'point_1',
        text: planCopy.point(kind),
        keyword: keywords[1],
        supportText: planCopy.support[1]
      },
      {
        id: 'point_2_or_conclusion',
        text: planCopy.conclusion(kind),
        keyword: keywords[2],
        supportText: planCopy.support[2]
      }
    ],
    roundGoal: planCopy.roundGoal
  };
}

export function mockLearnStart({ topicOrMaterial = '', appLanguage = 'zh-CN', targetLanguage = 'en', persona = { type: 'guide', name: '' } }) {
  const title = topicTitleFromInput(topicOrMaterial);
  const personaName = persona?.name || (persona?.type === 'expert' ? 'a topic expert' : 'your learning guide');
  const copy = APP_COPY[languageKey(appLanguage)] || APP_COPY.en;
  const terms = PRACTICE_TERMS[languageKey(targetLanguage)] || PRACTICE_TERMS.en;

  return {
    title,
    openingMessage: copy.learnOpening(title),
    suggestedQuestions: copy.questions(title),
    persona: {
      type: persona?.type || 'guide',
      name: personaName
    },
    collectedState: {
      keyFacts: copy.facts(title),
      viewpoints: [copy.viewpoint(title)],
      targetTerms: terms,
      possibleQuestionAngles: [copy.angle(title)]
    }
  };
}

export function mockLearnMessage({ message = '', session = {}, appLanguage = 'zh-CN', targetLanguage = 'en' }) {
  const title = session.title || topicTitleFromInput(session.topicOrMaterial);
  const copy = APP_COPY[languageKey(appLanguage)] || APP_COPY.en;
  const terms = PRACTICE_TERMS[languageKey(targetLanguage)] || PRACTICE_TERMS.en;
  const collectedState = {
    keyFacts: [
      ...new Set([...(session.collectedState?.keyFacts || []), copy.definitionFact(title)])
    ].slice(0, 5),
    viewpoints: [
      ...new Set([...(session.collectedState?.viewpoints || []), copy.tension(title)])
    ].slice(0, 4),
    targetTerms: [...new Set([...(session.collectedState?.targetTerms || []), ...terms])].slice(0, 5),
    possibleQuestionAngles: [
      ...new Set([...(session.collectedState?.possibleQuestionAngles || []), copy.angle(title)])
    ].slice(0, 4)
  };

  return {
    assistantMessage: copy.message(title),
    collectedState,
    canBridge: collectedState.keyFacts.length >= 2 && collectedState.viewpoints.length >= 1
  };
}

export function mockBridge({ session = {}, appLanguage = 'zh-CN', targetLanguage = 'en' }) {
  const topicTitle = session.title || topicTitleFromInput(session.topicOrMaterial);
  const facts = session.collectedState?.keyFacts || [];
  const viewpoints = session.collectedState?.viewpoints || [];
  const terms = session.collectedState?.targetTerms || [];
  const appCopy = APP_COPY[languageKey(appLanguage)] || APP_COPY.en;
  const practiceTerms = PRACTICE_TERMS[languageKey(targetLanguage)] || PRACTICE_TERMS.en;
  const promptTopic = topicForTargetLanguage(topicTitle, targetLanguage);
  const labels = appCopy.promptLabels;
  const promptCopy = (PRACTICE_PROMPTS[languageKey(targetLanguage)] || PRACTICE_PROMPTS.en)(promptTopic);

  return {
    topicTitle,
    summary: appCopy.bridgeSummary(topicTitle),
    keyFacts: [
      facts[0] || appCopy.bridgeFact1(topicTitle),
      facts[1] || appCopy.bridgeFact2(topicTitle),
      facts[2] || appCopy.bridgeFact3
    ],
    viewpoints: [
      viewpoints[0] || appCopy.bridgeView1(topicTitle),
      viewpoints[1] || appCopy.bridgeView2(topicTitle)
    ],
    targetTerms: [
      terms[0] || practiceTerms[0],
      terms[1] || practiceTerms[1],
      terms[2] || practiceTerms[2]
    ],
    speakingAngle: appCopy.bridgeHint,
    practiceQuestion: promptCopy.opinionQuestion,
    recommendedPrompts: [
      {
        id: 'prompt_1',
        angleLabel: labels[0],
        questionText: promptCopy.opinionQuestion
      },
      {
        id: 'prompt_2',
        angleLabel: labels[1],
        questionText: promptCopy.factsQuestion
      },
      {
        id: 'prompt_3',
        angleLabel: labels[2],
        questionText: promptCopy.impactQuestion
      }
    ]
  };
}

export function mockPracticeSubmit({ sessionId, round = 1, transcript }) {
  return {
    attemptId: createId('att'),
    transcript:
      transcript ||
      'I think this topic is important because it affects students in real life. For example, it can change how people study and communicate.',
    durationSec: 34,
    sessionId,
    round
  };
}

export function mockSampleAnswer({ promptSummary = '', selectedPrompt, selectedApproach, targetLanguage = 'en' } = {}) {
  const approachLabel = (selectedApproach?.label || '').toLowerCase();
  const isBenefit = /benefit|支持|value|价值/.test(approachLabel);
  const isRisk = /risk|风险|ethical|伦理/.test(approachLabel);

  if (targetLanguage.startsWith('en')) {
    if (isRisk) {
      return 'I think we should be careful with this issue. The risks are serious. It may help science and medicine. But ethical limits are still important. If people use it too freely, problems can become hard to control. So progress matters, but it needs strict rules.';
    }

    if (isBenefit) {
      return 'I think this issue has real value. It can help people and create new possibilities. The risks are important. But they should not stop all progress. A better solution is to set clear rules. So I support it, as long as it is controlled responsibly.';
    }

    return 'I think this question needs a balanced answer. On one hand, this topic can bring important benefits. It can also help people understand science better. On the other hand, it raises risks. Those risks should not be ignored. So my view is cautious support, with clear limits.';
  }

  const planCopy = PLAN_COPY[languageKey(targetLanguage)] || PLAN_COPY.en;
  const kind = isRisk ? 'risk' : isBenefit ? 'benefit' : 'balanced';
  return [planCopy.opening(kind), planCopy.point(kind), planCopy.conclusion(kind)].join(' ');
}

export function mockReview({ appLanguage = 'en', targetLanguage = 'en', transcript = '' }) {
  const appCopy = APP_COPY[languageKey(appLanguage)] || APP_COPY.en;
  const versions = REVIEW_VERSIONS[languageKey(targetLanguage)] || REVIEW_VERSIONS.en;

  return {
    summary: appCopy.reviewSummary,
    topIssues: appCopy.reviewIssues,
    betterVersion: {
      text: versions.better,
      audioUrl: MOCK_AUDIO_URL
    },
    topVersion: {
      text: versions.top,
      audioUrl: MOCK_AUDIO_URL
    },
    scores: {
      fluency: transcript ? 74 : 70,
      vocabulary: 70,
      pronunciation: 72,
      structure: 78
    },
    take2Goal: appCopy.take2Goal,
    recommendedHintLevel: 'keywords'
  };
}
