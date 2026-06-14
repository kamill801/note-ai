# Stage Router

Follow these stages in order. Skip a stage only when the user explicitly requests it, the stage is irrelevant, or a prior artifact already satisfies it.

## 0. Context and Repo Preflight

Before asking user questions, inspect available local context:

- Applicable `AGENTS.md` instructions.
- Existing `README`, `docs/`, `PRD.md`, `TECHSPEC.md`, `PLAN.md`, `DESIGN.md`, ADRs, `.omx/context/`, and `.omx/specs/`.
- Existing app structure, package manifests, routes, components, design tokens, tests, and deployment config when the idea is being added to an existing repo.

Use discovered facts as evidence. Ask the user only for decisions, preferences, or missing business/product judgment.

## 1. Deep Interview Gate

For vague or early-stage ideas, invoke `$deep-interview` as the first real stage.

- Default profile: standard.
- Use quick only when the user asks for a fast pass.
- Use deep when the product is high-risk, multi-sided, regulated, or technically ambiguous.
- Resolve intent, outcome, scope, non-goals, decision boundaries, constraints, and success criteria.
- Complete at least one pressure pass that tests an assumption or tradeoff.
- When feasible, preserve the interview output under `.omx/specs/deep-interview-<slug>.md` and `.omx/interviews/<slug>-<timestamp>.md`.
- If the surface cannot run OMX UI, ask exactly one concise plain-text question per round and continue.

Do not move to final specs while non-goals or decision boundaries are still unclear unless the user explicitly accepts the residual risk.

## 2. Research and Evidence

Run research only when it will change a product, technical, legal, pricing, or design decision.

Use the appropriate surface:

- `$best-practice-research` for bounded official/upstream evidence or framework/API behavior.
- Web research for competitor maps, pricing, app-store positioning, UI patterns, and market references.
- Official docs first for technical SDK/API/framework claims.
- Product/app screenshots, public pages, app listings, or reference products for design/UX pattern analysis.

Research output should capture:

- Competitor map and positioning.
- Feature and pricing comparison when relevant.
- UX flow and visual pattern observations.
- Technical implications.
- Differentiation opportunities.
- Risks, privacy constraints, and platform constraints.

## 3. Differentiation and Decision Lock

Before writing final artifacts, actively search for a real wedge. Do not accept shallow differentiation such as "AI-powered" or "better UX".

Consider wedges such as:

- Less manual work.
- Faster time-to-capture or time-to-result.
- Better personalization or intent awareness.
- Better trust, provenance, or explainability.
- Better local market fit.
- Better habit loop.
- Better professional workflow.
- Better privacy or retention policy.

Then produce a compact decision lock:

- Product name or placeholder.
- Target user.
- Core problem.
- Primary differentiation.
- MVP scope.
- Explicit non-goals.
- Core user flow.
- AI or automation pipeline.
- Data storage and privacy policy.
- Monetization.
- Design direction.
- Tech stack assumption.
- Validation metrics.
- Remaining assumptions.

## 4. PRD

Write or update `docs/PRD.md` after the decision lock.

Include:

- Product goal.
- User personas.
- Problem and opportunity.
- MVP user journeys.
- Feature requirements.
- Monetization and packaging.
- Success metrics.
- Risks and open questions.

Keep it product-facing. Put implementation details in `TECHSPEC`.

## 5. TECHSPEC

For technical specification, invoke `$idea-to-techspec` and follow its rules.

Write or update `docs/TECHSPEC.md`.

The spec must include:

- Product principles.
- System architecture.
- Frontend, backend, AI, database, storage, auth, and integration responsibilities.
- API contracts.
- Data models.
- AI/model-call schemas.
- Safety, privacy, retention, and security rules.
- Error handling and edge cases.
- Evaluation and quality gates.
- Environment variables.
- Acceptance criteria.

For AI products, require a structured AI pipeline:

1. Input ingestion.
2. Preprocessing.
3. Evidence extraction.
4. Intermediate state/profile generation.
5. Reasoning, scoring, summarization, or generation.
6. Output generation.
7. Safety or quality gate.
8. Logging and evaluation.

Do not put milestone order, sprint tasks, or step-by-step implementation sequencing in `TECHSPEC`.

## 6. PLAN

Write or update `docs/PLAN.md` after `TECHSPEC`.

Include:

- Implementation milestones.
- Task checklist.
- Test and verification plan.
- Definition of done.
- Launch/deployment steps.
- Known risks and rollback points.

Order tasks so a coding agent can implement without rereading the whole chat.

## 7. Design

If the product has user-facing surfaces, run a design stage instead of improvising UI.

Use the appropriate route:

- Invoke `$design` to create or refresh durable repo-local `DESIGN.md`.
- If the user wants visual exploration, generated product directions, or Product Design plugin output, use Product Design in this order: `product-design:get-context` -> `product-design:ideate` -> selected direction -> update `DESIGN.md`.
- If the user asks for Figma output, load `figma:figma-use` before any Figma tool call and use `figma:figma-generate-design` for composed screens or views.
- If external visual references, color systems, app-store examples, or competitor UI patterns would materially improve the design, research them before locking the visual direction.
- If generated images or references are produced, stop for selection before coding against a visual target unless the user explicitly asked for autonomous selection.

`DESIGN.md` should capture:

- Brand feel.
- Color and typography.
- Layout principles.
- Component rules.
- Key screens.
- Interaction patterns.
- Motion and feedback.
- Accessibility constraints.
- Figma/Product Design notes when applicable.

Do not make a generic landing page unless the product truly needs one. Prefer the actual app/product experience as the first designed surface.

## 8. Development Handoff

When the user asks to build, implement from the artifacts in this order:

1. Read `docs/PRD.md`, `docs/TECHSPEC.md`, `docs/PLAN.md`, and `DESIGN.md` when present.
2. Select stack-specific skills/plugins from the actual repo and target stack.
   - Next.js/Vercel: use relevant Vercel skills such as `vercel:nextjs`, `vercel:shadcn`, `vercel:ai-sdk`, `vercel:env-vars`, and deployment/storage skills as needed.
   - OpenAI APIs/Agents: use `openai-docs` or OpenAI Developers skills and official docs.
   - GitHub work: use GitHub skills when issues, PRs, CI, or publishing are involved.
   - Browser verification: use Browser for local UI smoke checks and screenshots when a dev server is available.
3. Implement by `PLAN.md` milestone.
4. Keep docs updated if product decisions change during implementation.
5. Verify with focused tests first, then lint/typecheck/build/smoke checks as appropriate.
6. Commit, push, deploy, or open PR only when requested or clearly part of the agreed workflow.

## Output Files

Default durable outputs:

- `.omx/specs/deep-interview-<slug>.md` when deep interview runs.
- `.omx/interviews/<slug>-<timestamp>.md` when deep interview runs.
- `docs/PRD.md`.
- `docs/TECHSPEC.md`.
- `docs/PLAN.md`.
- `DESIGN.md` when UI/UX/design matters.
- Optional `docs/RESEARCH.md` when external research is substantial enough to preserve.
