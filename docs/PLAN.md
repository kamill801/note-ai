# PLAN: 이동 중 YouTube 지식 캡처 앱

Status: Draft
Last updated: 2026-06-14

## Current Goal

1차 MVP는 앱 내 YouTube 재생 기반 정확 저장 모드를 구현해 전체 기능 파이프라인을 검증한다. 목표는 "그럴듯한 데모"가 아니라 링크 등록, 재생, 음성 트리거, timestamp 저장, 음성 메모, 노트 생성, 추가 리서치가 기능적으로 정상작동하는 것이다.

## Development Principles

- 먼저 정확 저장 모드로 전체 파이프라인을 검증한다.
- YouTube 앱 연동형 추정 저장은 2차 MVP로 둔다.
- YouTube를 대체하지 않는다.
- 시스템 전체 always-listening은 하지 않는다.
- 음성 트리거는 앱 foreground/capture mode 안에서만 동작한다.
- TECHSPEC에는 구현 순서를 넣지 않고, 이 파일에서만 관리한다.

## Milestones

### Milestone 0: Project Bootstrap

목표: 모바일 앱, 백엔드, 데이터베이스, 기본 개발 환경을 만든다.

Acceptance:

- 앱이 로컬에서 실행된다.
- 백엔드 API health check가 동작한다.
- 데이터베이스 연결이 동작한다.
- 환경 변수 샘플이 있다.

### Milestone 1: Source Registration

목표: YouTube 링크를 앱에 등록하고 source record를 만든다.

Acceptance:

- YouTube URL 붙여넣기로 `videoId`를 추출한다.
- source list에 영상이 표시된다.
- 잘못된 URL은 명확한 오류를 보여준다.

### Milestone 2: In-App Player Exact Timestamp

목표: 앱 안에서 YouTube 영상을 재생하고 현재 재생 시간을 읽는다.

Acceptance:

- 플레이어가 화면에 표시된다.
- 현재 재생 초를 앱 상태로 읽는다.
- 수동 "저장" 버튼으로 timestamp capture가 생성된다.
- 숨김/백그라운드 YouTube 재생을 제공하지 않는다.

### Milestone 3: Capture Mode and Voice Memo

목표: 앱 내부 캡처 모드와 음성 메모를 구현한다.

Acceptance:

- 마이크 권한 요청이 정상 동작한다.
- 캡처 모드 상태가 명확히 표시된다.
- 트리거 문구 또는 수동 버튼으로 capture가 시작된다.
- 추가 음성 메모가 녹음/전사된다.
- 사용자의 메모 텍스트가 누락 없이 저장된다.

### Milestone 4: Transcript and Segment Selection

목표: transcript를 source에 연결하고 timestamp 주변 구간을 선택한다.

Acceptance:

- 테스트 영상 transcript를 import할 수 있다.
- timestamp 기준 앞뒤 구간이 선택된다.
- 선택된 transcript evidence가 capture에 연결된다.
- transcript가 없으면 memo-only fallback을 제공한다.

### Milestone 5: AI Note Generation

목표: source evidence와 user memo를 바탕으로 한국어 노트를 생성한다.

Acceptance:

- 노트에 timestamp, 요약, 사용자 메모, 적용 아이디어, 근거 transcript가 포함된다.
- note generation 결과가 structured JSON으로 저장된다.
- 생성 실패 시 재시도할 수 있다.

### Milestone 6: Follow-Up Research

목표: 추가 검색 키워드/자료 추천과 user-requested research를 구현한다.

Acceptance:

- 노트에서 search keywords를 생성한다.
- 사용자가 추가 리서치를 요청할 수 있다.
- research result에는 source URL과 한국어 요약이 포함된다.
- research job은 비동기로 처리된다.

### Milestone 7: MVP QA

목표: 기능적 성공 기준을 검증한다.

Acceptance:

- 전체 happy path가 한 번에 성공한다.
- mic permission denied, transcript unavailable, AI failure, network failure를 처리한다.
- timestamp capture 정확도가 플레이어 기준 +/- 2초 이내다.
- 노트를 다시 열었을 때 사용자가 왜 저장했는지 이해 가능하다.

## Task Checklist

### Project Bootstrap

- TODO: 모바일 앱 scaffold.
  - Files likely affected: `mobile/`
  - Acceptance: app starts locally.
  - Test: local run.

- TODO: backend scaffold.
  - Files likely affected: `backend/`
  - Acceptance: health check returns OK.
  - Test: API request.

- TODO: database schema setup.
  - Files likely affected: `backend/db/`
  - Acceptance: migration creates required tables.
  - Test: migration dry run.

### Source and Player

- TODO: YouTube URL parser.
  - Files likely affected: `backend/src/services/source-service.ts`
  - Acceptance: normal YouTube URL, short URL, playlist URL handling defined.
  - Test: unit tests.

- TODO: source registration API.
  - Files likely affected: `backend/src/routes/sources.ts`
  - Acceptance: creates source record.
  - Test: API test.

- TODO: in-app player screen.
  - Files likely affected: `mobile/src/screens/PlayerScreen.tsx`
  - Acceptance: renders official embedded player visibly.
  - Test: device/simulator smoke.

- TODO: player bridge current time.
  - Files likely affected: `mobile/src/components/YouTubePlayerView.tsx`
  - Acceptance: can read current playback time.
  - Test: manual capture timestamp check.

### Capture and Voice

- TODO: capture mode UI.
  - Files likely affected: `mobile/src/components/CaptureModeToggle.tsx`
  - Acceptance: active/inactive states visible.
  - Test: UI smoke.

- TODO: microphone permission and recorder.
  - Files likely affected: `mobile/src/services/audio.ts`
  - Acceptance: records memo after permission.
  - Test: device test.

- TODO: speech-to-text integration.
  - Files likely affected: `backend/src/ai/speech-to-text.ts`
  - Acceptance: memo transcript saved.
  - Test: fixture audio.

### Transcript and AI

- TODO: transcript import provider for test videos.
  - Files likely affected: `backend/src/services/transcript-service.ts`
  - Acceptance: transcript segments stored.
  - Test: fixture transcript.

- TODO: timestamp segment selector.
  - Files likely affected: `backend/src/services/segment-selection-service.ts`
  - Acceptance: returns expected rows around timestamp.
  - Test: unit test.

- TODO: note generation prompt/schema.
  - Files likely affected: `backend/src/ai/note-generator.ts`
  - Acceptance: valid structured JSON note.
  - Test: schema validation.

- TODO: research service.
  - Files likely affected: `backend/src/services/research-service.ts`
  - Acceptance: source-backed results attached to note.
  - Test: mocked search.

## Session Plan

### Session 1

- Scaffold app/backend/db.
- Implement YouTube URL parsing and source registration.
- Add initial schemas.

### Session 2

- Build player screen.
- Implement current time bridge.
- Implement manual timestamp capture.

### Session 3

- Add capture mode UI.
- Add mic permission and memo recording.
- Integrate speech-to-text.

### Session 4

- Add transcript fixture/import.
- Implement timestamp segment selection.
- Generate first AI note.

### Session 5

- Add research job.
- Improve note screen.
- Run end-to-end QA.

## Risks

- YouTube embedded playback behavior differs across mobile platforms.
- Transcript provider for production public videos requires policy-safe validation.
- Wake phrase reliability in noisy movement contexts may be weak.
- Speech-to-text may miss Korean/English mixed technical terms.
- Research results may be low quality without source filtering.

## Done Definition

MVP1 is done when:

- User can register a YouTube URL.
- User can play it inside the app.
- User can start capture mode.
- User can save a moment with timestamp.
- User can add voice memo.
- App creates a Korean note with evidence.
- App recommends follow-up keywords/materials.
- App can attach additional research.
- Error states are handled.
- No YouTube policy-risky playback behavior is implemented.

## Handoff Prompt

```md
We are building a mobile-first YouTube knowledge capture app in `/Users/dd/Documents/note-ai`.

Read:
- docs/PRD.md
- docs/TECHSPEC.md
- docs/PLAN.md
- DESIGN.md
- docs/RESEARCH.md

Current milestone: MVP1 in-app exact save mode.

Build only the MVP1 path first:
YouTube URL registration -> in-app visible YouTube player -> current timestamp capture -> capture mode -> voice memo transcription -> timestamp transcript segment selection -> Korean note generation -> follow-up keyword/material recommendation -> optional research.

Do not build:
- YouTube app current-state reading
- hidden/background YouTube playback
- YouTube audio/video download
- system-wide always-listening wake word
- podcast support
- Notion/Obsidian integration
```

## Quality Standards

- UX must make capture state obvious.
- AI outputs must preserve the user's memo.
- Notes must include timestamp/source evidence.
- Privacy states must be explicit for microphone/audio.
- Errors must be recoverable.
- Mobile screens must support one-handed use.
- Tests should cover parsing, segment selection, schema validation, and API behavior.

