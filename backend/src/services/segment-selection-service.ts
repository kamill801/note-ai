import { listCaptures } from './capture-service.ts';
import { getSourceById } from './source-service.ts';
import { getTranscriptStatus, listTranscriptSegments, type TranscriptSegment } from './transcript-service.ts';

export type SegmentSelection = {
  captureId: string;
  sourceId: string;
  selectionMode: 'timestamp_exact' | 'memo_only_fallback';
  startSec: number | null;
  endSec: number | null;
  confidence: 'high' | 'low';
  segments: TranscriptSegment[];
  evidenceSegmentIds: string[];
  fallbackReason?: string;
};

export type SelectSegmentsInput = {
  captureId: string;
  beforeSec?: number;
  afterSec?: number;
};

export function selectSegmentsForCapture(input: SelectSegmentsInput): SegmentSelection {
  const capture = listCaptures().find((item) => item.id === input.captureId);
  if (!capture) throw new Error('등록된 capture를 찾을 수 없습니다.');
  const source = getSourceById(capture.sourceId);
  if (!source) throw new Error('등록된 source를 찾을 수 없습니다.');

  const beforeSec = input.beforeSec ?? 45;
  const afterSec = input.afterSec ?? 75;
  if (beforeSec < 0 || afterSec < 0) throw new Error('window 값은 0 이상이어야 합니다.');

  const windowStart = Math.max(0, capture.capturedAtSec - beforeSec);
  const windowEnd = capture.capturedAtSec + afterSec;
  const availableSegments = listTranscriptSegments(source.id);

  if (getTranscriptStatus(source.id) === 'unavailable') {
    return {
      captureId: capture.id,
      sourceId: source.id,
      selectionMode: 'memo_only_fallback',
      startSec: null,
      endSec: null,
      confidence: 'low',
      segments: [],
      evidenceSegmentIds: [],
      fallbackReason: 'transcript_unavailable',
    };
  }

  const selected = availableSegments.filter((segment) => overlapsWindow(segment, windowStart, windowEnd));
  return {
    captureId: capture.id,
    sourceId: source.id,
    selectionMode: 'timestamp_exact',
    startSec: roundTime(windowStart),
    endSec: roundTime(windowEnd),
    confidence: 'high',
    segments: selected,
    evidenceSegmentIds: selected.map((segment) => segment.id),
  };
}

function overlapsWindow(segment: TranscriptSegment, startSec: number, endSec: number): boolean {
  const segmentEnd = segment.endSec ?? segment.startSec;
  return segment.startSec <= endSec && segmentEnd >= startSec;
}

function roundTime(value: number): number {
  return Math.round(value * 1000) / 1000;
}
