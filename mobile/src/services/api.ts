import type { NoteRecord, ResearchJob, SourceSummary, TimestampCapture, VoiceMemo } from '../domain/source';

const API_BASE_URL = 'http://localhost:3000';

const demoTranscriptSegments = [
  { startSec: 0, endSec: 20, text: '오늘은 사용자가 이동 중에 지식을 저장하는 상황을 살펴봅니다.' },
  { startSec: 21, endSec: 45, text: '중요한 순간을 놓치지 않으려면 링크와 시간 정보를 함께 남겨야 합니다.' },
  { startSec: 46, endSec: 80, text: '사용자의 음성 메모는 왜 이 부분이 중요한지 알려주는 핵심 단서입니다.' },
  { startSec: 81, endSec: 120, text: 'timestamp 주변 자막을 근거로 선택하면 노트가 출처와 연결됩니다.' },
  { startSec: 121, endSec: 170, text: '추가 리서치는 사용자가 원할 때 출처 URL과 함께 붙이는 것이 좋습니다.' },
  { startSec: 171, endSec: 220, text: '정확하지 않은 모드에서는 추정 구간과 신뢰도를 반드시 표시해야 합니다.' },
];

export async function registerSource(input: { url: string; sourceLabel?: string }): Promise<SourceSummary> {
  const payload = await request<{ source: SourceSummary }>('/sources', {
    method: 'POST',
    body: input,
  });
  return payload.source;
}

export async function importDemoTranscript(sourceId: string): Promise<void> {
  await request('/transcripts', {
    method: 'POST',
    body: {
      sourceId,
      provider: 'manual',
      lang: 'ko',
      segments: demoTranscriptSegments,
    },
  });
}

export async function createExactCapture(input: {
  sourceId: string;
  capturedAtSec: number;
  trigger?: 'manual_button' | 'voice_trigger';
  triggerTranscript?: string;
}): Promise<TimestampCapture> {
  const payload = await request<{ capture: TimestampCapture }>('/captures', {
    method: 'POST',
    body: input,
  });
  return payload.capture;
}

export async function createVoiceMemo(input: {
  captureId: string;
  memoTranscript: string;
  audioUri?: string;
}): Promise<VoiceMemo> {
  const payload = await request<{ memo: VoiceMemo }>('/voice-memos', {
    method: 'POST',
    body: input,
  });
  return payload.memo;
}

export async function generateNote(captureId: string): Promise<NoteRecord> {
  const payload = await request<{ note: NoteRecord }>('/notes', {
    method: 'POST',
    body: { captureId },
  });
  return payload.note;
}

export async function createResearchJob(input: { noteId: string; request: string }): Promise<ResearchJob> {
  const payload = await request<{ job: ResearchJob }>('/research-jobs', {
    method: 'POST',
    body: input,
  });
  return payload.job;
}

async function request<T = unknown>(path: string, options: { method: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'content-type': 'application/json',
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'API 요청이 실패했습니다.';
    throw new Error(message);
  }
  return payload as T;
}
