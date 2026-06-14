import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, writeJson } from '../http/json.ts';
import { listSources, registerSource } from '../services/source-service.ts';

export async function handleSources(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method === 'GET') {
    writeJson(response, 200, { sources: listSources() });
    return;
  }

  if (request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      if (!isRegisterSourceBody(body)) {
        writeJson(response, 400, {
          error: 'invalid_source_payload',
          message: 'url 필드는 필수입니다.',
        });
        return;
      }

      const source = registerSource(body);
      writeJson(response, 201, { source });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Source registration failed.';
      writeJson(response, 400, {
        error: 'source_registration_failed',
        message,
      });
    }
    return;
  }

  writeJson(response, 405, {
    error: 'method_not_allowed',
    message: 'Use GET or POST for /sources.',
  });
}

function isRegisterSourceBody(value: unknown): value is { url: string; sourceLabel?: string } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.url === 'string' && (record.sourceLabel === undefined || typeof record.sourceLabel === 'string');
}
