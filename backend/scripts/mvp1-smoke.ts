import { once } from 'node:events';
import { createServer } from '../src/server.ts';

const server = createServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
if (address === null || typeof address === 'string') throw new Error('Unexpected server address.');
const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  const source = await post('/sources', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', sourceLabel: 'MVP1 smoke video' }).then((body) => body.source);
  const capture = await post('/captures', { sourceId: source.id, capturedAtSec: 90, trigger: 'manual_button' }).then((body) => body.capture);
  const memo = await post('/voice-memos', { captureId: capture.id, memoTranscript: '이 아이디어를 내 서비스 온보딩에 적용하고 추가 리서치도 해줘' }).then((body) => body.memo);
  const transcript = await post('/transcripts', {
    sourceId: source.id,
    provider: 'manual',
    lang: 'ko',
    segments: [
      { startSec: 45, endSec: 80, text: '사용자의 음성 메모는 왜 이 부분이 중요한지 알려주는 핵심 단서입니다.' },
      { startSec: 81, endSec: 125, text: 'timestamp 주변 자막을 근거로 선택하면 노트가 출처와 연결됩니다.' },
    ],
  }).then((body) => body.segments);
  const selection = await post('/segments/select', { captureId: capture.id }).then((body) => body.selection);
  const note = await post('/notes', { captureId: capture.id }).then((body) => body.note);
  const research = await post('/research-jobs', { noteId: note.id, request: '실제 SaaS onboarding 사례 찾아줘' }).then((body) => body.job);

  assert(source.videoId === 'dQw4w9WgXcQ', 'source videoId mismatch');
  assert(capture.mode === 'in_app_exact', 'capture mode mismatch');
  assert(memo.memoTranscript.includes('온보딩'), 'memo transcript not preserved');
  assert(transcript.length === 2, 'transcript import failed');
  assert(selection.selectionMode === 'timestamp_exact', 'segment selection mode mismatch');
  assert(note.noteJson.userMemoSummary.includes('온보딩'), 'note omitted user memo');
  assert(note.noteJson.evidenceSegmentIds.length > 0, 'note missing evidence ids');
  assert(research.result.sources.every((item: { url: string }) => item.url.length > 0), 'research source URL missing');

  console.log('mvp1 api smoke passed');
} finally {
  server.close();
}

async function post(path: string, body: unknown): Promise<any> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${path} failed: ${JSON.stringify(payload)}`);
  return payload;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
