import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeUrl } from '../src/services/youtube-url.ts';

test('parseYouTubeUrl supports watch URLs', () => {
  const parsed = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m05s');
  assert.equal(parsed.videoId, 'dQw4w9WgXcQ');
  assert.equal(parsed.startTimeSec, 65);
  assert.equal(parsed.canonicalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=65s');
});

test('parseYouTubeUrl supports youtu.be short URLs', () => {
  const parsed = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?list=PL123');
  assert.equal(parsed.videoId, 'dQw4w9WgXcQ');
  assert.equal(parsed.playlistId, 'PL123');
});

test('parseYouTubeUrl supports shorts and embed URLs', () => {
  assert.equal(parseYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ').videoId, 'dQw4w9WgXcQ');
  assert.equal(parseYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ').videoId, 'dQw4w9WgXcQ');
});

test('parseYouTubeUrl rejects unsupported URLs clearly', () => {
  assert.throws(() => parseYouTubeUrl('https://example.com/watch?v=dQw4w9WgXcQ'), /지원하는 YouTube URL/);
  assert.throws(() => parseYouTubeUrl('https://www.youtube.com/watch?v=bad'), /videoId/);
});
