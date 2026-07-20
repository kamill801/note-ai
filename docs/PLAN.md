# PLAN: 이동 중 YouTube 지식 캡처 앱

Status: Draft
Last updated: 2026-07-04

## Current Goal

1차 MVP는 앱 내 YouTube 재생 기반 정확 저장 모드에 Siri/App Shortcut 핸즈프리 트리거를 붙여 전체 기능 파이프라인을 검증한다. 목표는 "그럴듯한 데모"가 아니라 링크 등록, 재생, Siri 기반 저장 호출, timestamp 저장, 음성 메모, 노트 생성, 추가 리서치가 기능적으로 정상작동하는 것이다.

## Development Principles

- 먼저 정확 저장 모드로 전체 파이프라인을 검증한다.
- 구현 전에 `DESIGN.md`를 MVP1 design decision baseline으로 확인한다.
- YouTube 앱 연동형 추정 저장은 2차 MVP로 둔다.
- YouTube를 대체하지 않는다.
- 시스템 전체 always-listening은 하지 않는다.
- MVP1 primary hands-free interaction은 `Siri/App Shortcut -> 방금 저장`이다.
- 앱 내부 custom wake word는 experimental로 유지하며 MVP 성공 기준에 묶지 않는다.
- 수동 버튼과 텍스트 입력은 Siri 실패/권한 거부/소음 환경을 위한 fallback이다.
- TECHSPEC에는 구현 순서를 넣지 않고, 이 파일에서만 관리한다.

## Pre-Implementation Gate: Design Decision Lock

목표: OMX가 바로 구현으로 뛰지 않고, MVP1 모바일 UX/visual baseline을 먼저 확정한다.

Current status:

- Complete for MVP1 as of 2026-06-15.
- Active design contract: root `DESIGN.md`.
- Active visual reference: `docs/design-review.html`.
- MVP1 selected style: Neo Brutalism with Block Lime `#dceeb1`.
- Product-facing save language: `이 부분 저장`, `방금 저장`, `내 생각 말하기`.

Required action:

- `DESIGN.md`를 읽고 현재 설계가 MVP1 구현에 충분한지 확인한다.
- 누락된 UX/시각/상태/마이크 권한/오류 상태가 있으면 `DESIGN.md`에 먼저 보강한다.
- 제품 방향을 바꾸는 디자인 결정이 필요하면 사용자에게 질문한다.
- 단순 구현 세부 스타일은 `DESIGN.md`의 원칙을 기준으로 합리적으로 결정하고 기록한다.

Acceptance:

- `DESIGN.md`가 MVP1 구현의 디자인 기준점으로 사용 가능하다.
- Player/Capture, Source Library, Note Detail, Research Result의 핵심 화면 방향이 설명되어 있다.
- 색감, typography, spacing, component states, accessibility, microcopy constraints가 구현자가 참고할 정도로 정리되어 있다.
- 남은 open question이 있더라도 Milestone 0 진행을 막는지 여부가 명시되어 있다.

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

### Milestone 3A: Siri/App Shortcut Save Command

목표: 사용자가 `듣기` 화면에서 영상 재생 중 "Siri야, Note AI에 방금 저장"을 말하면 버튼 없이 앱이 foreground되고, 플레이어를 멈춘 뒤 timestamp 저장, 메모 저장, 노트 생성을 수행한다.

Acceptance:

- iOS App Intent/App Shortcut이 `방금 저장` 액션을 노출한다.
- Shortcut 실행 시 앱이 열리거나 foreground된다.
- 앱은 shortcut/deep-link/native event를 `capture_now` action으로 파싱한다.
- action 수신 시 YouTube player에 pause를 요청하고 현재 timestamp를 고정한다.
- timestamp 저장 후 사용자 음성 메모/의도 입력 상태로 전환한다.
- 명령 성공 시 현재 player timestamp로 `POST /captures`, memo가 있으면 `POST /voice-memos`, 이후 `POST /notes`까지 자동 실행한다.
- Siri 실행 실패, 권한 거부, 플레이어 준비 전 상태에서는 기존 수동 버튼/텍스트 입력 fallback을 제공한다.
- YouTube 플레이어는 계속 화면에 보이고, 백그라운드/숨김 재생을 제공하지 않는다.

### Milestone 3B: Experimental Foreground Wake Word

목표: 기존 `노트AI야` foreground wake word 실험은 유지하되 MVP 성공 기준에서 분리한다.

Acceptance:

- 설정 또는 내부 flag 뒤에서만 사용한다.
- 실패해도 Siri/App Shortcut save path를 막지 않는다.
- UI는 custom wake word를 시스템 전체 wake word처럼 약속하지 않는다.

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

- DONE: 모바일 앱 scaffold.
  - Files likely affected: `mobile/`
  - Acceptance: app starts locally.
  - Test: local run.

- DONE: backend scaffold.
  - Files likely affected: `backend/`
  - Acceptance: health check returns OK.
  - Test: API request.

- DONE: mobile API base URL environment wiring.
  - Files likely affected: `mobile/src/services/api.ts`, `.env.example`
  - Acceptance: mobile API client reads `EXPO_PUBLIC_API_BASE_URL` with a safe local fallback.
  - Test: mobile typecheck and workspace check.

- DONE: backend + Expo Dev Client local smoke preparation.
  - Files likely affected: `scripts/dev-client-smoke.mjs`, `docs/DEVELOPMENT.md`
  - Acceptance: one command starts backend dev server and Expo Dev Client Metro, then verifies backend `/health` and Metro `/status`.
  - Test: `npm run smoke:dev-client`.

- DONE: database schema setup.
  - Files likely affected: `backend/db/`
  - Acceptance: migration creates required tables.
  - Test: migration dry run.

### Source and Player

- DONE: YouTube URL parser.
  - Files likely affected: `backend/src/services/source-service.ts`
  - Acceptance: normal YouTube URL, short URL, playlist URL handling defined.
  - Test: unit tests.

- DONE: source registration API.
  - Files likely affected: `backend/src/routes/sources.ts`
  - Acceptance: creates source record.
  - Test: API test.

- DONE: in-app player screen.
  - Files likely affected: `mobile/src/screens/PlayerScreen.tsx`
  - Acceptance: renders official embedded player visibly.
  - Test: device/simulator smoke.

- DONE: player bridge current time.
  - Files likely affected: `mobile/src/components/YouTubePlayerView.tsx`
  - Acceptance: can read current playback time.
  - Test: manual capture timestamp check.

### Capture and Voice

- DONE: capture mode UI.
  - Files likely affected: `mobile/src/components/CaptureModeToggle.tsx`
  - Acceptance: active/inactive states visible.
  - Test: UI smoke.

- DONE: microphone permission and recorder.
  - Files likely affected: `mobile/src/services/audio.ts`
  - Acceptance: records memo after permission.
  - Test: device test.

- DONE: speech-to-text integration (manual transcript fallback; external STT credential integration pending).
  - Files likely affected: `backend/src/ai/speech-to-text.ts`
  - Acceptance: memo transcript saved.
  - Test: fixture audio.

- DONE: Siri/App Shortcut action bridge.
  - Files likely affected: `mobile/App.tsx`, `mobile/src/services/shortcut-action.ts`, `mobile/src/screens/PlayerScreen.tsx`
  - Acceptance: `noteai://shortcut/capture-now` or native shortcut event becomes one queued `capture_now` action.
  - Test: TypeScript unit tests for action parser/deduping and manual URL smoke.

- DONE: iOS App Intent and App Shortcut.
  - Files likely affected: `mobile/ios/NoteAI/`, `mobile/ios/NoteAI.xcodeproj/project.pbxproj`
  - Acceptance: iPhone exposes built-in `Note AI에 방금 저장/요약/조사/정리` App Shortcut phrases that open/foreground the app and write a native `PendingCaptureRequest`.
  - Test: `xcodebuild -workspace mobile/ios/NoteAI.xcworkspace -scheme NoteAI -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build`; real iPhone Siri/App Shortcut manual QA still required after device reinstall.

- DONE: shortcut-triggered player pause and timestamp freeze.
  - Files likely affected: `mobile/src/screens/PlayerScreen.tsx`, `mobile/src/components/YouTubePlayerView.tsx`
  - Acceptance: action receipt pauses the visible player, snapshots `currentTimeSec`, then creates the `siri_shortcut` capture when the follow-up memo/save command is recognized.
  - Test: mobile unit/typecheck plus real-device manual flow.

- DONE: Siri memo parameter handoff.
  - Files likely affected: `mobile/src/screens/PlayerScreen.tsx`, `mobile/src/services/pending-capture-request.ts`, `mobile/src/services/pending-capture-native.ts`, `mobile/src/services/voice-command.ts`
  - Acceptance: if Siri provides the memo parameter, React Native skips post-trigger speech recognition, pauses the player, snapshots timestamp, creates capture/memo/note/research from the Siri memo, and clears the pending request.
  - Test: `npm --workspace mobile test`, `npm --workspace mobile run typecheck`; real iPhone Siri memo prompt QA still required after device reinstall.

- TODO: experimental foreground voice command dependency and permissions.
  - Files likely affected: `mobile/package.json`, `mobile/app.json`, `mobile/ios/`
  - Acceptance: Dev Client includes speech recognition native module and iOS permission copy.
  - Test: `npm --workspace mobile exec -- expo config --type public`, iOS simulator smoke.

- TODO: experimental voice command parser.
  - Files likely affected: `mobile/src/services/voice-command.ts`
  - Acceptance: app trigger + save phrase parse to `save_moment`; unrelated speech ignored.
  - Test: unit or focused TypeScript-level parser checks.

- TODO: experimental voice-first listen screen.
  - Files likely affected: `mobile/src/screens/PlayerScreen.tsx`
  - Acceptance: while voice mode is on, recognized command creates capture, memo, and note without extra taps.
  - Test: simulator/dev-client manual voice command smoke; fallback button still works.

### Transcript and AI

- DONE: transcript import provider for test videos.
  - Files likely affected: `backend/src/services/transcript-service.ts`
  - Acceptance: transcript segments stored.
  - Test: fixture transcript.

- DONE: timestamp segment selector.
  - Files likely affected: `backend/src/services/segment-selection-service.ts`
  - Acceptance: returns expected rows around timestamp.
  - Test: unit test.

- DONE: note generation prompt/schema.
  - Files likely affected: `backend/src/ai/note-generator.ts`
  - Acceptance: valid structured JSON note.
  - Test: schema validation.

- DONE: research service.
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


## Progress Log

### 2026-06-15 — Session `omx-1781457410925-r39u0p`

- [x] Milestone 0 bootstrap files created: root npm workspace, `backend/`, `mobile/`, shared scripts, `.env.example` updates.
- [x] Backend health check implemented at `GET /health`.
- [x] PostgreSQL/pgvector-oriented initial schema added at `backend/db/migrations/0001_initial.sql`.
- [x] Expo Dev Client mobile scaffold added with Neo Brutalism token contract (`mobile/src/design/tokens.ts`).
- [x] Milestone 1 started: YouTube URL parser, source registration service/API, and import/source list mobile screen added.
- [x] Verification: `npm run check` passed — workspace bootstrap, 10 backend tests, migration validation, mobile design contract.
- [x] Verification: `npm run typecheck` passed — backend and mobile TypeScript.
- [x] Verification: `npm run smoke:backend` passed — `health smoke passed: ok`.
- [x] Verification: `npm --workspace mobile exec -- expo config --type public` passed — Expo SDK 56 config resolved with microphone permission copy.
- [x] Verification: Expo Metro startup smoke reached QR/dev-client screen and was stopped cleanly.
- [ ] DB live connection: `npm run db:check` failed because no local PostgreSQL server/tooling is running in this environment. Schema validation passed; live DB remains environment setup work.
- [ ] Security audit: `npm audit --omit=dev` reports Expo SDK 56 transitive `xcode -> uuid@7.0.3` moderate advisory; non-breaking `npm audit fix` cannot resolve and `--force` would downgrade Expo to 46, so no force fix applied.

Session stop reason: user requested temporary stop (`잠깐 중단`).

### 2026-06-15 — Continued Session `omx-1781457410925-r39u0p`

- [x] Milestone 2 implemented: visible `react-native-webview` YouTube IFrame player, `getCurrentTime()` bridge, visible player state, manual `이 부분 저장` timestamp capture.
- [x] Milestone 2 backend implemented: `POST /captures`, `GET /captures`, exact timestamp capture tests.
- [x] Milestone 3 implemented: foreground capture mode UI, explicit mic permission state, `expo-audio` recorder, background recording/playback disabled, user memo manual transcript fallback.
- [x] Milestone 3 backend implemented: `POST /voice-memos`, memo preservation, intent classification, keyword extraction.
- [x] Milestone 4 implemented: manual/test transcript import provider, timestamp window selector (`-45s/+75s`), memo-only fallback when transcript unavailable.
- [x] Milestone 5 implemented: deterministic Korean structured note generator/schema, user memo preservation, evidence segment IDs, memo-only low-confidence fallback.
- [x] Milestone 6 implemented: mocked research job with source URLs, Korean synthesis, next steps.
- [x] Milestone 7 API QA implemented: `npm run qa` runs check/typecheck/backend smoke/MVP1 API smoke/policy check.
- [x] Verification: `npm run qa` passed — 23 backend tests, migration validation, mobile design contract, typecheck, backend smoke, full MVP1 API smoke, policy check.
- [x] Verification: Expo config/startup smoke passed after adding `expo-audio`; dev-client Metro reached QR screen and stopped cleanly.
- [ ] Live DB connection still requires Docker/PostgreSQL on the developer machine; `docker-compose.yml` was added, but Docker is unavailable in this runtime.
- [ ] Real speech-to-text and real web search require API credentials/providers; current MVP uses explicit manual transcript fallback and mocked search result without storing secrets.
- [ ] Device/simulator timestamp accuracy (+/- 2s) and microphone recording must be manually verified in an Expo Dev Client build.
- [ ] `npm audit --omit=dev` still reports Expo SDK 56 transitive `xcode -> uuid@7.0.3` moderate advisory; non-breaking fix unavailable, force fix would downgrade Expo.

### 2026-06-15 — Continued Session `omx-1781464753324-prel3t`

- [x] Preserved existing uncommitted work and started by checking `git status --short`.
- [x] Re-read the required source-of-truth docs and confirmed the MVP1 design gate remains complete.
- [x] Mobile-backend vertical slice connected:
  - `ImportSourceScreen` now registers sources through `POST /sources`.
  - MVP1 demo path imports a manual Korean transcript through `POST /transcripts`.
  - `PlayerScreen` now creates backend exact captures through `POST /captures`.
  - `CaptureModeScreen` now stores the memo through `POST /voice-memos` and generates the Korean note through `POST /notes`.
  - New `NoteDetailScreen` shows timestamp, confidence, summary, preserved user memo, application ideas, transcript evidence, keywords, recommended materials, and follow-up research results.
  - `NoteDetailScreen` can create a mocked source-backed research job through `POST /research-jobs`.
- [x] Backend transcript import now updates source `transcriptStatus` to `ready` for API/UI consistency.
- [x] Verification: `npm run check` passed — 23 backend tests, migration validation, mobile design contract.
- [x] Verification: `npm run typecheck` passed — backend and mobile TypeScript.
- [x] Verification: `npm run smoke:backend` passed.
- [x] Verification: `npm run smoke:mvp1` passed.
- [x] Verification: `npm run policy:check` passed — no hidden/background YouTube playback, audio-only extraction, or YouTube download markers found.
- [x] Verification: `npm --workspace mobile exec -- expo config --type public` passed.
- [x] Verification: Expo Metro startup smoke reached `Waiting on http://localhost:8081`; process was stopped afterward.
- [ ] Live DB connection remains unverified in this runtime: `npm run db:check` returned `ECONNREFUSED`; `docker compose up -d postgres` could not run because `docker` is not installed.
- [ ] Physical device/simulator smoke for YouTube player timestamp accuracy and microphone recording remains manual.

### 2026-06-15 — Direct Ralph Continuation

- [x] Added VS Code/Codex continuation helpers for direct non-tmux work:
  - `docs/CODEX_CONTINUE_PROMPT.md`
  - `.vscode/tasks.json` task `OMX: Direct Continue MVP1 (No Tmux)`
  - `docs/DEVELOPMENT.md` direct-mode guidance.
- [x] Added `scripts/dev-client-smoke.mjs` and `npm run smoke:dev-client` for local backend + Expo Dev Client readiness checks.
- [x] Connected product-level mobile navigation:
  - Home now receives latest source/note state and routes to import, listen, note library/detail, and settings.
  - Added `NoteLibraryScreen` for saved note reopening.
  - Added `SettingsScreen` for local API/provider/policy visibility.
  - App startup now hydrates the latest source and note from `GET /sources` and `GET /notes` while the local in-memory backend process is alive.
- [x] Backend `GET /notes` now returns a note library list when no `captureId` is provided.
- [x] Mobile API client now exposes health/source/note list helpers, API URL visibility, and clearer network/JSON errors.
- [x] Aligned Expo SDK dependency check by updating mobile TypeScript to Expo's expected range and adding the TypeScript 6 deprecation setting.
- [x] Verification: `npm run typecheck` passed after mobile routing/session hydration changes.
- [x] Verification: `npm run qa` passed — 23 backend tests, migration validation, mobile design contract, typecheck, backend smoke, MVP1 API smoke, policy check.
- [x] Verification: `npm run smoke:dev-client` passed on alternate local ports `3011`/`8083`.
- [x] Verification: `npm --workspace mobile exec -- expo install --check` reports dependencies up to date using the local Expo dependency map.
- [ ] Persistent recovery across backend restarts remains future work until the PostgreSQL layer replaces the current in-memory MVP services.
- [ ] Physical device/simulator smoke remains: visible YouTube player behavior, microphone recording, and timestamp accuracy in a real Expo Dev Client build. Current runtime evidence: `xcrun simctl list devices booted` fails because `simctl` is unavailable, and `adb` is not installed.
