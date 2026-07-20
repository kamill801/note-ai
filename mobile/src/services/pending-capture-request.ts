import type { CaptureNowShortcutAction } from './shortcut-action';

export type PendingCaptureRequest = {
  readonly action: 'capture_current_segment';
  readonly createdAt: string;
  readonly id: string;
  readonly memo: string;
  readonly source: 'siri_app_intent';
};

export function parsePendingCaptureRequest(value: unknown): PendingCaptureRequest | null {
  if (!isRecord(value)) return null;
  if (value.action !== 'capture_current_segment') return null;
  if (value.source !== 'siri_app_intent') return null;
  if (typeof value.id !== 'string' || value.id.trim().length === 0) return null;
  if (typeof value.createdAt !== 'string' || value.createdAt.trim().length === 0) return null;
  if (typeof value.memo !== 'string') return null;

  return {
    action: 'capture_current_segment',
    createdAt: value.createdAt,
    id: value.id,
    memo: value.memo,
    source: 'siri_app_intent',
  };
}

export function pendingRequestToShortcutAction(
  request: PendingCaptureRequest,
  receivedAtMs = Date.now(),
): CaptureNowShortcutAction {
  return {
    action: 'capture_now',
    id: request.id,
    memoTranscript: request.memo.trim(),
    receivedAtMs,
    source: 'siri_app_intent',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
