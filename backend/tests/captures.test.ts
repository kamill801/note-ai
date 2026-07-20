import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/server.ts';
import { createExactCapture, resetCapturesForTest } from '../src/services/capture-service.ts';
import { registerSource, resetSourcesForTest } from '../src/services/source-service.ts';

test('createExactCapture stores exact timestamp captures for registered sources', () => {
  resetSourcesForTest();
  resetCapturesForTest();
  const source = registerSource({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 42.4242 });

  assert.equal(capture.mode, 'in_app_exact');
  assert.equal(capture.sourceId, source.id);
  assert.equal(capture.capturedAtSec, 42.424);
  assert.equal(capture.trigger, 'manual_button');
});

test('createExactCapture rejects missing source and invalid timestamps', () => {
  resetSourcesForTest();
  resetCapturesForTest();
  assert.throws(() => createExactCapture({ sourceId: 'src_missing', capturedAtSec: 1 }), /source/);

  const source = registerSource({ url: 'https://youtu.be/dQw4w9WgXcQ' });
  assert.throws(() => createExactCapture({ sourceId: source.id, capturedAtSec: -1 }), /0 이상의 숫자/);
});

test('POST /captures creates manual timestamp capture', async () => {
  resetSourcesForTest();
  resetCapturesForTest();
  const source = registerSource({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/captures`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceId: source.id, capturedAtSec: 73.2, trigger: 'manual_button' }),
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.capture.mode, 'in_app_exact');
    assert.equal(createPayload.capture.capturedAtSec, 73.2);

    const listResponse = await fetch(`${baseUrl}/captures?sourceId=${source.id}`);
    const listPayload = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.captures.length, 1);
  } finally {
    server.close();
  }
});

test('POST /captures creates Siri shortcut timestamp capture', async () => {
  resetSourcesForTest();
  resetCapturesForTest();
  const source = registerSource({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/captures`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sourceId: source.id,
        capturedAtSec: 81.7,
        trigger: 'siri_shortcut',
        triggerTranscript: 'Siri/App Shortcut: 방금 저장',
      }),
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.capture.trigger, 'siri_shortcut');
    assert.equal(createPayload.capture.triggerTranscript, 'Siri/App Shortcut: 방금 저장');
    assert.equal(createPayload.capture.capturedAtSec, 81.7);
  } finally {
    server.close();
  }
});

function assertAddressInfo(address: ReturnType<typeof import('node:http').Server.prototype.address>): asserts address is AddressInfo {
  assert.notEqual(address, null);
  assert.notEqual(typeof address, 'string');
}
