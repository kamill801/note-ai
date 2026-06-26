# Design

## Source of truth

- Status: Active for MVP1 implementation
- Last refreshed: 2026-06-19
- Design workflow used:
  - `$design` repo-local design contract workflow.
  - Product ideation workflow Stage 7: design decision lock before implementation.
  - Five-loop local design refinement in `docs/design-review.html`.
- Primary product surfaces:
  - First-run welcome and login.
  - Permission setup.
  - Home and source library.
  - YouTube video import.
  - Source processing.
  - In-app YouTube listening and exact save.
  - Voice memo after save.
  - Note processing.
  - Note detail.
  - Follow-up research.
  - Library/search.
  - Settings/account.
- Evidence reviewed:
  - `docs/PRD.md`
  - `docs/TECHSPEC.md`
  - `docs/PLAN.md`
  - `docs/RESEARCH.md`
  - `docs/DESIGN_REFERENCES.md`
  - `docs/DESIGN_VISUALS.md`
  - `docs/design-review.html`
  - User-selected Neo Brutalism screenshot in the current design review thread.

## Brand

- Personality:
  - Bold, clear, practical, slightly opinionated.
  - Feels like a sharp mobile tool for people who learn while moving.
  - Energetic but not childish.
- Visual direction:
  - Neo Brutalism for MVP1.
  - Thick black borders, offset black shadows, high-contrast cards, simple geometry.
  - Block Lime `#dceeb1` is the signature action/state color.
- Trust signals:
  - Visible YouTube source.
  - Visible timestamp.
  - Visible transcript evidence.
  - Visible user's own memo.
  - Clear exact-vs-estimated language.
- Avoid:
  - Generic AI dashboard aesthetic.
  - Gradient-heavy, glassy, magical, or sparkly AI styling.
  - Hidden metadata for source evidence.
  - The product-facing word `캡처` as a primary CTA.
  - YouTube replacement positioning.
  - Anything that suggests hidden/background YouTube playback.

## Product goals

- Goals:
  - Let users save important YouTube moments while moving.
  - Preserve both the source segment and the user's own thought.
  - Turn the saved moment into a Korean knowledge note with evidence.
  - Let users request related keywords, materials, and follow-up research.
- Non-goals:
  - Full-video summary as the main product.
  - Background YouTube playback.
  - Always-listening system-wide wake word.
  - YouTube download/audio extraction.
  - Podcast/Obsidian/Notion support in MVP1.
- Success signals:
  - User understands the primary save action within one second.
  - User can save a moment from the player screen without reading instructions.
  - User can tell why a note exists when reopening it later.
  - Source/time/evidence are visible enough to trust the note.

## Personas and jobs

- Primary personas:
  - Commuter learner.
  - Exercise/walking listener.
  - Founder/operator collecting product ideas.
  - Creator collecting content references.
- User jobs:
  - Save the part I just heard without typing.
  - Add why it mattered in my own voice.
  - Reopen a note later and remember the context.
  - Turn a saved moment into an idea, research note, or content draft.
- Key contexts of use:
  - Walking.
  - Subway/bus.
  - Gym.
  - Desk review after moving-context save.

## Information architecture

- Primary navigation:
  - `홈`
  - `듣기`
  - `노트`
  - `설정` can be reached from profile/settings controls, not necessarily a persistent bottom tab in MVP1.
- Product-facing language:
  - Use `방금 저장`, `이 부분 저장`, `듣던 부분 저장`, `내 생각 말하기`, `노트로 정리됨`.
  - Avoid `캡처` in primary user-facing CTAs.
  - For MVP1 voice-first mode, show `듣는 중` / `말로 저장 대기 중` rather than technical capture labels.
  - Technical docs may still use capture/session internally.
- Core screens:
  1. `Welcome`
  2. `Login`
  3. `Permission Setup`
  4. `Home`
  5. `Import Video`
  6. `Source Processing`
  7. `Listen / Save`
  8. `Voice Memo`
  9. `Note Processing`
  10. `Note Detail`
  11. `Research`
  12. `Library / Search`
  13. `Settings`
- Button destination map:
  - `Apple로 계속하기` / `Google로 계속하기` -> authenticated `Home`.
  - `마이크 허용` -> OS permission sheet -> `Permission Setup` success state.
  - `영상 가져오기` -> `Import Video`.
  - `가져오기` -> `Source Processing`.
  - `지금 듣기` -> `Listen / Save`.
  - `Note AI야 방금 저장...` spoken on `Listen / Save` -> create exact timestamp save -> preserve spoken memo -> `Note Processing`.
  - `지금 저장` / `이 부분 저장` -> fallback exact timestamp save -> `Voice Memo`.
  - `말 끝났어요` -> `Note Processing`.
  - `메모 없이 저장` -> `Note Processing` with memo-empty state.
  - `관련 자료 찾기` -> `Research`.
  - `자료 더 찾기` -> research loading/result state.
  - Bottom `홈` -> `Home`.
  - Bottom `듣기` -> most recent active source, else `Import Video`.
  - Bottom `노트` -> `Library / Search` or latest note list.
- Content hierarchy:
  - Source identity first on listening screens.
  - Save action second.
  - User thought third.
  - AI-generated note fourth.
  - Research expansions last.

## Screen contracts

### S01 Welcome / Login

- Purpose:
  - Explain the product in one sentence and authenticate.
- Required content:
  - Product name placeholder: `Note AI`.
  - Headline: `듣던 부분을 바로 내 노트로`.
  - One sentence explaining YouTube moment save + voice thought.
  - Login buttons: Apple, Google.
- Design:
  - Neo Brutalism hero card using Block Lime.
  - No long carousel in MVP1.

### S02 Permission Setup

- Purpose:
  - Ask for microphone permission with a clear reason.
- Required content:
  - Microphone reason: `이 부분 저장` and voice memo.
  - Notification reason: note/research ready alerts.
  - Skip path for notification.
- States:
  - Mic not requested.
  - Mic allowed.
  - Mic denied with settings CTA.

### S03 Home

- Purpose:
  - Start a new source or resume a recent one.
- Required content:
  - Primary block: `새 영상 가져오기`.
  - Recent sources.
  - Recent notes.
  - Processing badges for transcript/note states.
- Empty state:
  - Show one large `영상 가져오기` card and one sentence: `YouTube 링크를 넣으면 듣던 부분을 저장할 수 있어요.`

### S04 Import Video

- Purpose:
  - Register YouTube URL.
- Required content:
  - URL input.
  - `가져오기` CTA.
  - Share-sheet hint.
  - Invalid URL error.
- States:
  - Empty input.
  - Validating.
  - Invalid URL.
  - Duplicate source.
  - Metadata fetch failed.

### S05 Source Processing

- Purpose:
  - Show metadata/transcript readiness.
- Required content:
  - Thumbnail/title/channel/duration.
  - Transcript status.
  - `지금 듣기` CTA.
  - Explain that notes can improve once transcript is ready.
- States:
  - Metadata loading.
  - Transcript processing.
  - Transcript unavailable.
  - Ready.

### S06 Listen / Save

- Purpose:
  - MVP1's main exact-save and voice command screen.
- Required content:
  - Visible official YouTube player.
  - Source title.
  - Current playback time.
  - Exact save state: `정확 저장`.
  - Primary state panel: `말로 저장 대기 중`.
  - Recognized command preview.
  - Supported examples:
    - `Note AI야 방금 저장해줘. 이건 온보딩 아이디어로 정리해줘.`
    - `노트 에이야 이 부분 저장. 나중에 관련 자료도 찾아줘.`
  - Fallback CTA: `이 부분 저장`.
  - Optional preview of latest memo/thought.
- Rules:
  - Player must remain visible.
  - Do not hide player.
  - Do not imply background playback.
  - Voice state must be visually dominant.
  - Save fallback button must be thumb-friendly and visually available.
  - Avoid implying that the app listens outside this screen.
- States:
  - Player loading.
  - Player ready.
  - Voice mode off.
  - Permission needed.
  - Listening for command.
  - Recognized but ignored.
  - Saving from voice command.
  - Voice save success.
  - Voice recognition failed.
  - Fallback save disabled until player time is known.
  - Fallback save active.

### S07 Voice Memo

- Purpose:
  - Let user add intent after saving a timestamp.
- Required content:
  - Saved exact timestamp.
  - Recording timer.
  - Live transcript or interim text when available.
  - `말 끝났어요` CTA.
  - `메모 없이 저장` fallback.
  - Voice-first mode may skip this screen when the command already contains a memo.
- States:
  - Recording.
  - Paused.
  - Transcribing.
  - Permission denied.
  - Empty memo fallback.

### S08 Note Processing

- Purpose:
  - Make async AI work understandable.
- Required content:
  - Step list:
    - `구간 찾기`
    - `내 생각 반영`
    - `노트 만들기`
    - `자료 키워드 만들기`
  - Progress indication.
  - Retry if failed.
- States:
  - Segment selecting.
  - Speech-to-text running.
  - Note generating.
  - Research keywords generating.
  - Failed with retry.

### S09 Note Detail

- Purpose:
  - The core output screen.
- Required sections:
  - Note title.
  - Source video info.
  - Saved timestamp.
  - User memo.
  - Core summary.
  - My application idea.
  - Transcript evidence.
  - Search keywords.
  - `관련 자료 찾기` CTA.
- Rules:
  - Evidence is not hidden in metadata.
  - User memo must be visibly preserved.
  - Generated text must be Korean by default.

### S10 Research

- Purpose:
  - Show recommended keywords/materials and optional research results.
- Required content:
  - Recommended keywords.
  - Source-backed results.
  - URL per result.
  - Short reason why the result is relevant.
  - `자료 더 찾기` CTA.
- States:
  - Suggested only.
  - Research running.
  - Results ready.
  - No good results.
  - Search failed.

### S11 Library / Search

- Purpose:
  - Re-find saved moments without manual organization.
- Required content:
  - Search input.
  - Recent notes.
  - Source groups.
  - Intent labels: summary, idea, research, draft.
  - Status badges: note ready, research ready, processing.
- Rules:
  - Do not require tags/folders in MVP1.
  - Auto-group by source, date, and keywords.

### S12 Settings

- Purpose:
  - Account, permissions, data, and policy-safe playback explanation.
- Required content:
  - Account info.
  - Microphone permission state.
  - Notification permission state.
  - Trigger/save phrase display.
  - Data/audio storage settings.
  - YouTube policy note: player remains visible, no download/background playback.

## Design principles

- Principle 1: Save the moment, not the whole video.
- Principle 2: One screen, one dominant action.
- Principle 3: Source evidence is part of the note.
- Principle 4: The user's thought is first-class content.
- Principle 5: Neo Brutalism is functional, not decorative.
- Tradeoffs:
  - Bold visual identity is allowed, but note readability wins over style.
  - Large CTAs are preferred over dense controls while moving.
  - Research can be rich, but it should not crowd the save flow.

## Visual language

- Color:
  - `ink`: `#111111`
  - `paper`: `#f8f6ec`
  - `cream`: `#fffdf4`
  - `blockLime`: `#dceeb1`
  - `limeStrong`: `#c8e86d`
  - `green`: `#3d7550`
  - `blueAccent`: `#9cc8ff`
  - `pinkAccent`: `#f4b5c4`
  - `amberAccent`: `#f3c84e`
  - `violetAccent`: `#cbc2ff`
- Color rules:
  - Block Lime is for primary action, active nav, exact-save status, and the most important note block.
  - Do not use Block Lime as a full-screen background wash.
  - Red is reserved only for recording danger/error states.
- Typography:
  - Korean-first; use Pretendard or system sans if available.
  - Heavy display weight for headings.
  - Body text must remain calm and readable.
  - No negative letter spacing.
- Size guidance:
  - Mobile page title: 28-36px depending on screen.
  - Section/card title: 18-22px.
  - Body: 15-17px.
  - Captions/status: 12-13px.
- Spacing/layout rhythm:
  - Use an 8px base grid.
  - Screen padding: 16-20px.
  - Card padding: 12-18px.
  - Gap between functional blocks: 12-16px.
  - Keep bottom primary controls thumb reachable.
- Shape/radius/elevation:
  - Cards/buttons: radius 0-8px.
  - App phone mockup/shell and bottom pill nav may use larger radius.
  - Border: 2-4px solid `#111111`.
  - Shadow: hard offset black shadow, no blur.
  - Standard card shadow token: `4px 4px 0 #111111`.
  - Hero card shadow token: `7px 7px 0 #111111`.
- Motion:
  - Keep motion sparse.
  - Recording can pulse, but respect reduced motion.
  - Processing can use step progression, not flashy loading.
- Imagery/iconography:
  - Use real YouTube thumbnails when available.
  - Icons should be simple, filled or outline, high contrast.
  - Do not use decorative blobs/orbs.

## Components

- New components:
  - `BrutalScreen`
  - `BrutalCard`
  - `BrutalButton`
  - `BrutalInput`
  - `BottomNav`
  - `SourceCard`
  - `YouTubePlayerFrame`
  - `SaveMomentPanel`
  - `VoiceMemoPanel`
  - `ProcessingSteps`
  - `NoteSection`
  - `TranscriptEvidenceBlock`
  - `KeywordChips`
  - `ResearchResultCard`
  - `PermissionCard`
  - `StatusBadge`
- Variants and states:
  - Button: primary, secondary, destructive, disabled, loading.
  - Card: default, lime, blue, pink, amber, violet, error.
  - Source: ready, processing, transcript unavailable, failed.
  - Save: disabled, ready, voice-listening, voice-recognized, voice-ignored, saving, saved.
  - Memo: idle, recording, transcribing, failed.
  - Note: generating, ready, failed.
  - Research: suggested, running, ready, failed, empty.
- Token/component ownership:
  - Define tokens in the mobile app theme layer once scaffolded.
  - Use one shared border/shadow system; do not hand-style each screen.

## Accessibility

- Target standard:
  - Practical WCAG AA where applicable.
- Touch targets:
  - Minimum 44px height/width for buttons and nav items.
- Contrast/readability:
  - Black text on cream/lime is the default.
  - Never put muted text on low-contrast pastel without checking.
  - Player/save screen must be readable outdoors.
- Screen-reader semantics:
  - Announce save state.
  - Announce recording state.
  - Announce note generation progress.
  - YouTube player controls should not be obscured.
- Reduced motion:
  - Recording pulse and processing animation must respect reduced motion.
- Error communication:
  - Color alone is not sufficient; use text labels and retry actions.

## Responsive behavior

- Supported devices:
  - Mobile phone first.
  - iOS smoke path first, Android compatibility maintained.
  - Tablet later.
- Layout adaptations:
  - Small phones:
    - Keep video/player visible.
    - Collapse secondary cards.
    - Keep primary save button near bottom.
  - Larger phones:
    - Show transcript preview or latest memo below save panel.
  - Tablet:
    - Later: player and note can become two-column.
- Touch/hover:
  - No hover-dependent controls.
  - Keep all interactions tap-first.

## Interaction states

- Loading:
  - App/session loading.
  - Auth loading.
  - Source metadata loading.
  - Transcript processing.
  - Note generating.
  - Research running.
- Empty:
  - No sources.
  - No saved moments.
  - No research results.
  - Transcript unavailable.
- Error:
  - Login failed.
  - Invalid URL.
  - Mic permission denied.
  - Player unavailable.
  - Current time unavailable.
  - Transcript unavailable.
  - Speech-to-text failed.
  - AI generation failed.
  - Research failed.
  - Network offline.
- Success:
  - Source imported.
  - Moment saved.
  - Voice memo saved.
  - Note ready.
  - Research attached.
- Disabled:
  - Save disabled until source/player/current time ready.
  - Research disabled until note ready.
- Offline/slow network:
  - Preserve local memo if possible.
  - Queue note generation/research for retry.

## Content voice

- Tone:
  - Direct, short, Korean-first, action-oriented.
  - Confident but not magical.
- Preferred terms:
  - `이 부분 저장`
  - `방금 저장`
  - `듣던 부분`
  - `내 생각 말하기`
  - `노트로 정리됨`
  - `정확 저장`
  - `추정 구간`
  - `근거 구간`
  - `관련 자료`
- Avoid in primary UI:
  - `캡처`
  - `AI가 마법처럼`
  - `요약툴`
  - `YouTube 앱에서 현재 위치를 읽었습니다`
- Microcopy rules:
  - Exact app-player mode: use `정확 저장`.
  - YouTube-app linked mode later: use `추정 구간` and confidence.
  - Explain mic permissions plainly.
  - Preserve user memo text visibly.

## Implementation constraints

- Framework/styling system:
  - React Native + Expo Dev Client assumed.
- Design-token constraints:
  - Implement a shared token file for color, border, radius, spacing, typography, shadow.
  - Do not scatter raw Neo Brutalist border/shadow values across screens.
- Performance constraints:
  - Player screen must stay responsive while note generation runs.
  - Note generation/research can be async.
- Compatibility constraints:
  - Embedded YouTube player must remain visible.
  - No hidden/background YouTube playback.
  - No audio-only extraction/download.
- Test/screenshot expectations:
  - Screenshot/smoke each core screen:
    - Welcome/Login.
    - Home.
    - Import Video.
    - Source Processing.
    - Listen / Save.
    - Voice Memo.
    - Note Processing.
    - Note Detail.
    - Research.
    - Library/Search.
    - Settings.
  - Verify text does not overflow on small phone widths.
  - Verify button labels fit Korean text.
  - Verify disabled/error states are visually distinct.

## Open questions

- [ ] Final product name / owner: product / impact: brand and trigger phrase. Default for MVP1: `Note AI`.
- [ ] Exact auth providers / owner: engineering / impact: login screen implementation. Default for MVP1: Apple + Google.
- [ ] Audio retention policy / owner: product/legal / impact: Settings copy and storage. Default for MVP1: clearly show whether original audio is saved.
- [ ] Production transcript provider / owner: engineering/legal / impact: Source Processing and transcript unavailable state. Default for MVP1: provider abstraction with fixture/test transcript first.
- [ ] Figma import / owner: design / impact: external design artifact. Current blocker: Figma Starter MCP limit; local HTML board is active reference.
