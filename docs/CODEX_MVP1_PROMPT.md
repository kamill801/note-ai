# Codex Prompt: Build MVP1

You are working in `/Users/dd/Documents/note-ai`.

Read these files first:

- `AGENTS.md`
- `docs/PRD.md`
- `docs/TECHSPEC.md`
- `docs/PLAN.md`
- `DESIGN.md`
- `docs/RESEARCH.md`
- `.omx/specs/deep-interview-mobile-knowledge-capture.md`

Goal:

Build MVP1: 앱 내 재생 기반 정확 저장.

MVP1 flow:

1. User registers a YouTube URL.
2. App plays the video in a visible in-app YouTube player.
3. App can read current playback time from the player bridge.
4. User enables foreground capture mode.
5. User triggers capture with an app-internal voice trigger or manual fallback.
6. App stores the exact timestamp.
7. User records a voice memo.
8. App transcribes the memo.
9. App selects transcript segments around the timestamp.
10. App generates a Korean note with source/timestamp evidence and the user's own thought.
11. App recommends follow-up search keywords/materials.
12. App can run optional follow-up research and attach results to the note.

Start with `docs/PLAN.md` Milestone 0 and Milestone 1. Do not jump ahead unless the earlier milestones are verified.

Hard non-goals:

- Do not build hidden/background YouTube playback.
- Do not download YouTube audio/video.
- Do not extract audio-only streams from YouTube.
- Do not claim access to the official YouTube app's current playback state.
- Do not build system-wide always-listening custom wake word.
- Do not build podcast support.
- Do not build Notion/Obsidian integration.

Development expectations:

- Keep implementation scoped and verifiable.
- Use the repo's docs as source of truth.
- Update docs only when a technical decision materially changes.
- Prefer a small working vertical slice over broad unfinished scaffolding.
- Verify each milestone with concrete commands or smoke checks.

