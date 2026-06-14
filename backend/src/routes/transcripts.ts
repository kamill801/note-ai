import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, writeJson } from '../http/json.ts';
import { importTranscriptSegments, listTranscriptSegments } from '../services/transcript-service.ts';

export async function handleTranscripts(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'GET') {
    const sourceId = url.searchParams.get('sourceId');
    if (!sourceId) {
      writeJson(response, 400, { error: 'missing_source_id', message: 'sourceId query는 필수입니다.' });
      return;
    }
    writeJson(response, 200, { segments: listTranscriptSegments(sourceId) });
    return;
  }

  if (request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      if (!isImportTranscriptBody(body)) {
        writeJson(response, 400, { error: 'invalid_transcript_payload', message: 'sourceId, provider, lang, segments 필드는 필수입니다.' });
        return;
      }
      const segments = importTranscriptSegments(body);
      writeJson(response, 201, { segments });
    } catch (error) {
      writeJson(response, 400, { error: 'transcript_import_failed', message: error instanceof Error ? error.message : 'Transcript import failed.' });
    }
    return;
  }

  writeJson(response, 405, { error: 'method_not_allowed', message: 'Use GET or POST for /transcripts.' });
}

function isImportTranscriptBody(value: unknown): value is Parameters<typeof importTranscriptSegments>[0] {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.sourceId === 'string' && typeof record.provider === 'string' && typeof record.lang === 'string' && Array.isArray(record.segments);
}
