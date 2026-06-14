import { randomUUID } from 'node:crypto';
import { getSourceById, setSourceTranscriptStatus } from './source-service.ts';

export type TranscriptSegment = {
  id: string;
  sourceId: string;
  provider: 'official_captions' | 'user_supplied' | 'page_transcript' | 'manual' | 'third_party';
  policyRisk: 'low' | 'medium' | 'high';
  lang: string;
  startSec: number;
  endSec: number | null;
  text: string;
  createdAt: string;
};

export type ImportTranscriptInput = {
  sourceId: string;
  provider: TranscriptSegment['provider'];
  lang: string;
  segments: Array<{
    startSec: number;
    endSec?: number | null;
    text: string;
  }>;
};

const segmentsBySourceId = new Map<string, TranscriptSegment[]>();

export function importTranscriptSegments(input: ImportTranscriptInput): TranscriptSegment[] {
  const source = getSourceById(input.sourceId);
  if (!source) throw new Error('등록된 source를 찾을 수 없습니다.');
  if (input.segments.length === 0) throw new Error('transcript segments는 비어 있을 수 없습니다.');

  const now = new Date().toISOString();
  const imported = input.segments.map((segment) => normalizeSegment(input, segment, now));
  imported.sort((a, b) => a.startSec - b.startSec);
  segmentsBySourceId.set(input.sourceId, imported);
  setSourceTranscriptStatus(input.sourceId, 'ready');
  return imported;
}

export function listTranscriptSegments(sourceId: string): TranscriptSegment[] {
  return [...(segmentsBySourceId.get(sourceId) ?? [])];
}

export function getTranscriptStatus(sourceId: string): 'ready' | 'unavailable' {
  return (segmentsBySourceId.get(sourceId)?.length ?? 0) > 0 ? 'ready' : 'unavailable';
}

export function resetTranscriptsForTest(): void {
  segmentsBySourceId.clear();
}

function normalizeSegment(
  input: ImportTranscriptInput,
  segment: ImportTranscriptInput['segments'][number],
  createdAt: string,
): TranscriptSegment {
  if (!Number.isFinite(segment.startSec) || segment.startSec < 0) throw new Error('segment startSec는 0 이상의 숫자여야 합니다.');
  if (segment.endSec !== undefined && segment.endSec !== null && segment.endSec < segment.startSec) {
    throw new Error('segment endSec는 startSec보다 작을 수 없습니다.');
  }
  const text = segment.text.trim();
  if (text.length === 0) throw new Error('segment text는 비어 있을 수 없습니다.');

  return {
    id: `seg_${randomUUID()}`,
    sourceId: input.sourceId,
    provider: input.provider,
    policyRisk: providerPolicyRisk(input.provider),
    lang: input.lang,
    startSec: roundTime(segment.startSec),
    endSec: segment.endSec === undefined || segment.endSec === null ? null : roundTime(segment.endSec),
    text,
    createdAt,
  };
}

function providerPolicyRisk(provider: TranscriptSegment['provider']): TranscriptSegment['policyRisk'] {
  if (provider === 'official_captions' || provider === 'user_supplied' || provider === 'manual') return 'low';
  if (provider === 'third_party') return 'medium';
  return 'high';
}

function roundTime(value: number): number {
  return Math.round(value * 1000) / 1000;
}
