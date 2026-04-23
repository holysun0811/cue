export const HOME_RECENT_LIMIT = 8;
export const PRACTICE_HISTORY_LIMIT = 40;

const MODE_EMOJI = {
  exam: '🎙️',
  explore: '🌍',
  learn: '📚',
  oral: '🗣️',
  practice: '🎯'
};

const MODE_LABEL_KEYS = {
  exam: 'home.recentModes.exam',
  explore: 'home.recentModes.explore',
  learn: 'home.recentModes.learn',
  oral: 'home.recentModes.oral',
  practice: 'home.recentModes.practice'
};

export const ORAL_EXAM_COVER = {
  type: 'mode_default',
  coverVariant: 'oral-exam',
  emoji: '🎙️',
  gradient: 'from-[#FF7C5A] via-[#F25A3A] to-[#E0432A]',
  label: 'Oral Exam'
};

export const FILE_MATERIAL_COVER = {
  type: 'file',
  coverVariant: 'material-file',
  emoji: '📄',
  gradient: 'from-[#475569] via-[#64748B] to-[#0F766E]',
  label: 'Material'
};

export const EXPLORE_CATEGORY_COVERS = {
  science: {
    type: 'category_default',
    coverVariant: 'science-lab',
    emoji: '🔬',
    gradient: 'from-[#3B82F6] via-[#6366F1] to-[#8B5CF6]',
    label: 'Science Lab'
  },
  history: {
    type: 'category_default',
    coverVariant: 'history-walk',
    emoji: '🏛️',
    gradient: 'from-[#F59E0B] via-[#F97316] to-[#EF4444]',
    label: 'History Walk'
  },
  technology: {
    type: 'category_default',
    coverVariant: 'tech-talk',
    emoji: '🤖',
    gradient: 'from-[#14B8A6] via-[#10B981] to-[#059669]',
    label: 'Tech Talk'
  },
  art: {
    type: 'category_default',
    coverVariant: 'art-gallery',
    emoji: '🎨',
    gradient: 'from-[#EC4899] via-[#D946EF] to-[#8B5CF6]',
    label: 'Art Gallery'
  },
  custom: {
    type: 'category_default',
    coverVariant: 'custom-topic',
    emoji: '🧭',
    gradient: 'from-[#0F766E] via-[#2563EB] to-[#7C3AED]',
    label: 'Custom Topic'
  }
};

const CATEGORY_KEYWORDS = [
  {
    category: 'science',
    words: ['science', 'biology', 'medicine', 'medical', 'clone', 'cloning', 'genetic', 'genetics', 'dna', 'cell', 'research', 'dolly', '生物', '医学', '基因', '克隆']
  },
  {
    category: 'history',
    words: ['history', 'war', 'ancient', 'renaissance', 'civilization', 'empire', 'revolution', 'historical', '历史', '战争', '古代', '文艺复兴', '文明']
  },
  {
    category: 'technology',
    words: ['technology', 'tech', 'ai', 'artificial intelligence', 'robot', 'robots', 'internet', 'future', 'digital', '科技', '人工智能', '机器人', '互联网', '未来']
  },
  {
    category: 'art',
    words: ['art', 'painting', 'design', 'culture', 'artist', 'literature', 'gallery', 'novel', 'poem', '艺术', '绘画', '设计', '文化', '文学']
  }
];

function asTimestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function safeIso(value) {
  return value || new Date().toISOString();
}

function userTurns(messages = []) {
  return messages.filter((message) => message.role === 'user').length;
}

function normalizeSourceType(sourceType, imageBase64) {
  if (imageBase64) return 'image_material';
  if (sourceType === 'material') return 'file_material';
  if (sourceType === 'prompt' || sourceType === 'text') return 'text_input';
  if (sourceType === 'topic' || sourceType === 'voice') return 'voice_input';
  return sourceType || 'text_input';
}

function detectExploreCategory(text = '') {
  const normalized = text.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(({ words }) => words.some((word) => normalized.includes(word)));
  return match?.category || 'custom';
}

function imageCoverPayload(imageUrl) {
  return {
    type: 'image',
    coverVariant: 'image-material',
    imageUrl,
    emoji: '🖼️',
    gradient: 'from-[#0F766E] via-[#2563EB] to-[#7C3AED]',
    label: 'Image material'
  };
}

export function buildPresetTopicCoverMetadata(topic = {}, t = (key) => key) {
  const title = topic.titleKey ? t(topic.titleKey) : topic.title || '';
  const subtitle = topic.subtitleKey ? t(topic.subtitleKey) : topic.subtitle || '';

  return {
    sourceType: 'preset_topic',
    presetTopicId: topic.id,
    presetTopicTitle: title,
    presetTopicSubtitle: subtitle,
    presetTopicCoverVariant: topic.id,
    presetTopicIcon: topic.emoji,
    presetTopicGradient: topic.gradient,
    coverType: 'preset',
    coverPayload: {
      type: 'preset',
      coverVariant: topic.id,
      emoji: topic.emoji,
      gradient: topic.gradient,
      label: title,
      title,
      subtitle
    }
  };
}

export function buildExploreCoverMetadata({ sourceType, text = '', imageBase64 = '' } = {}) {
  const normalizedSourceType = normalizeSourceType(sourceType, imageBase64);

  if (normalizedSourceType === 'image_material') {
    return {
      sourceType: 'image_material',
      coverType: 'image',
      coverPayload: imageCoverPayload(imageBase64)
    };
  }

  if (normalizedSourceType === 'file_material') {
    return {
      sourceType: 'file_material',
      coverType: 'file',
      coverPayload: FILE_MATERIAL_COVER
    };
  }

  const category = detectExploreCategory(text);
  return {
    sourceType: normalizedSourceType,
    coverType: 'category_default',
    coverPayload: EXPLORE_CATEGORY_COVERS[category]
  };
}

export function buildExamCoverMetadata({ sourceType, imageBase64 = '' } = {}) {
  const normalizedSourceType = normalizeSourceType(sourceType, imageBase64);

  if (normalizedSourceType === 'image_material') {
    return {
      sourceType: 'image_material',
      coverType: 'image',
      coverPayload: imageCoverPayload(imageBase64)
    };
  }

  if (normalizedSourceType === 'file_material') {
    return {
      sourceType: 'file_material',
      coverType: 'file',
      coverPayload: FILE_MATERIAL_COVER
    };
  }

  return {
    sourceType: normalizedSourceType,
    coverType: 'mode_default',
    coverPayload: ORAL_EXAM_COVER
  };
}

export function copyRecentCoverMetadata(source = {}) {
  return {
    sourceType: source.sourceType,
    presetTopicId: source.presetTopicId,
    presetTopicTitle: source.presetTopicTitle,
    presetTopicSubtitle: source.presetTopicSubtitle,
    presetTopicCoverVariant: source.presetTopicCoverVariant,
    presetTopicIcon: source.presetTopicIcon,
    presetTopicGradient: source.presetTopicGradient,
    coverType: source.coverType,
    coverPayload: source.coverPayload
  };
}

export function stampSession(value = {}, previous = {}) {
  const now = new Date().toISOString();
  return {
    ...value,
    createdAt: value.createdAt || previous.createdAt || now,
    updatedAt: now
  };
}

export function resolveSpeakMode(session = {}) {
  const mode = `${session.mode || ''}`.toLowerCase();
  if (mode === 'exam') return 'exam';
  if (mode === 'learn') return 'learn';
  if (mode === 'oral') return 'oral';
  if (session.promptSource === 'bridge' || session.entryType === 'bridge') return 'oral';
  return mode === 'practice' || !mode ? 'oral' : mode;
}

export function routeForSpeakSession(session = {}) {
  if (session.lastRoute?.startsWith('/speak/')) return session.lastRoute;
  if (session.latestReview) return '/speak/review';
  if ((session.conversationMessages || []).length) return '/speak/practice';
  return '/speak/prep';
}

export function buildLearnHistoryItem(learnSession = {}) {
  if (!learnSession.learnSessionId) return null;
  const updatedAt = safeIso(learnSession.updatedAt || learnSession.createdAt);
  const fallbackCover = buildExploreCoverMetadata({
    sourceType: learnSession.sourceType,
    text: learnSession.topicOrMaterial || learnSession.title || ''
  });
  const coverMetadata = learnSession.coverPayload ? copyRecentCoverMetadata(learnSession) : fallbackCover;

  return {
    id: `learn:${learnSession.learnSessionId}`,
    source: 'learn',
    mode: learnSession.mode || 'explore',
    title: learnSession.presetTopicTitle || learnSession.title || learnSession.topicOrMaterial || '',
    emoji: coverMetadata.coverPayload?.emoji || learnSession.emoji || MODE_EMOJI.explore,
    ...coverMetadata,
    createdAt: safeIso(learnSession.createdAt || updatedAt),
    updatedAt,
    lastRoute: learnSession.lastRoute || `/learn/${learnSession.learnSessionId}`,
    snapshot: {
      ...learnSession,
      lastRoute: learnSession.lastRoute || `/learn/${learnSession.learnSessionId}`
    }
  };
}

export function buildSpeakHistoryItem(session = {}) {
  if (!session.sessionId) return null;
  const mode = resolveSpeakMode(session);
  const updatedAt = safeIso(session.updatedAt || session.createdAt);
  const title = session.promptSummary || session.canonicalPrompt || session.selectedPrompt?.questionText || '';
  const fallbackCover = mode === 'exam'
    ? buildExamCoverMetadata({ sourceType: session.sourceType })
    : buildExploreCoverMetadata({ sourceType: session.sourceType, text: title });
  const coverMetadata = session.coverPayload ? copyRecentCoverMetadata(session) : fallbackCover;

  return {
    id: `speak:${session.sessionId}`,
    source: 'speak',
    mode,
    title: session.presetTopicTitle || title,
    emoji: coverMetadata.coverPayload?.emoji || session.emoji || MODE_EMOJI[mode] || MODE_EMOJI.practice,
    ...coverMetadata,
    createdAt: safeIso(session.createdAt || updatedAt),
    updatedAt,
    lastRoute: routeForSpeakSession(session),
    snapshot: {
      ...session,
      lastRoute: routeForSpeakSession(session)
    }
  };
}

export function sortPracticeHistory(items = []) {
  return [...items].sort((a, b) => asTimestamp(b.updatedAt) - asTimestamp(a.updatedAt));
}

export function upsertPracticeHistory(history = [], item) {
  if (!item?.id) return history;

  const next = [
    item,
    ...history.filter((current) => current.id !== item.id)
  ];

  return sortPracticeHistory(next).slice(0, PRACTICE_HISTORY_LIMIT);
}

export function formatRelativeTime(value, language = 'en') {
  const timestamp = asTimestamp(value);
  if (!timestamp) return '';

  const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const divisions = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.345, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
  ];
  let duration = deltaSeconds;

  try {
    const formatter = new Intl.RelativeTimeFormat(language || 'en', { numeric: 'auto' });
    for (const division of divisions) {
      if (Math.abs(duration) < division.amount) {
        return formatter.format(Math.round(duration), division.unit);
      }
      duration /= division.amount;
    }
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }

  return new Date(timestamp).toLocaleDateString();
}

function modeLabel(mode, t) {
  const key = MODE_LABEL_KEYS[mode] || MODE_LABEL_KEYS.practice;
  return t(key);
}

function titleForItem(item, t) {
  if (item.title) return item.title;
  if (item.source === 'learn') return t('home.recentFallbackExploreTitle');
  return t('home.recentFallbackOralTitle');
}

function detailForItem(item, t) {
  const snapshot = item.snapshot || {};

  if (item.source === 'learn') {
    const turns = userTurns(snapshot.chatHistory || []);
    return turns === 1 ? t('home.recentTurnsOne') : t('home.recentTurns', { count: turns });
  }

  const turns = userTurns(snapshot.conversationMessages || []);
  if (turns > 0) {
    return turns === 1 ? t('home.recentTurnsOne') : t('home.recentTurns', { count: turns });
  }

  return t('home.recentRound', { round: snapshot.round || 1 });
}

export function describePracticeHistoryItem(item, { language = 'en', t } = {}) {
  const label = modeLabel(item.mode, t);
  const detail = detailForItem(item, t);
  const updatedLabel = formatRelativeTime(item.updatedAt, language);

  return {
    ...item,
    detail,
    modeLabel: label,
    meta: [label, detail, updatedLabel].filter(Boolean).join(' · '),
    secondaryMeta: [detail, updatedLabel].filter(Boolean).join(' · '),
    title: titleForItem(item, t),
    updatedLabel
  };
}

export function describePracticeHistoryItems(history = [], options = {}) {
  return sortPracticeHistory(history).map((item) => describePracticeHistoryItem(item, options));
}
