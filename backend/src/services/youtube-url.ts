export type YouTubeUrlParseResult = {
  videoId: string;
  canonicalUrl: string;
  playlistId?: string;
  startTimeSec?: number;
};

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const SUPPORTED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

export function parseYouTubeUrl(input: string): YouTubeUrlParseResult {
  const raw = input.trim();
  if (raw.length === 0) throw new Error('YouTube URL을 입력해 주세요.');

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('유효한 URL 형식이 아닙니다.');
  }

  const hostname = url.hostname.toLowerCase();
  if (!SUPPORTED_HOSTS.has(hostname)) {
    throw new Error('지원하는 YouTube URL이 아닙니다.');
  }

  const videoId = extractVideoId(url);
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    throw new Error('YouTube videoId를 찾을 수 없습니다.');
  }

  const playlistId = url.searchParams.get('list') ?? undefined;
  const startTimeSec = parseStartTime(url.searchParams.get('t') ?? url.searchParams.get('start'));
  const canonicalUrl = buildCanonicalUrl(videoId, startTimeSec);

  return {
    videoId,
    canonicalUrl,
    ...(playlistId ? { playlistId } : {}),
    ...(startTimeSec !== undefined ? { startTimeSec } : {}),
  };
}

function extractVideoId(url: URL): string | undefined {
  const hostname = url.hostname.toLowerCase();
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
    return pathParts[0];
  }

  if (url.pathname === '/watch') {
    return url.searchParams.get('v') ?? undefined;
  }

  if (pathParts[0] === 'shorts' || pathParts[0] === 'embed' || pathParts[0] === 'live') {
    return pathParts[1];
  }

  return undefined;
}

function buildCanonicalUrl(videoId: string, startTimeSec?: number): string {
  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoId);
  if (startTimeSec !== undefined) url.searchParams.set('t', `${startTimeSec}s`);
  return url.toString();
}

function parseStartTime(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!match) return undefined;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : undefined;
}
