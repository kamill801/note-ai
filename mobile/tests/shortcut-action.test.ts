import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createShortcutActionGate,
  parseShortcutAction,
} from '../src/services/shortcut-action.ts';

test('Given capture shortcut URL When parsing shortcut action Then it returns capture_now', () => {
  const result = parseShortcutAction('noteai://shortcut/capture-now');

  assert.equal(result.action, 'capture_now');
  if (result.action !== 'capture_now') return;
  assert.equal(result.source, 'deeplink');
});

test('Given unrelated URL When parsing shortcut action Then it returns none', () => {
  const result = parseShortcutAction('noteai://settings');

  assert.equal(result.action, 'none');
});

test('Given duplicate shortcut invocations When checking action gate Then only first is accepted', () => {
  const gate = createShortcutActionGate({ dedupeWindowMs: 1500 });
  const first = gate.shouldAccept({ action: 'capture_now', receivedAtMs: 1000, source: 'siri_shortcut' });
  const duplicate = gate.shouldAccept({ action: 'capture_now', receivedAtMs: 1800, source: 'siri_shortcut' });
  const later = gate.shouldAccept({ action: 'capture_now', receivedAtMs: 2700, source: 'siri_shortcut' });

  assert.equal(first, true);
  assert.equal(duplicate, false);
  assert.equal(later, true);
});
