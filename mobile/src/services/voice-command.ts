export type VoiceCommandAction = 'save_moment' | 'resume_playback' | 'ignore';
export type VoiceCommandIntent = 'summary' | 'organize' | 'idea' | 'research' | 'content_draft';

export type SaveVoiceCommand = {
  action: 'save_moment';
  intent: VoiceCommandIntent;
  matchedSavePhrase: string;
  matchedTrigger: string;
  memoTranscript: string;
  normalizedTranscript: string;
  originalTranscript: string;
  shouldResumePlayback: boolean;
  triggerTranscript: string;
};

export type ResumeVoiceCommand = {
  action: 'resume_playback';
  matchedTrigger: string;
  memoTranscript: '';
  normalizedTranscript: string;
  originalTranscript: string;
  shouldResumePlayback: true;
  triggerTranscript: string;
};

export type IgnoredVoiceCommand = {
  action: 'ignore';
  normalizedTranscript: string;
  originalTranscript: string;
  reason: 'empty' | 'missing_trigger' | 'missing_save_phrase' | 'save_before_trigger';
};

export type VoiceCommandParseResult = SaveVoiceCommand | ResumeVoiceCommand | IgnoredVoiceCommand;

export type WakeVoiceCommand = {
  action: 'wake_word';
  matchedTrigger: string;
  normalizedTranscript: string;
  originalTranscript: string;
  triggerTranscript: string;
};

export type VoiceWakePhase = 'waiting_for_wake' | 'awaiting_command';

export type SpeechResultWakeDecision =
  | {
      action: 'activate_wake';
      wakeCommand: WakeVoiceCommand;
    }
  | {
      action: 'already_awake';
    }
  | {
      action: 'wait_for_wake';
      ignored: IgnoredVoiceCommand;
    };

export type SpeechRecognitionRecoveryDecision =
  | {
      action: 'restart';
      reason: string;
      userMessage: string;
    }
  | {
      action: 'ignore';
    }
  | {
      action: 'stop';
      userMessage: string;
    };

const RECOVERABLE_SPEECH_ERRORS = new Set([
  'audio-capture',
  'busy',
  'client',
  'interrupted',
  'network',
  'no-speech',
  'speech-timeout',
]);

export const DEFAULT_APP_TRIGGER_PHRASES = [
  '노트AI야',
  '노트 AI야',
  '노트 아이야',
  '노트 아야',
  '노트야',
  'Note AI야',
  '노트아이야',
  '노트아야',
  '노트 에이아이야',
  '노트에이아이야',
  '노트 에이야',
  '노트에이야',
  '에이야',
  'A야',
  'note ai',
  'hey note ai',
];

export const DEFAULT_SAVE_PHRASES = [
  '방금 부분 저장해줘',
  '방금 부분 저장',
  '듣던 부분 저장해줘',
  '듣던 부분 저장',
  '이 부분 저장해줘',
  '이 부분 저장',
  '방금 저장해줘',
  '방금 저장',
  '방금 내용 요약해줘',
  '방금 내용 요약',
  '방금 부분 요약해줘',
  '방금 부분 요약',
  '방금 들은 내용 요약해줘',
  '방금 들은 내용 요약',
  '방금 요약해줘',
  '방금 요약',
  '내용 요약해줘',
  '내용 요약',
  '부분 요약해줘',
  '부분 요약',
  '요약해줘',
  '요약해 주세요',
  '방금 부분 정리해줘',
  '방금 부분 정리',
  '방금 내용 정리해줘',
  '방금 내용 정리',
  '정리해줘',
  '정리해 주세요',
  '내 서비스 아이디어로 정리해줘',
  '서비스 아이디어로 정리해줘',
  '아이디어로 정리해줘',
  '조사해줘',
  '조사해 주세요',
  '검색해줘',
  '검색해 주세요',
  '자료 찾아줘',
  '자료 찾아 주세요',
  '찾아줘',
  '찾아 주세요',
  '리서치해줘',
  '리서치해 주세요',
  '블로그 글감으로 정리해줘',
  '블로그 글감으로 정리',
  '콘텐츠 초안으로 정리해줘',
  'save this part',
  'save this',
  'save it',
  'save now',
  'summarize this',
  'summarize that',
  'research this',
];

const FALLBACK_WAKE_TRIGGER = '노트AI야';
const DEFAULT_RESUME_PHRASES = [
  '그래 다시 재생해줘',
  '그래 다시 재생',
  '그럼 다시 재생해줘',
  '그럼 다시 재생',
  '다시 재생해줘',
  '다시 재생',
  '계속 재생해줘',
  '계속 재생',
  '이어 재생해줘',
  '이어 재생',
  '이어서 재생해줘',
  '이어서 재생',
  'resume playback',
  'play again',
  'continue playing',
];

const LEADING_FILLER_PATTERN = /^(그래|그럼|그리고|다시)[\s,.;:!?，。、]+/i;
const TRAILING_FILLER_PATTERN = /[\s,.;:!?，。、]*(그래|그럼|그리고|다시)$/i;

type NormalizedText = {
  indexMap: number[];
  value: string;
};

type PhraseMatch = {
  index: number;
  normalizedPhrase: string;
  phrase: string;
};

export function parseVoiceCommand(
  transcript: string,
  options: {
    savePhrases?: string[];
    triggerPhrases?: string[];
    requireTrigger?: boolean;
    fallbackMatchedTrigger?: string;
    fallbackTriggerTranscript?: string;
  } = {},
): VoiceCommandParseResult {
  const originalTranscript = transcript.trim();
  const normalized = normalizeWithIndexMap(originalTranscript);

  if (normalized.value.length === 0) {
    return ignored(originalTranscript, normalized.value, 'empty');
  }

  const requireTrigger = options.requireTrigger ?? true;
  const triggerMatch = findFirstPhrase(normalized.value, options.triggerPhrases ?? DEFAULT_APP_TRIGGER_PHRASES);
  if (requireTrigger && !triggerMatch) {
    return ignored(originalTranscript, normalized.value, 'missing_trigger');
  }

  const resumeMatch = findFirstPhrase(normalized.value, DEFAULT_RESUME_PHRASES);
  const saveMatch = findFirstPhrase(normalized.value, options.savePhrases ?? DEFAULT_SAVE_PHRASES);
  if (!saveMatch) {
    if (resumeMatch && (!requireTrigger || !triggerMatch || resumeMatch.index >= triggerMatch.index)) {
      return {
        action: 'resume_playback',
        matchedTrigger: triggerMatch?.phrase ?? options.fallbackMatchedTrigger ?? FALLBACK_WAKE_TRIGGER,
        memoTranscript: '',
        normalizedTranscript: normalized.value,
        originalTranscript,
        shouldResumePlayback: true,
        triggerTranscript: options.fallbackTriggerTranscript ?? originalTranscript,
      };
    }
    return ignored(originalTranscript, normalized.value, 'missing_save_phrase');
  }

  if (requireTrigger && triggerMatch && saveMatch.index < triggerMatch.index) {
    return ignored(originalTranscript, normalized.value, 'save_before_trigger');
  }

  const memoTranscript = buildMemoTranscript(originalTranscript, normalized, {
    resumeMatch,
    saveMatch,
    triggerMatch,
  });

  return {
    action: 'save_moment',
    intent: detectIntent(`${saveMatch.phrase} ${memoTranscript || originalTranscript}`),
    matchedSavePhrase: saveMatch.phrase,
    matchedTrigger: triggerMatch?.phrase ?? options.fallbackMatchedTrigger ?? FALLBACK_WAKE_TRIGGER,
    memoTranscript,
    normalizedTranscript: normalized.value,
    originalTranscript,
    shouldResumePlayback: resumeMatch !== undefined,
    triggerTranscript: options.fallbackTriggerTranscript ?? originalTranscript,
  };
}

export function createSaveVoiceCommandFromSiriMemo(
  memoTranscript: string,
  triggerTranscript = 'Siri/App Shortcut: 방금 저장',
): SaveVoiceCommand {
  const originalTranscript = memoTranscript.trim();
  const parsed = parseVoiceCommand(originalTranscript, {
    fallbackMatchedTrigger: 'Siri/App Shortcut',
    fallbackTriggerTranscript: triggerTranscript,
    requireTrigger: false,
  });

  if (parsed.action === 'save_moment') {
    return {
      ...parsed,
      memoTranscript: parsed.memoTranscript.length > 0 ? parsed.memoTranscript : originalTranscript,
      triggerTranscript,
    };
  }

  const normalized = normalizeWithIndexMap(originalTranscript).value;
  return {
    action: 'save_moment',
    intent: detectIntent(originalTranscript),
    matchedSavePhrase: 'Siri/App Shortcut',
    matchedTrigger: 'Siri/App Shortcut',
    memoTranscript: originalTranscript,
    normalizedTranscript: normalized,
    originalTranscript,
    shouldResumePlayback: parsed.action === 'resume_playback',
    triggerTranscript,
  };
}

export function parseWakeWord(
  transcript: string,
  options: {
    triggerPhrases?: string[];
  } = {},
): WakeVoiceCommand | IgnoredVoiceCommand {
  const originalTranscript = transcript.trim();
  const normalized = normalizeWithIndexMap(originalTranscript);

  if (normalized.value.length === 0) {
    return ignored(originalTranscript, normalized.value, 'empty');
  }

  const triggerMatch = findFirstPhrase(normalized.value, options.triggerPhrases ?? DEFAULT_APP_TRIGGER_PHRASES);
  if (!triggerMatch) {
    return ignored(originalTranscript, normalized.value, 'missing_trigger');
  }

  return {
    action: 'wake_word',
    matchedTrigger: triggerMatch.phrase,
    normalizedTranscript: normalized.value,
    originalTranscript,
    triggerTranscript: originalTranscript,
  };
}

export function decideWakeActivationFromSpeechResult(input: {
  readonly isFinal: boolean;
  readonly phase: VoiceWakePhase;
  readonly transcript: string;
}): SpeechResultWakeDecision {
  if (input.phase === 'awaiting_command') {
    return { action: 'already_awake' };
  }

  const wakeCommand = parseWakeWord(input.transcript);
  if (wakeCommand.action === 'wake_word') {
    return {
      action: 'activate_wake',
      wakeCommand,
    };
  }

  return {
    action: 'wait_for_wake',
    ignored: wakeCommand,
  };
}

export function decideSpeechRecognitionRecovery(input: {
  readonly error: string;
  readonly message?: string;
}): SpeechRecognitionRecoveryDecision {
  if (input.error === 'aborted') {
    return { action: 'ignore' };
  }

  if (RECOVERABLE_SPEECH_ERRORS.has(input.error)) {
    return {
      action: 'restart',
      reason: input.error,
      userMessage: '음성 연결이 끊겨 다시 듣는 중입니다.',
    };
  }

  return {
    action: 'stop',
    userMessage: formatSpeechRecoveryStopMessage(input.error, input.message),
  };
}

function ignored(originalTranscript: string, normalizedTranscript: string, reason: IgnoredVoiceCommand['reason']): IgnoredVoiceCommand {
  return {
    action: 'ignore',
    normalizedTranscript,
    originalTranscript,
    reason,
  };
}

function formatSpeechRecoveryStopMessage(error: string, message?: string): string {
  const normalized = message?.trim();
  if (normalized) return normalized;
  return `음성 인식 오류: ${error}`;
}

function findFirstPhrase(text: string, phrases: string[]): PhraseMatch | undefined {
  return phrases
    .map((phrase) => ({ phrase, normalizedPhrase: normalizeForMatching(phrase) }))
    .filter((candidate) => candidate.normalizedPhrase.length > 0)
    .map((candidate) => ({ ...candidate, index: text.indexOf(candidate.normalizedPhrase) }))
    .filter((candidate) => candidate.index >= 0)
    .sort((left, right) => left.index - right.index || right.normalizedPhrase.length - left.normalizedPhrase.length)[0];
}

function buildMemoTranscript(
  originalTranscript: string,
  normalized: NormalizedText,
  matches: {
    resumeMatch?: PhraseMatch;
    saveMatch: PhraseMatch;
    triggerMatch?: PhraseMatch;
  },
): string {
  const withoutResume = removeResumePhrase(originalTranscript, matches.resumeMatch);
  const withoutTriggers = removeAllTriggerPhrases(withoutResume);
  const withoutSave = removeMatchedPhrase(withoutTriggers, matches.saveMatch);
  return cleanupMemoTail(withoutSave);
}

function removeAllTriggerPhrases(value: string): string {
  return DEFAULT_APP_TRIGGER_PHRASES.reduce((current, phrase) => {
    const normalizedPhrase = normalizeForMatching(phrase);
    let next = current;
    for (;;) {
      const normalized = normalizeWithIndexMap(next);
      const index = normalized.value.indexOf(normalizedPhrase);
      if (index < 0) return next;
      next = removeMatchedPhrase(next, { index, normalizedPhrase, phrase });
    }
  }, value);
}

function removeMatchedPhrase(value: string, match?: PhraseMatch): string {
  if (!match) return value;
  const normalized = normalizeWithIndexMap(value);
  const found = normalized.value.indexOf(match.normalizedPhrase);
  if (found < 0) return value;
  const originalStart = normalized.indexMap[found] ?? 0;
  const originalEndIndex = found + match.normalizedPhrase.length;
  const originalEnd = originalEndIndex >= normalized.indexMap.length
    ? value.length
    : normalized.indexMap[originalEndIndex];
  return `${value.slice(0, originalStart)} ${value.slice(originalEnd)}`;
}

function removeResumePhrase(value: string, resumeMatch?: PhraseMatch): string {
  const normalized = normalizeWithIndexMap(value);
  const match = resumeMatch ?? findFirstPhrase(normalized.value, DEFAULT_RESUME_PHRASES);
  if (!match) return cleanupMemoTail(value);
  const found = normalized.value.indexOf(match.normalizedPhrase);
  if (found < 0) return cleanupMemoTail(value);
  const originalResumeStart = normalized.indexMap[found] ?? value.length;
  return cleanupMemoTail(value.slice(0, originalResumeStart));
}

function detectIntent(text: string): VoiceCommandIntent {
  const normalized = normalizeForMatching(text);
  if (/조사|검색|자료|찾아|리서치|research/.test(normalized)) return 'research';
  if (/블로그|글감|콘텐츠|초안|draft|script/.test(normalized)) return 'content_draft';
  if (/아이디어|서비스|적용|기획|사업|idea/.test(normalized)) return 'idea';
  if (/정리|organize/.test(normalized)) return 'organize';
  return 'summary';
}

function cleanupMemoTail(value: string): string {
  let cleaned = value.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[\s,.;:!?，。、]+/, '');
  cleaned = cleaned.replace(/[\s,.;:!?，。、]+$/, '');
  cleaned = cleaned.replace(/^(해\s*줘요?|해\s*주세요|해\s*주고|해줘|해주세요|해주고|해|하고)[\s,.;:!?，。、]*/i, '');
  while (LEADING_FILLER_PATTERN.test(cleaned)) cleaned = cleaned.replace(LEADING_FILLER_PATTERN, '').trim();
  while (TRAILING_FILLER_PATTERN.test(cleaned)) cleaned = cleaned.replace(TRAILING_FILLER_PATTERN, '').trim();
  return cleaned;
}

function normalizeForMatching(value: string): string {
  return normalizeWithIndexMap(value).value;
}

function normalizeWithIndexMap(value: string): NormalizedText {
  const indexMap: number[] = [];
  let normalized = '';
  for (let offset = 0; offset < value.length;) {
    const codePoint = value.codePointAt(offset);
    if (codePoint === undefined) break;
    const char = String.fromCodePoint(codePoint).toLocaleLowerCase();
    if (isSearchableChar(char)) {
      normalized += char;
      indexMap.push(offset);
    }
    offset += char.length;
  }

  return { indexMap, value: normalized };
}

function isSearchableChar(char: string): boolean {
  return /[0-9a-z가-힣]/.test(char);
}
