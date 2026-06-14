import test from 'node:test';
import assert from 'node:assert/strict';
import { readBackendConfig } from '../src/config/env.ts';
import { parseDatabaseUrl } from '../src/db/connection.ts';

test('readBackendConfig applies safe development defaults', () => {
  const config = readBackendConfig({});
  assert.equal(config.appEnv, 'development');
  assert.equal(config.port, 3000);
  assert.equal(config.databaseConnectionTimeoutMs, 1500);
});

test('readBackendConfig validates port range', () => {
  assert.throws(() => readBackendConfig({ PORT: '70000' }), /PORT must be <= 65535/);
});

test('parseDatabaseUrl extracts PostgreSQL target without exposing password', () => {
  const target = parseDatabaseUrl('postgres://user:secret@localhost:5433/note_ai?sslmode=require');
  assert.deepEqual(target, {
    host: 'localhost',
    port: 5433,
    database: 'note_ai',
    user: 'user',
    ssl: true,
  });
});
