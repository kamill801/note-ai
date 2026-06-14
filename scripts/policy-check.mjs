import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const scanRoots = ['backend/src', 'mobile/src', 'mobile/app.json'];
const forbiddenPatterns = [
  /youtube.*download/i,
  /download.*youtube/i,
  /audio-only/i,
  /hidden.*youtube/i,
  /background.*youtube/i,
  /shouldPlayInBackground:\s*true/i,
  /allowsBackgroundRecording:\s*true/i,
  /enableBackgroundRecording"?\s*:\s*true/i,
];

const files = scanRoots.flatMap((root) => collectFiles(root));
const violations = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) violations.push(`${file}: ${pattern}`);
  }
}

if (violations.length > 0) {
  console.error(`Policy check failed:\n${violations.join('\n')}`);
  process.exit(1);
}

console.log('policy check passed: no hidden/background YouTube playback, audio-only extraction, or YouTube download markers found');

function collectFiles(path) {
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  return readdirSync(path).flatMap((entry) => collectFiles(join(path, entry)));
}
