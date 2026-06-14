import http from 'node:http';
import { readBackendConfig } from './config/env.ts';
import { writeJson } from './http/json.ts';
import { handleHealth } from './routes/health.ts';
import { handleSources } from './routes/sources.ts';
import { handleCaptures } from './routes/captures.ts';
import { handleVoiceMemos } from './routes/voice-memos.ts';
import { handleTranscripts } from './routes/transcripts.ts';
import { handleSegments } from './routes/segments.ts';
import { handleNotes } from './routes/notes.ts';
import { handleResearchJobs } from './routes/research.ts';

export function createServer(): http.Server {
  return http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/health') {
      handleHealth(request, response);
      return;
    }

    if (url.pathname === '/sources') {
      void handleSources(request, response);
      return;
    }

    if (url.pathname === '/captures') {
      void handleCaptures(request, response);
      return;
    }

    if (url.pathname === '/voice-memos') {
      void handleVoiceMemos(request, response);
      return;
    }

    if (url.pathname === '/transcripts') {
      void handleTranscripts(request, response);
      return;
    }

    if (url.pathname === '/segments/select') {
      void handleSegments(request, response);
      return;
    }

    if (url.pathname === '/notes') {
      void handleNotes(request, response);
      return;
    }

    if (url.pathname === '/research-jobs') {
      void handleResearchJobs(request, response);
      return;
    }

    writeJson(response, 404, {
      error: 'not_found',
      message: 'Route not found.',
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = readBackendConfig();
  const server = createServer();

  server.listen(config.port, () => {
    console.log(`note-ai backend listening on http://localhost:${config.port}`);
  });
}
