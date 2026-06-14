import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, writeJson } from '../http/json.ts';
import { createResearchJob, listResearchJobs } from '../services/research-service.ts';

export async function handleResearchJobs(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'GET') {
    const noteId = url.searchParams.get('noteId');
    if (!noteId) {
      writeJson(response, 400, { error: 'missing_note_id', message: 'noteId query는 필수입니다.' });
      return;
    }
    writeJson(response, 200, { jobs: listResearchJobs(noteId) });
    return;
  }

  if (request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      if (!isResearchJobBody(body)) {
        writeJson(response, 400, { error: 'invalid_research_payload', message: 'noteId와 request 필드는 필수입니다.' });
        return;
      }
      const job = createResearchJob(body);
      writeJson(response, 201, { job });
    } catch (error) {
      writeJson(response, 400, { error: 'research_job_failed', message: error instanceof Error ? error.message : 'Research job failed.' });
    }
    return;
  }

  writeJson(response, 405, { error: 'method_not_allowed', message: 'Use GET or POST for /research-jobs.' });
}

function isResearchJobBody(value: unknown): value is { noteId: string; request: string } {
  return typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>).noteId === 'string' && typeof (value as Record<string, unknown>).request === 'string';
}
