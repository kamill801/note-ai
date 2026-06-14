import { assertGeneratedNote, type GeneratedNote } from './note-schema.ts';
import type { SegmentSelection } from '../services/segment-selection-service.ts';
import type { SourceRecord } from '../services/source-service.ts';
import type { VoiceMemoRecord } from '../services/voice-memo-service.ts';

export type GenerateNoteContext = {
  source: SourceRecord;
  selection: SegmentSelection;
  voiceMemo: VoiceMemoRecord;
};

export function generateKoreanNote(context: GenerateNoteContext): GeneratedNote {
  const evidenceText = context.selection.segments.map((segment) => segment.text).join(' ');
  const hasEvidence = context.selection.evidenceSegmentIds.length > 0;
  const timestampLabel = context.selection.startSec !== null && context.selection.endSec !== null
    ? `${formatSeconds(context.selection.startSec)}-${formatSeconds(context.selection.endSec)}`
    : '근거 자막 없음';

  const note: GeneratedNote = {
    title: buildTitle(context.voiceMemo.memoTranscript, context.source.title),
    timestampLabel,
    confidence: hasEvidence ? 'high' : 'low',
    summary: hasEvidence
      ? `저장 구간은 ${summarizeEvidence(evidenceText)}에 관한 내용입니다.`
      : '자막 근거가 없어 사용자 메모 중심으로 임시 노트를 만들었습니다.',
    userMemoSummary: context.voiceMemo.memoTranscript,
    applicationIdeas: buildApplicationIdeas(context.voiceMemo),
    followUpKeywords: context.voiceMemo.keywords.length > 0 ? context.voiceMemo.keywords : ['추가 리서치', context.source.title],
    recommendedMaterials: buildRecommendedMaterials(context.voiceMemo.keywords),
    evidenceSegmentIds: context.selection.evidenceSegmentIds,
    sourceEvidence: context.selection.segments.map((segment) => ({
      segmentId: segment.id,
      timestampLabel: `${formatSeconds(segment.startSec)}-${segment.endSec === null ? '?' : formatSeconds(segment.endSec)}`,
      text: segment.text,
    })),
  };

  assertGeneratedNote(note);
  return note;
}

function buildTitle(memo: string, sourceTitle: string): string {
  const compactMemo = memo.replace(/\s+/g, ' ').trim();
  const prefix = compactMemo.length > 26 ? `${compactMemo.slice(0, 26)}…` : compactMemo;
  return `${prefix || sourceTitle} — 저장 노트`;
}

function summarizeEvidence(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > 90 ? `${compact.slice(0, 90)}…` : compact;
}

function buildApplicationIdeas(memo: VoiceMemoRecord): string[] {
  if (memo.detectedIntent === 'idea_note') return [`내 상황에 적용: ${memo.memoTranscript}`];
  if (memo.detectedIntent === 'research_note') return ['관련 자료를 찾아 근거와 반례를 함께 확인하기'];
  if (memo.detectedIntent === 'content_draft_note') return ['이 구간을 콘텐츠 초안의 핵심 주장으로 재구성하기'];
  return ['핵심 내용을 다시 읽고 실행 항목 1개로 바꾸기'];
}

function buildRecommendedMaterials(keywords: string[]): GeneratedNote['recommendedMaterials'] {
  const query = encodeURIComponent((keywords.slice(0, 3).join(' ') || 'knowledge capture research').trim());
  return [
    {
      title: '추가 검색으로 근거 확인',
      reason: '현재 MVP 로컬 생성기는 외부 검색을 실행하지 않고, 다음 리서치 단계에서 출처 URL을 붙입니다.',
      url: `https://www.google.com/search?q=${query}`,
    },
  ];
}

function formatSeconds(value: number): string {
  const safe = Math.max(0, Math.floor(value));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
