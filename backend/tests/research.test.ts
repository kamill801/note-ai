import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/server.ts';
import { createExactCapture, resetCapturesForTest } from '../src/services/capture-service.ts';
import { generateNoteForCapture, resetNotesForTest } from '../src/services/note-service.ts';
import { createResearchJob, resetResearchJobsForTest } from '../src/services/research-service.ts';
import { registerSource, resetSourcesForTest } from '../src/services/source-service.ts';
import { importTranscriptSegments, resetTranscriptsForTest } from '../src/services/transcript-service.ts';
import { createVoiceMemo, resetVoiceMemosForTest } from '../src/services/voice-memo-service.ts';

test('createResearchJob attaches source URLs and Korean synthesis', () => {
  resetAll();
  const note = seedNote();
  const job = createResearchJob({ noteId: note.id, request: '비슷한 사례 찾아줘' });

  assert.equal(job.status, 'succeeded');
  assert.equal(job.result.provider, 'mocked_search');
  assert.ok(job.result.sources.every((source) => source.url.length > 0));
  assert.match(job.result.koreanSynthesis, /비슷한 사례/);
  assert.ok(job.result.recommendedNextSteps.length > 0);
});

test('POST /research-jobs creates source-backed research result', async () => {
  resetAll();
  const note = seedNote();
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/research-jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ noteId: note.id, request: '추가 자료 추천' }),
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.ok(createPayload.job.result.sources[0].url.startsWith('https://www.google.com/search'));

    const listResponse = await fetch(`${baseUrl}/research-jobs?noteId=${note.id}`);
    const listPayload = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.jobs.length, 1);
  } finally {
    server.close();
  }
});

function seedNote() {
  const source = registerSource({ url: 'https://youtu.be/dQw4w9WgXcQ', sourceLabel: '리서치 강의' });
  importTranscriptSegments({
    sourceId: source.id,
    provider: 'manual',
    lang: 'ko',
    segments: [{ startSec: 10, endSec: 50, text: '추가 리서치는 출처 URL과 함께 붙이는 것이 좋습니다.' }],
  });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 30 });
  createVoiceMemo({ captureId: capture.id, memoTranscript: '이 부분 추가 리서치 자료 찾아줘' });
  return generateNoteForCapture(capture.id);
}

function resetAll() {
  resetSourcesForTest();
  resetCapturesForTest();
  resetTranscriptsForTest();
  resetVoiceMemosForTest();
  resetNotesForTest();
  resetResearchJobsForTest();
}

function assertAddressInfo(address: ReturnType<typeof import('node:http').Server.prototype.address>): asserts address is AddressInfo {
  assert.notEqual(address, null);
  assert.notEqual(typeof address, 'string');
}
