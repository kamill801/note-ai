import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parsePendingCaptureRequest,
  pendingRequestToShortcutAction,
} from '../src/services/pending-capture-request.ts';

test('Given native pending capture payload When parsing Then it returns a typed request', () => {
  const result = parsePendingCaptureRequest({
    action: 'capture_current_segment',
    createdAt: '2026-07-06T12:00:00.000Z',
    id: 'request-1',
    memo: '방금 내용 요약하고 온보딩 아이디어로 정리해줘',
    source: 'siri_app_intent',
  });

  assert.notEqual(result, null);
  assert.equal(result?.memo, '방금 내용 요약하고 온보딩 아이디어로 정리해줘');
});

test('Given unsupported native payload When parsing Then it is ignored', () => {
  const result = parsePendingCaptureRequest({
    action: 'open_settings',
    createdAt: '2026-07-06T12:00:00.000Z',
    id: 'request-1',
    memo: 'ignored',
    source: 'siri_app_intent',
  });

  assert.equal(result, null);
});

test('Given pending request When converting Then it becomes a Siri App Intent shortcut action', () => {
  const action = pendingRequestToShortcutAction({
    action: 'capture_current_segment',
    createdAt: '2026-07-06T12:00:00.000Z',
    id: 'request-1',
    memo: '자료 찾아줘',
    source: 'siri_app_intent',
  }, 1000);

  assert.equal(action.action, 'capture_now');
  assert.equal(action.id, 'request-1');
  assert.equal(action.memoTranscript, '자료 찾아줘');
  assert.equal(action.receivedAtMs, 1000);
  assert.equal(action.source, 'siri_app_intent');
});
