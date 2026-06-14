import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/server.ts';

test('GET /health returns policy-safe service status', async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.status, 'ok');
    assert.equal(payload.service, 'note-ai-backend');
    assert.equal(payload.policy.youtubePlayback, 'visible_embedded_player_only');
    assert.equal(payload.policy.hiddenPlayback, false);
    assert.equal(payload.policy.audioDownload, false);
  } finally {
    server.close();
  }
});

function assertAddressInfo(address: ReturnType<typeof import('node:http').Server.prototype.address>): asserts address is AddressInfo {
  assert.notEqual(address, null);
  assert.notEqual(typeof address, 'string');
}
