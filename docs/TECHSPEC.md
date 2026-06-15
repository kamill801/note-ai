# TECHSPEC: 이동 중 YouTube 지식 캡처 앱

Status: Draft
Last updated: 2026-06-14

## 0. Document Purpose

이 문서는 제품과 기술 사양을 정의한다. 개발자는 이 문서만으로 시스템의 목적, UX, 데이터 구조, AI 파이프라인, API 경계, 보안/정책 제약, 품질 기준을 이해할 수 있어야 한다.

구현 순서와 작업 체크리스트는 `docs/PLAN.md`에서 관리한다.

## 1. Product Overview

- Product placeholder: Note AI
- Category: mobile knowledge capture app
- One-line definition: 이동 중 YouTube 영상을 보거나 들을 때 중요한 순간과 사용자 음성 메모를 저장하고, AI가 해당 구간을 한국어 지식 노트와 추가 리서치로 정리하는 앱.
- Primary MVP: 앱 내 재생 기반 정확 저장.
- Secondary mode: YouTube 앱 연동형 추정 저장.

## 2. Product Principles

1. Moment-first, not summary-first.
   - 전체 영상 요약보다 사용자가 중요하다고 느낀 순간을 저장하는 것이 우선이다.

2. User intent is first-class data.
   - 콘텐츠 요약만 저장하지 않는다. 사용자가 왜 저장했는지, 어떻게 활용하려는지를 노트에 반영한다.

3. Source-grounded output.
   - 노트는 timestamp, transcript evidence, source URL을 포함해야 한다.

4. Honest uncertainty.
   - 정확 timestamp가 없을 때는 `추정 구간`과 `신뢰도`를 표시한다.

5. Policy-safe YouTube usage.
   - YouTube 플레이어를 숨기거나, 오디오만 분리하거나, 다운로드하거나, 백그라운드 YouTube 오디오 앱처럼 만들지 않는다.

## 3. MVP Scope

### MVP1: In-App Exact Save Mode

사용자가 YouTube 링크를 앱에 등록하고, 앱 안의 공식 YouTube 플레이어로 재생한다. 앱은 현재 재생 시간을 읽고, 사용자의 음성 트리거와 메모를 받아 정확 timestamp 기반 노트를 생성한다.

Must-have:

- YouTube 링크 등록.
- YouTube 임베드 플레이어.
- 현재 재생 시간 읽기.
- 앱 내부 캡처 모드.
- 음성 트리거 인식.
- 음성 메모 녹음/전사.
- timestamp 주변 transcript 구간 선택.
- 한국어 노트 생성.
- 추가 검색 키워드/자료 추천.
- 추가 리서치 요청 처리.

### MVP2: YouTube App Linked Estimated Save Mode

사용자는 YouTube 공식 앱에서 듣는다. 우리 앱은 최근 등록된 영상과 사용자의 음성 메모, transcript를 기반으로 가장 그럴듯한 구간을 추정한다.

Must-have later:

- 최근 등록 영상 기반 capture.
- transcript semantic matching.
- 추정 구간 confidence.
- 다른 후보 구간 보기.

## 4. Data Source Strategy

| Source | Role | MVP1 | MVP2 | Notes |
| --- | --- | --- | --- | --- |
| YouTube URL | video identity | Required | Required | `videoId` extraction required |
| YouTube embedded player state | exact timestamp | Required | Not available | only in app player mode |
| User voice memo | intent and context | Required | Required | speech-to-text |
| Transcript segments | source evidence | Required for best output | Required | provider abstraction needed |
| Web search results | follow-up research | Optional | Optional | source URLs required |
| YouTube app current state | playback time | Not used | Not available | must not claim direct access |

## 5. System Architecture

```txt
Mobile App
  - YouTube link registration
  - In-app YouTube player
  - Capture mode and microphone UI
  - Note library

Backend API
  - Source metadata service
  - Transcript provider service
  - Capture session service
  - AI note generation service
  - Research service

Workers
  - Transcript ingestion
  - Transcript window indexing
  - Embedding generation
  - Research jobs
  - Note post-processing

Storage
  - Relational DB for sources, captures, notes
  - Object storage for optional audio files
  - Vector index for transcript windows
```

## 6. Recommended Tech Stack

### Mobile

- React Native + Expo Dev Client.
- `react-native-webview` for official YouTube iframe player surface.
- Native modules when needed:
  - iOS: App Intents / Shortcuts later.
  - Android: foreground capture mode later.

Rationale:

- Faster MVP build than full native.
- Still allows custom native modules when OS integrations become necessary.
- Suitable for mobile-first UI and audio recording.

### Backend

- Node.js + TypeScript API, or Next.js API route layer if a web dashboard is added.
- Background jobs via a queue such as BullMQ/Redis or equivalent.
- PostgreSQL for product data.
- pgvector or a managed vector store for transcript windows.
- Object storage for optional audio files.

### AI

- Speech-to-text for voice memo transcription.
- Embeddings for transcript semantic search.
- LLM structured output for note generation, intent classification, and reranking.
- Web search provider for follow-up research.

## 7. Functional Requirements

### 7.1 Source Registration

Purpose: register a YouTube video as a source.

Inputs:

- `url`: YouTube URL.
- Optional `sourceLabel`: user-provided label.

Outputs:

- `sourceId`
- `videoId`
- `title`
- `thumbnailUrl`
- `durationSec`
- `transcriptStatus`

Error states:

- Invalid URL.
- Unsupported YouTube URL.
- Metadata fetch failed.
- Transcript unavailable.

Priority: MVP.

### 7.2 In-App YouTube Player

Purpose: allow exact timestamp capture.

Inputs:

- `sourceId`
- `videoId`

Outputs:

- `currentTimeSec`
- player state

Rules:

- Player must remain visible.
- Do not hide player or separate audio/video.
- Do not offer background YouTube playback as a product feature.

Priority: MVP.

### 7.3 Capture Mode

Purpose: enable app-internal voice trigger while video is playing.

Inputs:

- microphone permission
- trigger phrase configuration
- current `sourceId`
- player `currentTimeSec`

Outputs:

- `captureId`
- `capturedAtSec`
- `triggerTranscript`
- capture status

Rules:

- Capture mode must show active state.
- Trigger works only while app is open/capture mode active.
- If trigger is not detected, user can manually tap capture.

Priority: MVP.

### 7.4 Voice Memo

Purpose: record and transcribe the user's additional thought.

Inputs:

- audio stream/file
- `captureId`

Outputs:

- `memoTranscript`
- `detectedIntent`
- `keywords`

Priority: MVP.

### 7.5 Segment Selection

Purpose: pick the relevant source evidence for the note.

MVP1:

- Use exact `capturedAtSec`.
- Select transcript rows in a configurable time window.
- Default: `capturedAtSec - 45s` to `capturedAtSec + 75s`.

MVP2:

- Use semantic matching between memo and transcript windows.
- Return estimated segment and confidence.

Priority:

- MVP1 exact timestamp: MVP.
- MVP2 estimated segment: V1.

### 7.6 Note Generation

Purpose: create a Korean note from source evidence and user memo.

Outputs:

- title
- source summary
- user memo summary
- user idea/application section
- follow-up keywords
- recommended materials
- source evidence
- timestamp or estimated segment
- confidence

Priority: MVP.

### 7.7 Follow-Up Research

Purpose: find additional materials when user asks for deeper research.

Inputs:

- noteId
- user research request
- generated keywords

Outputs:

- source list
- Korean synthesis
- recommended next steps

Priority: MVP optional / should-have.

## 8. AI Pipeline

### 8.1 Input Ingestion

Inputs:

```json
{
  "sourceId": "src_123",
  "captureId": "cap_123",
  "capturedAtSec": 754.2,
  "memoAudioUrl": "s3://...",
  "mode": "in_app_exact"
}
```

### 8.2 Preprocessing

- Extract `videoId`.
- Normalize transcript segments.
- Build transcript windows.
- Transcribe user voice memo.
- Detect memo language and intent.

### 8.3 Evidence Extraction

MVP1 evidence:

```json
{
  "selectionMode": "timestamp_exact",
  "startSec": 709,
  "endSec": 829,
  "segments": ["seg_1", "seg_2", "seg_3"]
}
```

MVP2 evidence:

```json
{
  "selectionMode": "semantic_estimated",
  "startSec": 750,
  "endSec": 830,
  "confidence": "medium",
  "matchedTerms": ["retention loop", "onboarding"]
}
```

### 8.4 Intermediate Artifact Generation

Generate a `CaptureContext`:

```ts
type CaptureContext = {
  source: {
    sourceId: string;
    videoId: string;
    title: string;
    url: string;
  };
  capture: {
    mode: "in_app_exact" | "youtube_app_estimated";
    capturedAtSec?: number;
    estimatedStartSec?: number;
    estimatedEndSec?: number;
    confidence?: "high" | "medium" | "low";
  };
  userMemo: {
    transcript: string;
    intent: "summary_note" | "idea_note" | "research_note" | "content_draft_note";
    keywords: string[];
  };
  evidence: TranscriptSegment[];
};
```

### 8.5 Reasoning / Reranking

MVP1:

- No semantic reranking required for the first path.
- Optional: use memo keywords to expand or shrink the timestamp window.

MVP2:

- Retrieve candidate windows using keyword and embedding similarity.
- Rerank top candidates with an LLM.
- Return segment, confidence, and rationale.

### 8.6 Output Generation

LLM must produce structured JSON:

```json
{
  "title": "string",
  "timestampLabel": "12:34-13:49",
  "confidence": "high",
  "summary": "string",
  "userMemoSummary": "string",
  "applicationIdeas": ["string"],
  "followUpKeywords": ["string"],
  "recommendedMaterials": [
    {
      "title": "string",
      "reason": "string",
      "url": "string"
    }
  ],
  "evidenceSegmentIds": ["seg_123"]
}
```

### 8.7 Safety / Quality Gate

Checks:

- Output must be grounded in transcript evidence.
- User memo must not be omitted.
- Timestamp/segment must be included.
- If evidence is weak, confidence must be lowered.
- Research results must include source URLs.
- The model must not invent exact quotes not present in transcript.

### 8.8 Logging and Evaluation

Log:

- capture mode
- timestamp or estimated segment
- transcription confidence
- selected evidence segment IDs
- note generation status
- user correction if any

Do not log:

- raw secrets
- unnecessary raw microphone stream beyond retention policy
- private clipboard contents unrelated to YouTube URL

## 9. Module Specifications

### 9.1 Source Service

Responsibilities:

- Validate YouTube URL.
- Extract `videoId`.
- Fetch metadata when available.
- Create source record.

### 9.2 Player Bridge

Responsibilities:

- Render embedded player.
- Receive player events.
- Expose `getCurrentTime()`.
- Persist capture timestamp.

### 9.3 Capture Service

Responsibilities:

- Manage capture mode state.
- Start trigger listening.
- Record memo.
- Create capture record.

### 9.4 Transcript Service

Responsibilities:

- Load transcript from provider.
- Normalize transcript rows.
- Create transcript windows.
- Track provider risk and warnings.

Provider result:

```ts
type TranscriptProviderResult = {
  provider: "official_captions" | "user_supplied" | "page_transcript" | "manual" | "third_party";
  policyRisk: "low" | "medium" | "high";
  segments: TranscriptSegment[];
  warnings: string[];
};
```

### 9.5 Segment Selection Service

Responsibilities:

- MVP1 exact timestamp window selection.
- V1 semantic estimated matching.
- Confidence calculation.
- Candidate segment storage.

### 9.6 Note Generation Service

Responsibilities:

- Create structured Korean note.
- Preserve source evidence.
- Preserve user memo.
- Generate follow-up keywords.

### 9.7 Research Service

Responsibilities:

- Convert note topic into search queries.
- Retrieve external sources.
- Filter duplicates/low-quality pages.
- Summarize in Korean with source URLs.

## 10. Data Model

### users

- `id`: string, primary key
- `email`: string, optional
- `created_at`: timestamp
- `settings`: json

### sources

- `id`: string, primary key
- `user_id`: string
- `platform`: enum, `youtube`
- `url`: string
- `video_id`: string
- `title`: string
- `channel_title`: string
- `thumbnail_url`: string
- `duration_sec`: integer
- `transcript_status`: enum, `pending | ready | unavailable | failed`
- `created_at`: timestamp

### transcript_segments

- `id`: string, primary key
- `source_id`: string
- `start_sec`: number
- `end_sec`: number nullable
- `text`: text
- `speaker`: string nullable
- `lang`: string
- `provider`: string
- `created_at`: timestamp

### transcript_windows

- `id`: string, primary key
- `source_id`: string
- `start_sec`: number
- `end_sec`: number
- `text`: text
- `segment_ids`: json array
- `embedding_id`: string nullable

### captures

- `id`: string, primary key
- `user_id`: string
- `source_id`: string
- `mode`: enum, `in_app_exact | youtube_app_estimated`
- `captured_at_sec`: number nullable
- `estimated_start_sec`: number nullable
- `estimated_end_sec`: number nullable
- `confidence`: enum nullable, `high | medium | low`
- `trigger_text`: text nullable
- `memo_transcript`: text
- `audio_object_key`: string nullable
- `status`: enum, `recorded | processing | ready | failed`
- `created_at`: timestamp

### notes

- `id`: string, primary key
- `capture_id`: string
- `title`: string
- `content_json`: json
- `content_markdown`: text
- `research_status`: enum, `none | pending | ready | failed`
- `created_at`: timestamp
- `updated_at`: timestamp

### note_citations

- `id`: string, primary key
- `note_id`: string
- `segment_id`: string
- `section_key`: string

### research_results

- `id`: string, primary key
- `note_id`: string
- `query`: string
- `source_url`: string
- `source_title`: string
- `summary`: text
- `created_at`: timestamp

## 11. API Design

### POST /api/sources

Create a YouTube source.

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=abc123"
}
```

Response:

```json
{
  "sourceId": "src_123",
  "videoId": "abc123",
  "title": "Example video",
  "transcriptStatus": "pending"
}
```

### POST /api/captures

Create a capture.

Request:

```json
{
  "sourceId": "src_123",
  "mode": "in_app_exact",
  "capturedAtSec": 754.2,
  "triggerText": "방금 저장"
}
```

Response:

```json
{
  "captureId": "cap_123",
  "status": "recorded"
}
```

### POST /api/captures/:id/memo

Upload or attach memo transcript/audio.

Request:

```json
{
  "memoTranscript": "방금 리텐션 루프 얘기 좋았어. 내 서비스 온보딩에 적용할 아이디어로 정리해줘.",
  "audioObjectKey": "audio/cap_123.m4a"
}
```

Response:

```json
{
  "captureId": "cap_123",
  "status": "processing"
}
```

### POST /api/notes/generate

Generate note for a capture.

Request:

```json
{
  "captureId": "cap_123"
}
```

Response:

```json
{
  "noteId": "note_123",
  "status": "ready"
}
```

### Current MVP1 Local API Surface

The local TypeScript backend currently exposes root-level routes rather than `/api/*` routes:

- `GET /health`
- `GET /sources`, `POST /sources`
- `GET /transcripts?sourceId=...`, `POST /transcripts`
- `GET /captures?sourceId=...`, `POST /captures`
- `GET /segments?captureId=...`
- `POST /voice-memos`
- `GET /notes?captureId=...`, `GET /notes`, `POST /notes`
- `GET /research-jobs?noteId=...`, `POST /research-jobs`

`GET /notes` without a `captureId` returns the note library list for current local MVP startup hydration. In the current implementation this is process-local because the backend services still use in-memory maps; true recovery across backend restarts requires the PostgreSQL persistence layer.

### POST /research-jobs

Run follow-up research.

Request:

```json
{
  "noteId": "note_123",
  "request": "리텐션 루프와 온보딩 사례를 더 찾아줘"
}
```

Response:

```json
{
  "job": {
    "id": "research_123",
    "status": "succeeded"
  }
}
```

## 12. AI Call Design

### Speech-to-Text

Input:

- memo audio

Output:

- transcript
- confidence if available

Rules:

- Preserve Korean/English mixed terms.
- Do not auto-summarize at this step.

### Intent Classifier

Input:

- memo transcript

Output:

```json
{
  "intent": "idea_note",
  "keywords": ["리텐션 루프", "온보딩", "적용"],
  "requiresResearch": true
}
```

### Note Generator

Input:

- `CaptureContext`

Output:

- structured note JSON

Prompt constraints:

- Korean output.
- Include user memo.
- Include transcript evidence.
- Do not invent missing transcript details.
- If transcript unavailable, clearly label note as memo-only.

### Research Synthesizer

Input:

- note topic
- user request
- search results

Output:

- source-grounded Korean summary with URLs.

## 13. Frontend Structure

Screens:

- Home / recent sources.
- Add source.
- Player and capture mode.
- Capture processing.
- Note detail.
- Research results.
- Settings/privacy.

Core components:

- `YouTubeSourceCard`
- `YouTubePlayerView`
- `CaptureModeToggle`
- `VoiceTriggerIndicator`
- `MemoRecorder`
- `ProcessingStatus`
- `NoteSections`
- `TranscriptEvidence`
- `ResearchSources`

States:

- Loading source metadata.
- Transcript pending/unavailable.
- Mic permission missing.
- Capture mode active.
- Processing note.
- Research pending.
- Error/retry.

## 14. Backend Structure

Suggested modules:

```txt
backend/
  src/
    routes/
      sources.ts
      captures.ts
      notes.ts
      research.ts
    services/
      source-service.ts
      transcript-service.ts
      capture-service.ts
      segment-selection-service.ts
      note-generation-service.ts
      research-service.ts
    workers/
      transcript-ingestion-worker.ts
      note-generation-worker.ts
      research-worker.ts
    ai/
      speech-to-text.ts
      intent-classifier.ts
      note-generator.ts
      research-synthesizer.ts
    db/
      schema.ts
      repositories/
```

## 15. Security, Privacy, and Legal Considerations

### Microphone Privacy

- Request explicit microphone permission.
- Show capture mode clearly.
- Do not record outside capture mode.
- Let user delete audio and transcript.

### YouTube Policy Guardrails

- Use visible official embedded player for in-app playback.
- Do not hide the player.
- Do not offer background YouTube playback as a core feature.
- Do not extract or store YouTube audiovisual content.
- Do not block or alter YouTube player functionality/ads.

### Transcript Acquisition

- Use provider abstraction.
- Mark provider risk.
- Do not assume official API can download arbitrary public captions.
- Production transcript providers require policy/legal review.

### Data Access

- Users can access only their own sources, captures, notes, and research.
- API must check `user_id` ownership on every resource.

## 16. Data Retention and Deletion

Default retention:

- Source metadata: until user deletes.
- Transcript segments: until source deletion, subject to provider policy.
- Voice memo transcript: until capture deletion.
- Raw audio: optional; default delete after successful transcription unless user opts to keep.
- Notes/research: until user deletes.
- Logs: no raw audio or unnecessary private memo content.

Deletion:

- Delete source -> delete captures, notes, transcript windows, citations, research results.
- Delete capture -> delete memo audio/transcript and generated note unless note is explicitly preserved.

## 17. Analytics and Logging

Events:

- source_added
- transcript_ready
- capture_mode_enabled
- trigger_detected
- capture_created
- memo_transcribed
- note_generated
- research_requested
- research_completed
- note_opened
- segment_corrected

Quality metrics:

- trigger detection success rate
- transcription retry rate
- timestamp capture error rate
- note generation failure rate
- research job failure rate
- user correction rate

Do not log:

- raw microphone stream
- full private memo content in analytics
- unrelated clipboard text

## 18. Nonfunctional Requirements

- Timestamp capture: +/- 2 seconds while player is active.
- Note generation: target under 30 seconds for normal-length segment.
- Research job: asynchronous; user can leave and return.
- Mobile-first UI.
- Graceful offline/poor network states.
- Accessibility: large touch targets, clear mic/capture indicators, readable note view.

## 19. Environment Variables

App/runtime:

- `APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`

Database:

- `DATABASE_URL`
- `VECTOR_DATABASE_URL`

Storage:

- `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_ACCESS_KEY`
- `OBJECT_STORAGE_SECRET_KEY`

AI:

- `OPENAI_API_KEY`
- `SPEECH_MODEL`
- `EMBEDDING_MODEL`
- `NOTE_GENERATION_MODEL`

Search/research:

- `SEARCH_API_KEY`
- `SEARCH_API_BASE_URL`

Auth:

- `AUTH_SECRET`
- `JWT_SECRET`

Monitoring:

- `SENTRY_DSN`
- `ANALYTICS_WRITE_KEY`

## 20. Example Note Output

```md
# 리텐션 루프를 온보딩에 적용하기

Source: Example YouTube Video
Timestamp: 12:34-13:49
Confidence: high

## 핵심 요약
영상에서는 사용자가 첫 행동을 완료한 직후 다음 행동으로 자연스럽게 이어지는 리텐션 루프를 설명한다.

## 내 메모
"방금 리텐션 루프 얘기 좋았어. 내 서비스 온보딩에 적용할 아이디어로 정리해줘."

## 적용 아이디어
- 가입 직후 첫 노트 생성까지 유도한다.
- 첫 노트 생성 후 바로 관련 자료 추천을 보여준다.
- 다음 캡처를 위한 바로가기/위젯을 안내한다.

## 추가 검색 키워드
- retention loop onboarding
- activation moment SaaS
- habit loop product onboarding

## 근거 구간
- 12:34-12:58: ...
- 12:58-13:49: ...
```

## 21. Evaluation and Quality Criteria

Functional:

- Link registration works.
- Player timestamp capture works.
- Capture mode works.
- Voice memo transcription works.
- Note generation works.
- Research job works.

AI quality:

- User memo is preserved.
- Note is grounded in transcript evidence.
- Output is Korean.
- Follow-up keywords are specific.
- Research includes URLs.

Policy quality:

- No hidden YouTube playback.
- No YouTube audio/video download.
- No claim of exact current time in YouTube app linked estimated mode.

## 22. Open Questions

- Product name is undecided.
- Final transcript provider needs production-safe validation.
- First launch platform may be iOS-first or Android-first depending implementation resource.
- Pricing is undecided.
