# Capability Gates

Use this matrix before invoking downstream tools. If a capability is unavailable, name the gap and use the fallback path.

| Capability | Preferred path | Availability check | Fallback |
| --- | --- | --- | --- |
| Deep interview in attached OMX/tmux | `$deep-interview` with `omx question` | Attached tmux renderer exists | Native one-question text rounds; still preserve requirements and readiness gates |
| OMX team/hud/question | `omx team`, `omx hud`, `omx question` | Current surface is attached tmux OMX CLI | Do not call these from Codex App outside tmux; use normal tool calls, native subagents only when explicitly authorized, and concise status updates |
| Best-practice or SDK research | `$best-practice-research`, official docs, upstream references | Information is current/external or high-risk | If network/tooling is unavailable, mark assumptions and continue only when safe |
| Technical spec writing | `$idea-to-techspec` | Skill is installed and relevant | Write `TECHSPEC.md` directly using the same separation rules and label the fallback |
| Repo design source of truth | `$design` | Product has UI/UX surface | Create or update `DESIGN.md` directly using repo evidence and label assumptions |
| Product Design plugin | `product-design:get-context` -> `product-design:ideate` | Plugin skills/tools are available and visual exploration is requested | Use text design directions and external visual research; do not claim images/prototypes were generated |
| Figma plugin | `figma:figma-use` plus `figma:figma-generate-design` | Figma connector is available and user wants Figma output | Produce `DESIGN.md` and implementation-ready screen descriptions instead |
| Stack-specific implementation | Vercel/OpenAI/GitHub/Browser skills as applicable | Repo stack or requested integration matches a plugin/skill | Use local repo patterns and official docs; state missing plugin/tooling |

## Safety Rules

- Do not claim a plugin, connector, subagent, or skill was used unless it was actually loaded or invoked.
- Do not silently skip a requested visual, Figma, research, or implementation stage. Record whether it was completed, skipped as irrelevant, or blocked/unavailable.
- Do not add dependencies only because a downstream skill exists. Follow the repo's patterns and ask only for destructive, credential-gated, production, or materially scope-changing actions.
- Do not use tmux-only OMX commands from Codex App outside tmux.
- Do not treat research summaries as final current facts unless fresh browsing or official docs were actually checked during the current turn.

## Invocation Discipline

When a stage requires another skill:

1. Load that skill's `SKILL.md` completely.
2. Follow its mandatory prerequisites and tool-use rules.
3. Return to this workflow after the stage completes.
4. Update or create the durable artifact for the stage.

When a stage falls back:

1. State the missing capability briefly.
2. Use the closest safe local alternative.
3. Label any assumptions.
4. Keep the workflow moving unless the missing capability is essential to correctness.
