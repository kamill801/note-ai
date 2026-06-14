import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { createServer } from '../src/server.ts';
import { createExactCapture, resetCapturesForTest } from '../src/services/capture-service.ts';
import { selectSegmentsForCapture } from '../src/services/segment-selection-service.ts';
import { getSourceById, registerSource, resetSourcesForTest } from '../src/services/source-service.ts';
import { importTranscriptSegments, resetTranscriptsForTest } from '../src/services/transcript-service.ts';

test('selectSegmentsForCapture uses exact timestamp window', () => {
  resetSourcesForTest();
  resetCapturesForTest();
  resetTranscriptsForTest();
  const source = registerSource({ url: 'https://youtu.be/dQw4w9WgXcQ' });
  importTranscriptSegments({
    sourceId: source.id,
    provider: 'manual',
    lang: 'ko',
    segments: [
      { startSec: 0, endSec: 10, text: '너무 이른 문장' },
      { startSec: 50, endSec: 70, text: '저장할 핵심 문장' },
      { startSec: 120, endSec: 130, text: '뒤쪽 근거 문장' },
      { startSec: 200, endSec: 210, text: '너무 늦은 문장' },
    ],
  });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 80 });
  const selection = selectSegmentsForCapture({ captureId: capture.id });

  assert.equal(selection.selectionMode, 'timestamp_exact');
  assert.equal(selection.startSec, 35);
  assert.equal(selection.endSec, 155);
  assert.equal(selection.confidence, 'high');
  assert.deepEqual(selection.segments.map((segment) => segment.text), ['저장할 핵심 문장', '뒤쪽 근거 문장']);
});

test('selectSegmentsForCapture returns memo-only fallback when transcript is unavailable', () => {
  resetSourcesForTest();
  resetCapturesForTest();
  resetTranscriptsForTest();
  const source = registerSource({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 80 });
  const selection = selectSegmentsForCapture({ captureId: capture.id });

  assert.equal(selection.selectionMode, 'memo_only_fallback');
  assert.equal(selection.confidence, 'low');
  assert.equal(selection.fallbackReason, 'transcript_unavailable');
  assert.deepEqual(selection.evidenceSegmentIds, []);
});

test('transcript import and segment selection APIs work together', async () => {
  resetSourcesForTest();
  resetCapturesForTest();
  resetTranscriptsForTest();
  const fixture = JSON.parse(readFileSync(new URL('../fixtures/sample-transcript.json', import.meta.url), 'utf8'));
  const source = registerSource({ url: `https://www.youtube.com/watch?v=${fixture.videoId}` });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 90 });
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const importResponse = await fetch(`${baseUrl}/transcripts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceId: source.id, provider: fixture.provider, lang: fixture.lang, segments: fixture.segments }),
    });
    const importPayload = await importResponse.json();
    assert.equal(importResponse.status, 201);
    assert.equal(importPayload.segments.length, 6);
    assert.equal(getSourceById(source.id)?.transcriptStatus, 'ready');

    const selectResponse = await fetch(`${baseUrl}/segments/select`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ captureId: capture.id }),
    });
    const selectPayload = await selectResponse.json();
    assert.equal(selectResponse.status, 200);
    assert.equal(selectPayload.selection.selectionMode, 'timestamp_exact');
    assert.ok(selectPayload.selection.evidenceSegmentIds.length >= 2);
  } finally {
    server.close();
  }
});

function assertAddressInfo(address: ReturnType<typeof import('node:http').Server.prototype.address>): asserts address is AddressInfo {
  assert.notEqual(address, null);
  assert.notEqual(typeof address, 'string');
}
