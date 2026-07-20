import { NativeModules } from 'react-native';
import {
  parsePendingCaptureRequest,
  type PendingCaptureRequest,
} from './pending-capture-request';

type PendingCaptureNativeModule = {
  readonly clearPendingCaptureRequest: (id: string) => Promise<boolean>;
  readonly getPendingCaptureRequest: () => Promise<unknown>;
};

type NativeModuleRegistry = {
  readonly NoteAIPendingCaptureModule?: PendingCaptureNativeModule;
};

const nativeRegistry: NativeModuleRegistry = NativeModules;

export async function readPendingCaptureRequest(): Promise<PendingCaptureRequest | null> {
  const pendingModule = nativeRegistry.NoteAIPendingCaptureModule;
  if (!pendingModule) return null;
  const rawRequest = await pendingModule.getPendingCaptureRequest();
  return parsePendingCaptureRequest(rawRequest);
}

export async function clearPendingCaptureRequest(id: string): Promise<boolean> {
  const pendingModule = nativeRegistry.NoteAIPendingCaptureModule;
  if (!pendingModule) return false;
  return pendingModule.clearPendingCaptureRequest(id);
}
