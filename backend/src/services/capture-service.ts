import { randomUUID } from 'node:crypto';
import { getSourceById } from './source-service.ts';

export type CaptureTrigger = 'manual_button' | 'voice_trigger' | 'siri_shortcut';

export type CaptureRecord = {
  id: string;
  sourceId: string;
  mode: 'in_app_exact';
  capturedAtSec: number;
  trigger: CaptureTrigger;
  triggerTranscript?: string;
  createdAt: string;
};

export type CreateExactCaptureInput = {
  sourceId: string;
  capturedAtSec: number;
  trigger?: CaptureTrigger;
  triggerTranscript?: string;
};

const capturesById = new Map<string, CaptureRecord>();
const capturesBySourceId = new Map<string, CaptureRecord[]>();

export function createExactCapture(input: CreateExactCaptureInput): CaptureRecord {
  const source = getSourceById(input.sourceId);
  if (!source) throw new Error('등록된 source를 찾을 수 없습니다.');

  if (!Number.isFinite(input.capturedAtSec) || input.capturedAtSec < 0) {
    throw new Error('capturedAtSec는 0 이상의 숫자여야 합니다.');
  }

  const now = new Date().toISOString();
  const capture: CaptureRecord = {
    id: `cap_${randomUUID()}`,
    sourceId: source.id,
    mode: 'in_app_exact',
    capturedAtSec: roundTimestamp(input.capturedAtSec),
    trigger: input.trigger ?? 'manual_button',
    ...(input.triggerTranscript ? { triggerTranscript: input.triggerTranscript } : {}),
    createdAt: now,
  };

  capturesById.set(capture.id, capture);
  capturesBySourceId.set(capture.sourceId, [capture, ...(capturesBySourceId.get(capture.sourceId) ?? [])]);
  return capture;
}

export function listCaptures(sourceId?: string): CaptureRecord[] {
  if (sourceId) return [...(capturesBySourceId.get(sourceId) ?? [])];
  return [...capturesById.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function resetCapturesForTest(): void {
  capturesById.clear();
  capturesBySourceId.clear();
}

function roundTimestamp(value: number): number {
  return Math.round(value * 1000) / 1000;
}
