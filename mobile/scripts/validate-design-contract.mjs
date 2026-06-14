import { readFileSync } from 'node:fs';

const tokens = readFileSync(new URL('../src/design/tokens.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/screens/HomeScreen.tsx', import.meta.url), 'utf8');
const importScreen = readFileSync(new URL('../src/screens/ImportSourceScreen.tsx', import.meta.url), 'utf8');
const playerScreen = readFileSync(new URL('../src/screens/PlayerScreen.tsx', import.meta.url), 'utf8');
const playerView = readFileSync(new URL('../src/components/YouTubePlayerView.tsx', import.meta.url), 'utf8');
const captureScreen = readFileSync(new URL('../src/screens/CaptureModeScreen.tsx', import.meta.url), 'utf8');
const appJson = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));

const requiredTokenMarkers = ['blockLime', '#dceeb1', 'brutal', 'heavy'];
const missingTokens = requiredTokenMarkers.filter((marker) => !tokens.includes(marker));
if (missingTokens.length > 0) {
  console.error(`Design tokens missing Neo Brutalism markers: ${missingTokens.join(', ')}`);
  process.exit(1);
}

const requiredStyleMarkers = ['borderWidth', 'shadows.brutal'];
const missingStyleMarkers = requiredStyleMarkers.filter((marker) => !home.includes(marker));
if (missingStyleMarkers.length > 0) {
  console.error(`Home screen missing Neo Brutalism style usage: ${missingStyleMarkers.join(', ')}`);
  process.exit(1);
}

const requiredCopy = ['정확 저장', '이 부분 저장', '마이크 꺼짐', '숨김 재생'];
const missingCopy = requiredCopy.filter((copy) => !home.includes(copy));
if (missingCopy.length > 0) {
  console.error(`Home screen missing required MVP1 microcopy: ${missingCopy.join(', ')}`);
  process.exit(1);
}

const requiredImportCopy = ['YouTube 링크 등록', '링크 등록', '등록한 영상', '지원하는 YouTube URL'];
const missingImportCopy = requiredImportCopy.filter((copy) => !importScreen.includes(copy));
if (missingImportCopy.length > 0) {
  console.error(`Import screen missing required source-registration copy: ${missingImportCopy.join(', ')}`);
  process.exit(1);
}

const requiredPlayerCopy = ['Milestone 2', '이 부분 저장', '현재 재생', '숨김/백그라운드 재생'];
const missingPlayerCopy = requiredPlayerCopy.filter((copy) => !playerScreen.includes(copy));
if (missingPlayerCopy.length > 0) {
  console.error(`Player screen missing required exact-save copy: ${missingPlayerCopy.join(', ')}`);
  process.exit(1);
}

const requiredBridgeMarkers = ['getCurrentTime', 'ReactNativeWebView.postMessage', 'controls: 1', 'mediaPlaybackRequiresUserAction'];
const missingBridgeMarkers = requiredBridgeMarkers.filter((marker) => !playerView.includes(marker));
if (missingBridgeMarkers.length > 0) {
  console.error(`YouTube player bridge missing required markers: ${missingBridgeMarkers.join(', ')}`);
  process.exit(1);
}

const requiredCaptureCopy = ['캡처 모드', '마이크 권한', '메모 녹음 시작', '사용자 메모 보존됨'];
const missingCaptureCopy = requiredCaptureCopy.filter((copy) => !captureScreen.includes(copy));
if (missingCaptureCopy.length > 0) {
  console.error(`Capture screen missing required mic/capture copy: ${missingCaptureCopy.join(', ')}`);
  process.exit(1);
}

const expoAudioPlugin = appJson.expo?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-audio');
if (!expoAudioPlugin || expoAudioPlugin[1]?.enableBackgroundRecording !== false || expoAudioPlugin[1]?.enableBackgroundPlayback !== false) {
  console.error('expo-audio plugin must explicitly disable background recording/playback.');
  process.exit(1);
}

if (!appJson.expo?.ios?.infoPlist?.NSMicrophoneUsageDescription) {
  console.error('iOS microphone usage description is required.');
  process.exit(1);
}

if (!appJson.expo?.android?.permissions?.includes('RECORD_AUDIO')) {
  console.error('Android RECORD_AUDIO permission marker is required.');
  process.exit(1);
}

console.log('mobile design contract check passed');
