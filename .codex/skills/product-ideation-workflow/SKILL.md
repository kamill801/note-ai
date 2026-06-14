---
name: product-ideation-workflow
description: Orchestrate the explicit $product-ideation-workflow / Cal AI-style product ideation workflow for a startup, app, AI service, SaaS, mobile app, web app, or consumer product idea. Use when the user explicitly invokes this skill, says "Cal AI 때처럼", asks for "이 워크플로우 그대로", or asks for one end-to-end workflow that automatically routes from idea clarification through research, PRD, TECHSPEC, PLAN, DESIGN, Product Design/Figma, stack-specific implementation handoff, and verification. Do not trigger this full workflow for standalone PRD, design, Figma, research, or techspec requests unless the user asks to run the whole product-ideation workflow.
---

# Product Ideation Workflow

## Purpose

Run one orchestration workflow for turning a rough product idea into development-ready artifacts.

This skill exists so the user does not need to manually invoke `$deep-interview`, research, techspec, design, Figma/Product Design, implementation, and verification stages one by one. The agent using this skill owns stage selection, loads the right downstream skills, and keeps the workflow moving.

Use Korean by default unless the user asks for English.

## Required References

Before taking workflow action, read these files fully:

- `references/stage-router.md` - canonical phase order, output files, and downstream skill/plugin routing.
- `references/capability-gates.md` - environment/plugin availability checks and fallback behavior.

Do not proceed from this `SKILL.md` alone. The references are part of the skill's required operating contract.

## Core Contract

- Treat this as the top-level product-planning orchestrator.
- Do not merely mention downstream skills or plugins; when a stage reaches them, load the relevant `SKILL.md` and follow it.
- If a requested downstream skill/plugin is unavailable, state the gap briefly, choose the closest available fallback from `references/capability-gates.md`, and continue.
- Keep `PRD`, `TECHSPEC`, and `PLAN` separate. `TECHSPEC` must not contain implementation sequencing; sequencing belongs in `PLAN`.
- Add `DESIGN.md` whenever UI/UX, mobile app flow, visual identity, or product surface decisions matter.
- Use current external research when decisions depend on competitor positioning, pricing, SDK behavior, legal/privacy rules, platform constraints, app-store patterns, or visual references.
- If the user says "바로 작성해줘" or "바로 개발해줘", proceed with labeled assumptions, but still run a compact decision lock before writing or coding.

## Default Flow

1. Run local context preflight.
2. Run deep-interview clarification unless the idea is already execution-ready or the user explicitly asks to skip.
3. Research only when evidence would change product, technical, legal, pricing, or design decisions.
4. Lock differentiation and product decisions.
5. Write or update `docs/PRD.md`.
6. Invoke `$idea-to-techspec` for `docs/TECHSPEC.md`.
7. Write or update `docs/PLAN.md`.
8. Run design workflow and create `DESIGN.md` when user-facing surfaces matter.
9. Hand off to implementation only after the planning artifacts are coherent.

The detailed stage rules live in `references/stage-router.md`; follow that file for the authoritative version.

## Default Invocation

```md
[$product-ideation-workflow] 새 서비스 아이디어를 기획하고 싶어.
아이디어는: ...
Cal AI 때처럼 deep interview로 문제, 타깃, 차별점, MVP, 수익모델, UX 방향을 정교화하고,
필요한 리서치/테크스펙/디자인/플러그인 단계를 알아서 호출해서
PRD.md / TECHSPEC.md / PLAN.md / DESIGN.md까지 만들어줘.
```

## Completion Standard

Do not claim completion until:

- The user intent, non-goals, and decision boundaries are explicit or residual risk is labeled.
- Downstream skills/plugins needed for the current stage were actually loaded and followed.
- PRD, TECHSPEC, PLAN, and DESIGN outputs are separated correctly.
- Current external facts were verified when they materially influenced decisions.
- The final handoff is specific enough for Codex App, Codex CLI, Cursor, Claude Code, or a human developer to continue without rereading the whole chat.
