# Development Setup

Last updated: 2026-06-14

## Local Tooling Confirmed

- OMX path: `/Users/dd/.npm-global/bin/omx`
- OMX version observed: `oh-my-codex v0.18.11`
- OMX setup scope: `project`
- Project Codex home: `/Users/dd/Documents/note-ai/.codex`
- tmux path: `/opt/homebrew/bin/tmux`
- tmux version observed: `tmux 3.6b`
- Codex CLI path: `/usr/local/bin/codex`
- Codex CLI version observed: `codex-cli 0.125.0`
- Workspace: `/Users/dd/Documents/note-ai`

## VSCode Workflow

Open the workspace:

```bash
cd /Users/dd/Documents/note-ai
code .
```

Use VSCode Command Palette:

```txt
Tasks: Run Task
```

Available tasks:

- `OMX: Direct Workspace (Autonomous Local Dev)`
- `OMX: Direct Continue MVP1 (No Tmux)`
- `OMX: Tmux Workspace (Optional, Copy-Unfriendly)`
- `OMX: Start MVP1 Exec`
- `OMX: Resume`
- `OMX: Status`
- `OMX: Doctor`
- `Codex: Interactive Workspace`
- `Codex: Full Local Dev (No Approval Prompts)`
- `Codex: Start MVP1 Implementation (Full Local Dev)`
- `Codex: Resume Last Session`
- `Project: Git Status`

## OMX Workflow

Prefer direct mode inside VS Code. It preserves normal terminal copy/select behavior better than tmux:

```bash
omx --direct --yolo
```

Continue the current MVP1 work without copying a long prompt:

```bash
omx --direct --yolo "$(cat docs/CODEX_CONTINUE_PROMPT.md)"
```

Interactive OMX session:

```bash
omx --direct --yolo
```

Tmux-backed OMX session:

```bash
omx --tmux --yolo
```

Start directly with the MVP1 prompt:

```bash
omx exec -C /Users/dd/Documents/note-ai --sandbox workspace-write "$(cat docs/CODEX_MVP1_PROMPT.md)"
```

Resume through OMX:

```bash
omx resume
```

Health/status checks:

```bash
omx status
omx doctor
```

Do not use `omx explore`; it is deprecated in this workspace guidance.

## Codex CLI Fallback

Interactive Codex session:

```bash
codex -C /Users/dd/Documents/note-ai --sandbox workspace-write --ask-for-approval never
```

Full local development session when localhost binding, dev servers, or DB TCP checks need to run without repeated permission prompts:

```bash
codex -C /Users/dd/Documents/note-ai --sandbox danger-full-access --ask-for-approval on-request
```

Start directly with the MVP1 prompt:

```bash
codex -C /Users/dd/Documents/note-ai --sandbox danger-full-access --ask-for-approval on-request "$(cat docs/CODEX_MVP1_PROMPT.md)"
```

Resume the most recent Codex session:

```bash
codex -C /Users/dd/Documents/note-ai resume --last
```

## First Implementation Target

Build MVP1 only:

```txt
YouTube URL registration
-> visible in-app YouTube player
-> current timestamp capture
-> foreground capture mode
-> voice memo recording/transcription
-> timestamp transcript segment selection
-> Korean note generation
-> follow-up keyword/material recommendation
-> optional research job
```

## Required Reading Before Coding

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/TECHSPEC.md`
4. `docs/PLAN.md`
5. `DESIGN.md`
6. `docs/RESEARCH.md`

## Environment Variables

Copy `.env.example` to your local environment file when implementation starts:

```bash
cp .env.example .env.local
```

Never commit real secrets.

Mobile API calls are configured through Expo's public environment variable:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Use `localhost` for iOS Simulator / same-machine smoke. For Android emulator or a physical device, set this to a backend URL reachable from that runtime, for example `http://10.0.2.2:3000` on the Android emulator or `http://<your-mac-lan-ip>:3000` on a device.

## Verification Expectations

For each milestone, Codex should report:

- files changed
- commands run
- test/smoke evidence
- unresolved risks
- next milestone

Do not claim MVP1 completion unless the full capture-to-note path works.

## Local Approval Policy

This repo is intended to run with low interruption during local MVP development.

Codex/OMX should continue without asking for:

- local npm install/test/typecheck/build/check scripts
- localhost dev servers and smoke tests
- DB connectivity checks against local development databases
- non-destructive edits inside `/Users/dd/Documents/note-ai`

Codex/OMX must ask first for:

- real API keys, secrets, tokens, or credentials
- paid API/provider activation, billing SDKs, payment integrations, or production monitoring/analytics activation
- production deploys or external account changes
- destructive file/data operations or git history rewrites
- product scope changes beyond the approved MVP1 plan


## Local PostgreSQL

Milestone 0 includes a Docker Compose development database using `pgvector/pgvector:pg16`:

```bash
docker compose up -d postgres
npm run db:check
```

Current execution environment note: Docker and `psql` were not installed in the active Codex runtime, so live DB connection was not verified here. The migration schema is validated by `npm run check`; run the commands above on a machine with Docker to verify the live PostgreSQL endpoint.

## Mobile MVP1 Local API Flow

For the current Expo Dev Client MVP1 vertical slice, run the backend before using the mobile screens:

```bash
npm run dev:backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run dev:mobile
```

The mobile API client reads `EXPO_PUBLIC_API_BASE_URL` and falls back to `http://localhost:3000`, matching the backend default for same-machine development. The `MVP1 테스트 영상으로 시작` button registers the sample YouTube video and imports a manual Korean transcript fixture so the capture-to-note path can be tested without paid APIs or real provider credentials.

Current local backend state is process-local in memory. Restarting the backend clears registered sources, captures, notes, and research jobs until the PostgreSQL persistence layer is wired into the services.

On Android emulator or a physical device, do not edit source code for the API host. Start Expo with a reachable public env value instead:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000 npm run dev:mobile
EXPO_PUBLIC_API_BASE_URL=http://<your-mac-lan-ip>:3000 npm run dev:mobile
```

## Backend + Expo Dev Client Smoke

Use this non-secret local smoke to start the real backend dev server and Expo Dev Client Metro, verify `/health`, and verify Metro's `/status` endpoint:

```bash
npm run smoke:dev-client
```

Optional overrides:

```bash
BACKEND_PORT=3000 EXPO_PORT=8081 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 npm run smoke:dev-client
```

Manual Dev Client screen smoke after the command passes:

1. Open an installed Note AI Expo Dev Client build in iOS Simulator or Android emulator.
2. Connect to the displayed `noteai://` / `exp+noteai://` development URL.
3. Tap `가져오기` -> `MVP1 테스트 영상으로 시작`.
4. Confirm the visible YouTube player appears, `듣기` is active, and `이 부분 저장` creates a timestamp capture.
5. Add a memo on the capture screen, generate the Korean note, and confirm the `노트` tab shows the saved note, preserved memo, transcript evidence, and follow-up research.

This smoke uses only local development servers and fixture/manual transcript data. It does not use paid APIs, real secrets, analytics SDKs, production deploys, or YouTube download/background playback behavior.
