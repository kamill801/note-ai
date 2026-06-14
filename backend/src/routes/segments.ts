import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, writeJson } from '../http/json.ts';
import { selectSegmentsForCapture } from '../services/segment-selection-service.ts';

export async function handleSegments(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed', message: 'Use POST for /segments/select.' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    if (!isSelectSegmentsBody(body)) {
      writeJson(response, 400, { error: 'invalid_segment_selection_payload', message: 'captureId 필드는 필수입니다.' });
      return;
    }
    writeJson(response, 200, { selection: selectSegmentsForCapture(body) });
  } catch (error) {
    writeJson(response, 400, { error: 'segment_selection_failed', message: error instanceof Error ? error.message : 'Segment selection failed.' });
  }
}

function isSelectSegmentsBody(value: unknown): value is Parameters<typeof selectSegmentsForCapture>[0] {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.captureId === 'string' &&
    (record.beforeSec === undefined || typeof record.beforeSec === 'number') &&
    (record.afterSec === undefined || typeof record.afterSec === 'number')
  );
}
