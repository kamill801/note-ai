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
- `OMX: Tmux Workspace (Autonomous Local Dev)`
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
npm run dev:mobile
```

The mobile API client currently targets `http://localhost:3000`, matching the backend default. The `MVP1 테스트 영상으로 시작` button registers the sample YouTube video and imports a manual Korean transcript fixture so the capture-to-note path can be tested without paid APIs or real provider credentials.

On Android emulator or a physical device, replace the API base URL in `mobile/src/services/api.ts` with the reachable development host if `localhost` resolves to the device instead of the Mac.
