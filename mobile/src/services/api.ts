import type { BackendHealth, NoteRecord, ResearchJob, SourceSummary, TimestampCapture, VoiceMemo } from '../domain/source';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

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

export async function getBackendHealth(): Promise<BackendHealth> {
  return request<BackendHealth>('/health', { method: 'GET' });
}

export async function listSources(): Promise<SourceSummary[]> {
  const payload = await request<{ sources: SourceSummary[] }>('/sources', { method: 'GET' });
  return payload.sources;
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

export async function listNotes(): Promise<NoteRecord[]> {
  const payload = await request<{ notes: NoteRecord[] }>('/notes', { method: 'GET' });
  return payload.notes;
}

export async function createResearchJob(input: { noteId: string; request: string }): Promise<ResearchJob> {
  const payload = await request<{ job: ResearchJob }>('/research-jobs', {
    method: 'POST',
    body: input,
  });
  return payload.job;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

async function request<T = unknown>(path: string, options: { method: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        'content-type': 'application/json',
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch (caught) {
    const reason = caught instanceof Error ? caught.message : 'unknown network error';
    throw new Error(`API 서버에 연결할 수 없습니다. (${API_BASE_URL}) ${reason}`);
  }

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    const message = hasMessage(payload) ? payload.message : `API 요청이 실패했습니다. (${response.status} · ${API_BASE_URL})`;
    throw new Error(message);
  }
  return payload as T;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    if (response.ok) {
      throw new Error(`API 응답을 JSON으로 읽을 수 없습니다. (${API_BASE_URL})`);
    }
    return {};
  }
}

function hasMessage(value: unknown): value is { message: string } {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed.length === 0) return DEFAULT_API_BASE_URL;
  return trimmed.replace(/\/+$/, '');
}
