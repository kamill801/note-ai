import { randomUUID } from 'node:crypto';
import { getNoteById } from './note-service.ts';

export type ResearchResult = {
  provider: 'mocked_search';
  query: string;
  sources: Array<{
    title: string;
    url: string;
    reason: string;
  }>;
  koreanSynthesis: string;
  recommendedNextSteps: string[];
};

export type ResearchJobRecord = {
  id: string;
  noteId: string;
  request: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  result: ResearchResult;
  createdAt: string;
  updatedAt: string;
};

const jobsById = new Map<string, ResearchJobRecord>();
const jobsByNoteId = new Map<string, ResearchJobRecord[]>();

export function createResearchJob(input: { noteId: string; request: string }): ResearchJobRecord {
  const note = getNoteById(input.noteId);
  if (!note) throw new Error('등록된 note를 찾을 수 없습니다.');

  const request = input.request.trim();
  if (request.length === 0) throw new Error('research request는 비어 있을 수 없습니다.');

  const query = buildQuery(note.followUpKeywords, request);
  const now = new Date().toISOString();
  const job: ResearchJobRecord = {
    id: `research_${randomUUID()}`,
    noteId: note.id,
    request,
    status: 'succeeded',
    result: {
      provider: 'mocked_search',
      query,
      sources: [
        {
          title: 'Google Search result page',
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          reason: 'MVP 로컬 환경에서는 외부 검색 API 키 없이 검색 쿼리와 출처 URL 계약만 검증합니다.',
        },
        {
          title: 'YouTube source note evidence',
          url: `note-ai://notes/${note.id}`,
          reason: '추가 리서치가 원본 노트와 evidenceSegmentIds를 기준으로 이어지도록 연결합니다.',
        },
      ],
      koreanSynthesis: `요청 “${request}”에 대해 ${note.followUpKeywords.slice(0, 3).join(', ') || '노트 키워드'} 중심으로 더 확인할 자료를 우선 추천합니다. 실제 검색 API 연결 전까지는 mocked_search 결과입니다.`,
      recommendedNextSteps: ['검색 결과에서 1차 출처를 우선 확인하기', '노트의 근거 transcript와 새 자료의 주장 차이를 비교하기'],
    },
    createdAt: now,
    updatedAt: now,
  };

  jobsById.set(job.id, job);
  jobsByNoteId.set(job.noteId, [job, ...(jobsByNoteId.get(job.noteId) ?? [])]);
  return job;
}

export function listResearchJobs(noteId: string): ResearchJobRecord[] {
  return [...(jobsByNoteId.get(noteId) ?? [])];
}

export function resetResearchJobsForTest(): void {
  jobsById.clear();
  jobsByNoteId.clear();
}

function buildQuery(keywords: string[], request: string): string {
  const joinedKeywords = keywords.slice(0, 4).join(' ');
  return `${joinedKeywords} ${request}`.replace(/\s+/g, ' ').trim();
}
