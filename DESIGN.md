# Design

## Source of truth

- Status: Draft
- Last refreshed: 2026-06-14
- Primary product surfaces:
  - Mobile source library
  - YouTube player/capture screen
  - Voice memo capture state
  - Note detail
  - Research result view
- Evidence reviewed:
  - `docs/PRD.md`
  - `docs/TECHSPEC.md`
  - `docs/RESEARCH.md`
  - `.omx/specs/deep-interview-mobile-knowledge-capture.md`

## Brand

- Personality: focused, reliable, quiet, movement-friendly.
- Trust signals: visible source, timestamp, transcript evidence, confidence when estimated, clear mic state.
- Avoid:
  - marketing-heavy hero UI.
  - pretending estimated segments are exact.
  - decorative complexity that distracts from capture.
  - YouTube replacement positioning.

## Product goals

- Goals:
  - Let users save important YouTube moments while moving.
  - Preserve both source content and the user's own thought.
  - Turn capture into useful Korean notes and follow-up research.
- Non-goals:
  - Full video summary as the main product.
  - Background YouTube playback.
  - Always-listening system-wide wake word.
- Success signals:
  - User can capture in a few seconds.
  - User can understand the note later.
  - User can see source/timestamp evidence.

## Personas and jobs

- Primary personas:
  - Commuter learner.
  - Exercise/walking listener.
  - Founder/operator collecting ideas.
  - Creator collecting content references.
- User jobs:
  - Save a useful moment without typing.
  - Add a personal idea by voice.
  - Review a structured note later.
  - Ask for related research.
- Key contexts of use:
  - Walking.
  - Subway/bus.
  - Gym.
  - Desk review after capture.

## Information architecture

- Primary navigation:
  - Library
  - Player/Capture
  - Notes
  - Settings
- Core routes/screens:
  - Add Source
  - Source Detail
  - Player Capture
  - Capture Processing
  - Note Detail
  - Research Results
- Content hierarchy:
  - Source identity first.
  - Capture status second.
  - Note and evidence third.
  - Research expansions last.

## Design principles

- Principle 1: Capture state must be unmistakable.
- Principle 2: One primary action per moving-context screen.
- Principle 3: Evidence is part of the note, not hidden metadata.
- Tradeoffs:
  - Favor clear controls over dense dashboards on mobile.
  - Favor conservative confidence wording over magical claims.

## Visual language

- Color:
  - Neutral base with one strong capture accent.
  - Use red only for recording/mic danger states.
  - Use green/blue sparingly for completed states.
- Typography:
  - Large readable capture labels.
  - Compact but clear note text.
  - Avoid hero-scale text inside tool surfaces.
- Spacing/layout rhythm:
  - Thumb-friendly bottom actions.
  - Stable player area.
  - Fixed capture control height to avoid layout jump.
- Shape/radius/elevation:
  - Functional cards only for source/note items.
  - 8px radius or less.
  - Minimal elevation.
- Motion:
  - Subtle recording pulse.
  - Clear processing progress.
  - Avoid distracting motion during playback.
- Imagery/iconography:
  - Use recognizable media, mic, bookmark, search, note icons.
  - Show thumbnails for sources.

## Components

- Existing components to reuse:
  - None; greenfield repo.
- New/changed components:
  - Source card.
  - YouTube player view.
  - Capture mode toggle.
  - Voice trigger indicator.
  - Memo recorder.
  - Processing status.
  - Note section block.
  - Transcript evidence list.
  - Research source list.
- Variants and states:
  - Capture off.
  - Capture listening.
  - Trigger detected.
  - Recording memo.
  - Processing.
  - Ready.
  - Error/retry.
- Token/component ownership:
  - Define tokens once mobile framework is scaffolded.

## Accessibility

- Target standard: practical WCAG AA where applicable.
- Keyboard/focus behavior:
  - Later for web/admin surfaces.
  - Mobile controls must have accessible labels.
- Contrast/readability:
  - Text and controls must remain readable outdoors.
- Screen-reader semantics:
  - Capture state and recording state must be announced.
- Reduced motion:
  - Recording pulse should respect reduced motion settings.

## Responsive behavior

- Supported breakpoints/devices:
  - iPhone and Android phone first.
  - Tablet later.
- Layout adaptations:
  - Player fixed top region.
  - Capture controls bottom.
  - Notes scroll below source metadata.
- Touch/hover differences:
  - No hover-dependent controls.
  - Minimum touch target 44px.

## Interaction states

- Loading:
  - Source metadata loading.
  - Transcript processing.
  - Note generation.
  - Research running.
- Empty:
  - No sources.
  - No notes.
  - Transcript unavailable.
- Error:
  - Invalid URL.
  - Mic permission denied.
  - Player unavailable.
  - Transcript unavailable.
  - AI generation failed.
  - Research failed.
- Success:
  - Capture saved.
  - Note ready.
  - Research attached.
- Disabled:
  - Capture disabled until source/player ready.
- Offline/slow network:
  - Allow local memo save if possible.
  - Queue note generation when network returns.

## Content voice

- Tone: calm, clear, action-oriented.
- Terminology:
  - Use "정확 저장" for app player mode.
  - Use "추정 저장" for YouTube app linked mode.
  - Use "근거 구간" for transcript evidence.
- Microcopy rules:
  - Do not say "YouTube 앱에서 현재 위치를 읽었습니다" in estimated mode.
  - Say "추정 구간" when not exact.
  - Explain mic/capture mode plainly.

## Implementation constraints

- Framework/styling system:
  - React Native + Expo Dev Client assumed.
- Design-token constraints:
  - Define after app scaffold.
- Performance constraints:
  - Capture UI must stay responsive during playback.
  - Note generation can be async.
- Compatibility constraints:
  - Embedded YouTube player must remain visible.
  - No hidden/background YouTube playback feature.
- Test/screenshot expectations:
  - Verify player screen, capture states, note detail, error states.

## Open questions

- [ ] Final product name / owner: product / impact: trigger phrase and brand.
- [ ] First visual style reference / owner: design / impact: UI polish.
- [ ] iOS-first vs Android-first launch / owner: engineering / impact: native integration.
- [ ] Transcript provider choice / owner: engineering/legal / impact: production reliability.

