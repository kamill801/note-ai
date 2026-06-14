# note-ai

Mobile-first YouTube knowledge capture app.

## Product

사용자가 이동 중 YouTube를 보거나 들을 때 중요한 순간을 말로 저장하고, 자기 생각까지 음성 메모로 남기면 AI가 해당 구간을 한국어 노트와 추가 리서치로 정리해주는 앱입니다.

## Current MVP Direction

MVP1 is **앱 내 재생 기반 정확 저장**:

1. YouTube 링크를 앱에 등록합니다.
2. 앱 안의 공식 YouTube 플레이어로 재생합니다.
3. 캡처 모드를 켭니다.
4. "방금 저장" 같은 앱 내부 트리거 또는 수동 버튼으로 현재 timestamp를 저장합니다.
5. 추가 음성 메모를 녹음합니다.
6. AI가 timestamp 주변 transcript와 사용자 메모를 합쳐 한국어 노트를 생성합니다.
7. 필요하면 추가 리서치를 실행합니다.

MVP2 is **YouTube 앱 연동형 추정 저장**:

- 사용자는 공식 YouTube 앱에서 듣고, 앱은 최근 등록 영상 + 음성 메모 + transcript로 가장 그럴듯한 구간을 추정합니다.

## Planning Docs

- [PRD](docs/PRD.md)
- [TECHSPEC](docs/TECHSPEC.md)
- [PLAN](docs/PLAN.md)
- [DESIGN](DESIGN.md)
- [RESEARCH](docs/RESEARCH.md)
- [OMX Workflow](docs/OMX_WORKFLOW.md)
- [Codex MVP1 Prompt](docs/CODEX_MVP1_PROMPT.md)
- [Development Setup](docs/DEVELOPMENT.md)

## Start With OMX

```bash
cd /Users/dd/Documents/note-ai
omx --direct
```

For a direct MVP1 implementation start:

```bash
cd /Users/dd/Documents/note-ai
omx exec -C /Users/dd/Documents/note-ai --sandbox workspace-write "$(cat docs/CODEX_MVP1_PROMPT.md)"
```

Plain Codex CLI remains a fallback, but the preferred development entry point is OMX.

## Scope Guard

Do not build hidden/background YouTube playback, YouTube download/audio extraction, system-wide always-listening wake word, podcast support, or Notion/Obsidian integration in MVP1.
