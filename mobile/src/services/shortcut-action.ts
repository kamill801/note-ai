export type ShortcutActionSource = 'deeplink' | 'siri_shortcut' | 'siri_app_intent' | 'manual_button';

export type CaptureNowShortcutAction = {
  readonly action: 'capture_now';
  readonly id?: string;
  readonly memoTranscript?: string;
  readonly receivedAtMs: number;
  readonly source: ShortcutActionSource;
};

export type NoShortcutAction = {
  readonly action: 'none';
  readonly receivedAtMs: number;
  readonly reason: 'empty' | 'invalid_url' | 'unsupported_action';
};

export type ShortcutAction = CaptureNowShortcutAction | NoShortcutAction;

type ShortcutActionGateOptions = {
  readonly dedupeWindowMs: number;
};

export function parseShortcutAction(value: string, receivedAtMs = Date.now()): ShortcutAction {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { action: 'none', receivedAtMs, reason: 'empty' };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'noteai:') {
      return { action: 'none', receivedAtMs, reason: 'unsupported_action' };
    }

    const actionPath = [url.hostname, url.pathname.replace(/^\/+/, '')].filter(Boolean).join('/');
    if (actionPath === 'shortcut/capture-now' || actionPath === 'capture-now') {
      return { action: 'capture_now', receivedAtMs, source: 'deeplink' };
    }

    return { action: 'none', receivedAtMs, reason: 'unsupported_action' };
  } catch (caught) {
    if (caught instanceof TypeError) {
      return { action: 'none', receivedAtMs, reason: 'invalid_url' };
    }
    throw caught;
  }
}

export function createShortcutActionGate(options: ShortcutActionGateOptions) {
  let lastAcceptedAtMs: number | null = null;

  return {
    shouldAccept(action: CaptureNowShortcutAction): boolean {
      if (lastAcceptedAtMs !== null && action.receivedAtMs - lastAcceptedAtMs < options.dedupeWindowMs) {
        return false;
      }
      lastAcceptedAtMs = action.receivedAtMs;
      return true;
    },
  };
}
