# Docs Index

Last updated: 2026-07-04

This is the source-of-truth map for the MVP1 workflow.

## Required Reading Order

1. [PRD](PRD.md)
2. [TECHSPEC](TECHSPEC.md)
3. [PLAN](PLAN.md)
4. [DESIGN](../DESIGN.md)
5. [Design References](DESIGN_REFERENCES.md)
6. [Design Visuals](DESIGN_VISUALS.md)
7. [Local Design Review Board](design-review.html)
8. [RESEARCH](RESEARCH.md)
9. [OMX Workflow](OMX_WORKFLOW.md)
10. [Codex MVP1 Prompt](CODEX_MVP1_PROMPT.md)

## Workflow Gate

Implementation must not start as a pure coding task.

The intended flow is:

```txt
Product decision lock
-> Design decision lock
-> Technical implementation planning
-> Milestone implementation
-> Verification
```

For this repo, `DESIGN.md` at the project root is the canonical design contract. Keep it at the root because OMX `$design` expects repo-local `DESIGN.md` there.

Before coding UI/frontend/mobile surfaces, the agent must:

- read `DESIGN.md`;
- confirm the MVP1 visual/UX baseline;
- add or resolve design open questions;
- document any assumptions in `DESIGN.md`;
- then proceed through `docs/PLAN.md`.
