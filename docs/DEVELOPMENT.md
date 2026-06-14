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

- `OMX: Direct Workspace`
- `OMX: Tmux Workspace`
- `OMX: Start MVP1 Exec`
- `OMX: Resume`
- `OMX: Status`
- `OMX: Doctor`
- `Codex: Interactive Workspace`
- `Codex: Start MVP1 Implementation`
- `Codex: Resume Last Session`
- `Project: Git Status`

## OMX Workflow

Interactive OMX session:

```bash
omx --direct
```

Tmux-backed OMX session:

```bash
omx --tmux
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
codex -C /Users/dd/Documents/note-ai --sandbox workspace-write --ask-for-approval on-request
```

Start directly with the MVP1 prompt:

```bash
codex -C /Users/dd/Documents/note-ai --sandbox workspace-write --ask-for-approval on-request "$(cat docs/CODEX_MVP1_PROMPT.md)"
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
