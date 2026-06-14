import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, writeJson } from '../http/json.ts';
import { generateNoteForCapture, getNoteByCaptureId } from '../services/note-service.ts';

export async function handleNotes(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'GET') {
    const captureId = url.searchParams.get('captureId');
    if (!captureId) {
      writeJson(response, 400, { error: 'missing_capture_id', message: 'captureId query는 필수입니다.' });
      return;
    }
    writeJson(response, 200, { note: getNoteByCaptureId(captureId) ?? null });
    return;
  }

  if (request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      if (!isGenerateNoteBody(body)) {
        writeJson(response, 400, { error: 'invalid_note_payload', message: 'captureId 필드는 필수입니다.' });
        return;
      }
      const note = generateNoteForCapture(body.captureId);
      writeJson(response, 201, { note });
    } catch (error) {
      writeJson(response, 400, { error: 'note_generation_failed', message: error instanceof Error ? error.message : 'Note generation failed.' });
    }
    return;
  }

  writeJson(response, 405, { error: 'method_not_allowed', message: 'Use GET or POST for /notes.' });
}

function isGenerateNoteBody(value: unknown): value is { captureId: string } {
  return typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>).captureId === 'string';
}
