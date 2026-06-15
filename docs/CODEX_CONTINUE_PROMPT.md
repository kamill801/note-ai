# Codex Prompt: Continue MVP1 Local Device Smoke

You are working in `/Users/dd/Documents/note-ai`.

Continue from the current working tree. Preserve all existing changes; do not reset, checkout, stash, or discard user/agent work.

Start by running:

```bash
git status --short
```

Current implementation state:

- MVP1 backend/mobile vertical slice exists.
- Mobile API calls use `EXPO_PUBLIC_API_BASE_URL` with local fallback.
- `npm run check`, `npm run typecheck`, `npm run policy:check`, and `npm run smoke:dev-client` were passing before this continuation.
- Real STT/search providers are intentionally not configured.
- No paid API keys, real secrets, billing SDKs, analytics activation, production deploys, destructive data/file operations, or git history rewrites are allowed without asking the user first.

Next objective:

Prepare and run the real local device/simulator smoke for the MVP1 flow:

1. Start backend and Expo Dev Client using direct local development mode, not tmux.
2. Verify the backend URL that the mobile runtime can reach.
3. If same-machine simulator works, use `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`.
4. If Android emulator or physical device is used, guide the reachable URL via `EXPO_PUBLIC_API_BASE_URL` without hardcoding source changes.
5. Smoke the mobile flow: `링크 등록` -> `MVP1 테스트 영상으로 시작` -> visible YouTube player -> `이 부분 저장` -> `내 생각` memo -> Korean note -> related research.
6. Record evidence and remaining gaps in `docs/SESSION_LOG.md`.

Autonomy:

- Continue through safe local npm install/test/typecheck/build/check scripts, localhost dev servers, and non-destructive workspace edits without asking.
- Use `apply_patch` for manual file edits. Do not use Python heredocs to edit files.
- Ask only for real secrets/API keys, paid provider activation, production deploys, destructive operations, or product scope changes beyond MVP1.
