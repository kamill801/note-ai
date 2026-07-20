import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, writeJson } from '../http/json.ts';
import { createExactCapture, listCaptures, type CaptureTrigger } from '../services/capture-service.ts';

export async function handleCaptures(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'GET') {
    writeJson(response, 200, { captures: listCaptures(url.searchParams.get('sourceId') ?? undefined) });
    return;
  }

  if (request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      if (!isCreateCaptureBody(body)) {
        writeJson(response, 400, {
          error: 'invalid_capture_payload',
          message: 'sourceId와 capturedAtSec 필드는 필수입니다.',
        });
        return;
      }

      const capture = createExactCapture(body);
      writeJson(response, 201, { capture });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Capture creation failed.';
      writeJson(response, 400, {
        error: 'capture_creation_failed',
        message,
      });
    }
    return;
  }

  writeJson(response, 405, {
    error: 'method_not_allowed',
    message: 'Use GET or POST for /captures.',
  });
}

function isCreateCaptureBody(value: unknown): value is { sourceId: string; capturedAtSec: number; trigger?: CaptureTrigger; triggerTranscript?: string } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  const trigger = record.trigger;
  return (
    typeof record.sourceId === 'string' &&
    typeof record.capturedAtSec === 'number' &&
    (trigger === undefined || isCaptureTrigger(trigger)) &&
    (record.triggerTranscript === undefined || typeof record.triggerTranscript === 'string')
  );
}

function isCaptureTrigger(value: unknown): value is CaptureTrigger {
  return value === 'manual_button' || value === 'voice_trigger' || value === 'siri_shortcut';
}
