import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, writeJson } from '../http/json.ts';
import { createVoiceMemo, getVoiceMemoByCaptureId } from '../services/voice-memo-service.ts';

export async function handleVoiceMemos(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'GET') {
    const captureId = url.searchParams.get('captureId');
    if (!captureId) {
      writeJson(response, 400, { error: 'missing_capture_id', message: 'captureId query는 필수입니다.' });
      return;
    }
    writeJson(response, 200, { memo: getVoiceMemoByCaptureId(captureId) ?? null });
    return;
  }

  if (request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      if (!isCreateVoiceMemoBody(body)) {
        writeJson(response, 400, {
          error: 'invalid_voice_memo_payload',
          message: 'captureId와 memoTranscript 필드는 필수입니다.',
        });
        return;
      }

      const memo = createVoiceMemo(body);
      writeJson(response, 201, { memo });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Voice memo creation failed.';
      writeJson(response, 400, {
        error: 'voice_memo_creation_failed',
        message,
      });
    }
    return;
  }

  writeJson(response, 405, {
    error: 'method_not_allowed',
    message: 'Use GET or POST for /voice-memos.',
  });
}

function isCreateVoiceMemoBody(value: unknown): value is { captureId: string; memoTranscript: string; audioUri?: string } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.captureId === 'string' &&
    typeof record.memoTranscript === 'string' &&
    (record.audioUri === undefined || typeof record.audioUri === 'string')
  );
}
