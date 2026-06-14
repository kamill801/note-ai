import { randomUUID } from 'node:crypto';
import { parseYouTubeUrl } from './youtube-url.ts';

export type SourceRecord = {
  id: string;
  platform: 'youtube';
  url: string;
  videoId: string;
  playlistId?: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl: string;
  durationSec?: number;
  transcriptStatus: 'pending' | 'ready' | 'unavailable' | 'failed';
  createdAt: string;
  updatedAt: string;
};

export type RegisterSourceInput = {
  url: string;
  sourceLabel?: string;
};

const sourcesByUrl = new Map<string, SourceRecord>();
const sourcesById = new Map<string, SourceRecord>();

export function registerSource(input: RegisterSourceInput): SourceRecord {
  const parsed = parseYouTubeUrl(input.url);
  const existing = sourcesByUrl.get(parsed.canonicalUrl);
  if (existing) return existing;

  const now = new Date().toISOString();
  const source: SourceRecord = {
    id: `src_${randomUUID()}`,
    platform: 'youtube',
    url: parsed.canonicalUrl,
    videoId: parsed.videoId,
    ...(parsed.playlistId ? { playlistId: parsed.playlistId } : {}),
    title: normalizeTitle(input.sourceLabel) ?? `YouTube 영상 ${parsed.videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`,
    transcriptStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  sourcesByUrl.set(source.url, source);
  sourcesById.set(source.id, source);
  return source;
}

export function listSources(): SourceRecord[] {
  return [...sourcesById.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSourceById(sourceId: string): SourceRecord | undefined {
  return sourcesById.get(sourceId);
}

export function setSourceTranscriptStatus(sourceId: string, transcriptStatus: SourceRecord['transcriptStatus']): SourceRecord {
  const source = getSourceById(sourceId);
  if (!source) throw new Error('등록된 source를 찾을 수 없습니다.');
  source.transcriptStatus = transcriptStatus;
  source.updatedAt = new Date().toISOString();
  return source;
}

export function resetSourcesForTest(): void {
  sourcesByUrl.clear();
  sourcesById.clear();
}

function normalizeTitle(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
