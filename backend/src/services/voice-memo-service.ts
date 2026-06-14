import { randomUUID } from 'node:crypto';
import { listCaptures } from './capture-service.ts';

export type VoiceMemoIntent = 'summary_note' | 'idea_note' | 'research_note' | 'content_draft_note';

export type VoiceMemoRecord = {
  id: string;
  captureId: string;
  memoTranscript: string;
  detectedIntent: VoiceMemoIntent;
  keywords: string[];
  audioUri?: string;
  originalAudioRetention: 'local_uri_only' | 'not_saved';
  transcriptionStatus: 'manual_fallback' | 'transcribed';
  createdAt: string;
};

export type CreateVoiceMemoInput = {
  captureId: string;
  memoTranscript: string;
  audioUri?: string;
};

const memosById = new Map<string, VoiceMemoRecord>();
const memosByCaptureId = new Map<string, VoiceMemoRecord>();

export function createVoiceMemo(input: CreateVoiceMemoInput): VoiceMemoRecord {
  const captureExists = listCaptures().some((capture) => capture.id === input.captureId);
  if (!captureExists) throw new Error('등록된 capture를 찾을 수 없습니다.');

  const memoTranscript = input.memoTranscript.trim();
  if (memoTranscript.length === 0) throw new Error('memoTranscript는 비어 있을 수 없습니다.');

  const memo: VoiceMemoRecord = {
    id: `memo_${randomUUID()}`,
    captureId: input.captureId,
    memoTranscript,
    detectedIntent: detectIntent(memoTranscript),
    keywords: extractKeywords(memoTranscript),
    ...(input.audioUri ? { audioUri: input.audioUri } : {}),
    originalAudioRetention: input.audioUri ? 'local_uri_only' : 'not_saved',
    transcriptionStatus: 'manual_fallback',
    createdAt: new Date().toISOString(),
  };

  memosById.set(memo.id, memo);
  memosByCaptureId.set(memo.captureId, memo);
  return memo;
}

export function getVoiceMemoByCaptureId(captureId: string): VoiceMemoRecord | undefined {
  return memosByCaptureId.get(captureId);
}

export function resetVoiceMemosForTest(): void {
  memosById.clear();
  memosByCaptureId.clear();
}

function detectIntent(text: string): VoiceMemoIntent {
  const lower = text.toLowerCase();
  if (/리서치|검색|찾아|자료|논문|research/.test(lower)) return 'research_note';
  if (/초안|글|블로그|콘텐츠|script|draft/.test(lower)) return 'content_draft_note';
  if (/아이디어|적용|서비스|기획|사업|idea/.test(lower)) return 'idea_note';
  return 'summary_note';
}

function extractKeywords(text: string): string[] {
  return [...new Set(text.split(/[\s,.;:!?，。！？]+/).map((token) => token.trim()).filter((token) => token.length >= 2))].slice(0, 8);
}
