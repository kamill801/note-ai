export type SourceSummary = {
  id: string;
  title: string;
  videoId: string;
  url?: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  durationSec?: number;
  transcriptStatus: 'pending' | 'ready' | 'unavailable' | 'failed';
};

export type BackendHealth = {
  status: 'ok';
  service: string;
  appEnv: string;
  database: {
    host: string;
    port: number;
    database: string;
    configured: boolean;
  };
  policy: {
    youtubePlayback: string;
    hiddenPlayback: false;
    audioDownload: false;
  };
  checkedAt: string;
};

export type TimestampCapture = {
  id: string;
  sourceId: string;
  mode?: 'in_app_exact';
  capturedAtSec: number;
  trigger?: 'manual_button' | 'voice_trigger' | 'siri_shortcut';
  triggerTranscript?: string;
  createdAt: string;
};

export type VoiceMemo = {
  id: string;
  captureId: string;
  memoTranscript: string;
  detectedIntent: 'summary_note' | 'idea_note' | 'research_note' | 'content_draft_note';
  keywords: string[];
  audioUri?: string;
  originalAudioRetention: 'local_uri_only' | 'not_saved';
  transcriptionStatus: 'manual_fallback' | 'transcribed';
  createdAt: string;
};

export type GeneratedNote = {
  title: string;
  timestampLabel: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  userMemoSummary: string;
  applicationIdeas: string[];
  followUpKeywords: string[];
  recommendedMaterials: Array<{
    title: string;
    reason: string;
    url: string;
  }>;
  evidenceSegmentIds: string[];
  sourceEvidence: Array<{
    segmentId: string;
    timestampLabel: string;
    text: string;
  }>;
};

export type NoteRecord = {
  id: string;
  captureId: string;
  title: string;
  noteJson: GeneratedNote;
  evidenceSegmentIds: string[];
  followUpKeywords: string[];
  generationStatus: 'succeeded' | 'failed';
  createdAt: string;
  updatedAt: string;
};

export type ResearchJob = {
  id: string;
  noteId: string;
  request: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  result: {
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
  createdAt: string;
  updatedAt: string;
};
