# OMX Workflow

Last updated: 2026-06-14

This workspace is intended to be driven with OMX first, then plain Codex CLI only as a fallback.

## Confirmed Local Tools

- OMX path: `/Users/dd/.npm-global/bin/omx`
- OMX version observed: `oh-my-codex v0.18.11`
- OMX setup scope: `project`
- Project Codex home: `/Users/dd/Documents/note-ai/.codex`
- tmux path: `/opt/homebrew/bin/tmux`
- tmux version observed: `tmux 3.6b`
- Codex CLI path: `/usr/local/bin/codex`
- Codex CLI version observed: `codex-cli 0.125.0`
- Workspace: `/Users/dd/Documents/note-ai`

## Recommended Entry Points

Start an interactive OMX/Codex session in this repo:

```bash
cd /Users/dd/Documents/note-ai
omx --direct --yolo
```

Start an OMX tmux-backed session when you want the normal OMX terminal runtime:

```bash
cd /Users/dd/Documents/note-ai
omx --tmux --yolo
```

Start MVP1 implementation directly from the prepared handoff prompt:

```bash
cd /Users/dd/Documents/note-ai
omx exec -C /Users/dd/Documents/note-ai --sandbox workspace-write "$(cat docs/CODEX_MVP1_PROMPT.md)"
```

Resume through OMX:

```bash
cd /Users/dd/Documents/note-ai
omx resume
```

## State And Health Checks

Check active OMX modes before assuming a workflow is still running:

```bash
omx status
```

Run doctor when hooks, skills, or agent routing look stale:

```bash
omx doctor
```

If project-local OMX scaffolding ever needs a refresh, prefer a merge-safe setup:

```bash
omx setup --scope project --merge-agents --verbose
```

Current setup verification:

```txt
omx doctor: 15 passed, 1 warning, 0 failed
```

The remaining warning is for the deprecated `omx explore` harness. This project guidance does not use `omx explore`.

## Local Approval Policy

For MVP1 implementation, use `--yolo` OMX sessions so local development can continue without repeated permission prompts for normal reversible work.

Safe to auto-run:

- local npm install/test/typecheck/build/check scripts
- localhost dev servers and smoke tests
- local DB connectivity checks
- non-destructive edits inside this workspace

Still requires user approval:

- real API keys, secrets, credentials, or paid provider activation
- billing/payment SDKs, production analytics/monitoring activation, or production deploys
- destructive file/data operations, git history rewrites, or material scope changes

Avoid chaining verification commands with `&&` or `|| true` when a localhost or DB check is involved. Run them separately so failures are easier to inspect and permission handling stays narrow.

## Workflow Rules

- Use the docs in `AGENTS.md` as the implementation source of truth.
- Use `docs/CODEX_MVP1_PROMPT.md` when starting the first implementation pass.
- Keep MVP1 focused on in-app YouTube playback with exact timestamp capture.
- Do not use `omx explore`; it is deprecated in this project guidance.
- If an OMX mode is stale, inspect `omx status` first and clear state only when it blocks current work.
