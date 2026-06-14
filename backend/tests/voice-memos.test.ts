import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/server.ts';
import { createExactCapture, resetCapturesForTest } from '../src/services/capture-service.ts';
import { registerSource, resetSourcesForTest } from '../src/services/source-service.ts';
import { createVoiceMemo, resetVoiceMemosForTest } from '../src/services/voice-memo-service.ts';

test('createVoiceMemo preserves user memo and classifies intent', () => {
  resetSourcesForTest();
  resetCapturesForTest();
  resetVoiceMemosForTest();
  const source = registerSource({ url: 'https://youtu.be/dQw4w9WgXcQ' });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 12 });
  const memo = createVoiceMemo({
    captureId: capture.id,
    memoTranscript: '이 아이디어를 내 서비스 온보딩에 적용해보기',
    audioUri: 'file:///local/memo.m4a',
  });

  assert.equal(memo.memoTranscript, '이 아이디어를 내 서비스 온보딩에 적용해보기');
  assert.equal(memo.detectedIntent, 'idea_note');
  assert.equal(memo.originalAudioRetention, 'local_uri_only');
  assert.equal(memo.transcriptionStatus, 'manual_fallback');
  assert.ok(memo.keywords.includes('아이디어를'));
});

test('POST /voice-memos stores memo for a capture', async () => {
  resetSourcesForTest();
  resetCapturesForTest();
  resetVoiceMemosForTest();
  const source = registerSource({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 33.3 });
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/voice-memos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ captureId: capture.id, memoTranscript: '이 부분 추가 리서치 자료 찾아줘' }),
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.memo.detectedIntent, 'research_note');

    const getResponse = await fetch(`${baseUrl}/voice-memos?captureId=${capture.id}`);
    const getPayload = await getResponse.json();
    assert.equal(getResponse.status, 200);
    assert.equal(getPayload.memo.memoTranscript, '이 부분 추가 리서치 자료 찾아줘');
  } finally {
    server.close();
  }
});

function assertAddressInfo(address: ReturnType<typeof import('node:http').Server.prototype.address>): asserts address is AddressInfo {
  assert.notEqual(address, null);
  assert.notEqual(typeof address, 'string');
}
