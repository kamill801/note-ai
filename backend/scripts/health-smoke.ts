import { once } from 'node:events';
import { createServer } from '../src/server.ts';

const server = createServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
if (address === null || typeof address === 'string') throw new Error('Unexpected server address.');

try {
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  const payload = await response.json();
  if (!response.ok || payload.status !== 'ok') {
    console.error({ status: response.status, payload });
    process.exit(1);
  }
  console.log(`health smoke passed: ${payload.status}`);
} finally {
  server.close();
}
