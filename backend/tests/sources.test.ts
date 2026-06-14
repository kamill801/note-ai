import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/server.ts';
import { listSources, registerSource, resetSourcesForTest } from '../src/services/source-service.ts';

test('registerSource creates a pending YouTube source record', () => {
  resetSourcesForTest();
  const source = registerSource({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    sourceLabel: '테스트 강의',
  });

  assert.equal(source.platform, 'youtube');
  assert.equal(source.videoId, 'dQw4w9WgXcQ');
  assert.equal(source.title, '테스트 강의');
  assert.equal(source.transcriptStatus, 'pending');
  assert.match(source.thumbnailUrl, /i\.ytimg\.com/);
  assert.equal(listSources().length, 1);
});

test('POST /sources registers and GET /sources lists sources', async () => {
  resetSourcesForTest();
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://youtu.be/dQw4w9WgXcQ', sourceLabel: '아이디어 영상' }),
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.source.videoId, 'dQw4w9WgXcQ');

    const listResponse = await fetch(`${baseUrl}/sources`);
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.sources.length, 1);
    assert.equal(listPayload.sources[0].title, '아이디어 영상');
  } finally {
    server.close();
  }
});

function assertAddressInfo(address: ReturnType<typeof import('node:http').Server.prototype.address>): asserts address is AddressInfo {
  assert.notEqual(address, null);
  assert.notEqual(typeof address, 'string');
}
