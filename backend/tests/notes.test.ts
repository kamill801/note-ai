import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/server.ts';
import { assertGeneratedNote } from '../src/ai/note-schema.ts';
import { createExactCapture, resetCapturesForTest } from '../src/services/capture-service.ts';
import { generateNoteForCapture, resetNotesForTest } from '../src/services/note-service.ts';
import { registerSource, resetSourcesForTest } from '../src/services/source-service.ts';
import { importTranscriptSegments, resetTranscriptsForTest } from '../src/services/transcript-service.ts';
import { createVoiceMemo, resetVoiceMemosForTest } from '../src/services/voice-memo-service.ts';

test('generateNoteForCapture creates Korean structured note with memo and evidence', () => {
  resetAll();
  const { capture } = seedCaptureContext();
  const note = generateNoteForCapture(capture.id);

  assert.equal(note.generationStatus, 'succeeded');
  assertGeneratedNote(note.noteJson);
  assert.match(note.noteJson.title, /저장 노트/);
  assert.equal(note.noteJson.userMemoSummary, '이 아이디어를 내 서비스 온보딩에 적용해보기');
  assert.ok(note.noteJson.evidenceSegmentIds.length > 0);
  assert.ok(note.noteJson.sourceEvidence[0].text.includes('음성 메모'));
});

test('generateNoteForCapture lowers confidence for memo-only fallback', () => {
  resetAll();
  const source = registerSource({ url: 'https://youtu.be/dQw4w9WgXcQ' });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 80 });
  createVoiceMemo({ captureId: capture.id, memoTranscript: '방금 내용 요약해줘' });
  const note = generateNoteForCapture(capture.id);

  assert.equal(note.noteJson.confidence, 'low');
  assert.equal(note.noteJson.timestampLabel, '근거 자막 없음');
  assert.deepEqual(note.noteJson.evidenceSegmentIds, []);
});

test('POST /notes generates and GET /notes reads note', async () => {
  resetAll();
  const { capture } = seedCaptureContext();
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assertAddressInfo(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ captureId: capture.id }),
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.note.noteJson.userMemoSummary, '이 아이디어를 내 서비스 온보딩에 적용해보기');

    const getResponse = await fetch(`${baseUrl}/notes?captureId=${capture.id}`);
    const getPayload = await getResponse.json();
    assert.equal(getResponse.status, 200);
    assert.equal(getPayload.note.title, createPayload.note.title);

    const listResponse = await fetch(`${baseUrl}/notes`);
    const listPayload = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.notes.length, 1);
    assert.equal(listPayload.notes[0].id, createPayload.note.id);
  } finally {
    server.close();
  }
});

function seedCaptureContext() {
  const source = registerSource({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sourceLabel: '지식 캡처 강의' });
  importTranscriptSegments({
    sourceId: source.id,
    provider: 'manual',
    lang: 'ko',
    segments: [
      { startSec: 40, endSec: 70, text: '사용자의 음성 메모는 왜 이 부분이 중요한지 알려주는 핵심 단서입니다.' },
      { startSec: 71, endSec: 110, text: 'timestamp 주변 자막을 근거로 선택하면 노트가 출처와 연결됩니다.' },
    ],
  });
  const capture = createExactCapture({ sourceId: source.id, capturedAtSec: 80 });
  const memo = createVoiceMemo({ captureId: capture.id, memoTranscript: '이 아이디어를 내 서비스 온보딩에 적용해보기' });
  return { source, capture, memo };
}

function resetAll() {
  resetSourcesForTest();
  resetCapturesForTest();
  resetTranscriptsForTest();
  resetVoiceMemosForTest();
  resetNotesForTest();
}

function assertAddressInfo(address: ReturnType<typeof import('node:http').Server.prototype.address>): asserts address is AddressInfo {
  assert.notEqual(address, null);
  assert.notEqual(typeof address, 'string');
}
