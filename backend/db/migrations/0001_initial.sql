-- Note AI MVP1 initial PostgreSQL schema.
-- Policy guard: this schema stores source metadata, transcripts, captures, notes,
-- and research artifacts. It does not store downloaded YouTube audio/video.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE capture_mode AS ENUM ('in_app_exact', 'youtube_app_estimated');
CREATE TYPE transcript_status AS ENUM ('pending', 'ready', 'unavailable', 'failed');
CREATE TYPE note_intent AS ENUM ('summary_note', 'idea_note', 'research_note', 'content_draft_note');
CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'youtube',
  url text NOT NULL,
  video_id text NOT NULL,
  title text,
  channel_title text,
  thumbnail_url text,
  duration_sec integer,
  transcript_status transcript_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sources_platform_youtube CHECK (platform = 'youtube'),
  CONSTRAINT sources_video_id_not_blank CHECK (length(trim(video_id)) > 0),
  CONSTRAINT sources_url_unique UNIQUE (url)
);

CREATE INDEX sources_video_id_idx ON sources (video_id);

CREATE TABLE transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  provider text NOT NULL,
  lang text NOT NULL,
  start_sec numeric(10,3) NOT NULL,
  end_sec numeric(10,3),
  speaker text,
  text text NOT NULL,
  is_auto_generated boolean NOT NULL DEFAULT false,
  confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transcript_segment_time_order CHECK (end_sec IS NULL OR end_sec >= start_sec),
  CONSTRAINT transcript_segment_text_not_blank CHECK (length(trim(text)) > 0)
);

CREATE INDEX transcript_segments_source_time_idx ON transcript_segments (source_id, start_sec, end_sec);

CREATE TABLE transcript_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  start_sec numeric(10,3) NOT NULL,
  end_sec numeric(10,3) NOT NULL,
  text text NOT NULL,
  segment_ids uuid[] NOT NULL DEFAULT '{}',
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transcript_window_time_order CHECK (end_sec >= start_sec),
  CONSTRAINT transcript_window_text_not_blank CHECK (length(trim(text)) > 0)
);

CREATE INDEX transcript_windows_source_time_idx ON transcript_windows (source_id, start_sec, end_sec);

CREATE TABLE captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  mode capture_mode NOT NULL DEFAULT 'in_app_exact',
  captured_at_sec numeric(10,3),
  estimated_start_sec numeric(10,3),
  estimated_end_sec numeric(10,3),
  confidence confidence_level,
  trigger_transcript text,
  memo_transcript text,
  memo_audio_url text,
  intent note_intent,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT captures_exact_timestamp_required CHECK (
    mode <> 'in_app_exact' OR captured_at_sec IS NOT NULL
  ),
  CONSTRAINT captures_estimate_label_required CHECK (
    mode <> 'youtube_app_estimated' OR (estimated_start_sec IS NOT NULL AND estimated_end_sec IS NOT NULL AND confidence IS NOT NULL)
  )
);

CREATE INDEX captures_source_created_idx ON captures (source_id, created_at DESC);

CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id uuid NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
  title text NOT NULL,
  note_json jsonb NOT NULL,
  evidence_segment_ids uuid[] NOT NULL DEFAULT '{}',
  follow_up_keywords text[] NOT NULL DEFAULT '{}',
  generation_status job_status NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE TABLE research_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  request text NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  result_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT research_request_not_blank CHECK (length(trim(request)) > 0)
);
