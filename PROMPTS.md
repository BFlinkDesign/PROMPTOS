# Reusable prompt blocks

Battle-tested prompt patterns. Fill the [BRACKETS]; everything else stays.
They are model-agnostic — paste into Claude, Codex, Cursor, Gemini, or any
capable LLM.

**Canonical home:** https://github.com/BFlinkDesign/PROMPTOS
**Local install:** clone once to your tools root and point repos at it — never copy per repo.

---

## Catalog

| # | Block | File |
| --- | --- | --- |
| 1 | Scope pipeline (corpus → trust-tiered deliverable) | [prompts/scope-pipeline.md](prompts/scope-pipeline.md) |
| 2 | Decision matrix (high-stakes choice) | [prompts/decision-matrix.md](prompts/decision-matrix.md) |
| 3 | Design direction first (UI work) | [prompts/design-direction-first.md](prompts/design-direction-first.md) |
| 4 | Adversarial self-review (before shipping) | [prompts/adversarial-self-review.md](prompts/adversarial-self-review.md) |
| 5 | Retrospective (project pause) | [prompts/retrospective.md](prompts/retrospective.md) |
| 6 | Model-tier adapter (HOW each tier behaves once routed — pairs with #9) | [prompts/model-tier-adapter.md](prompts/model-tier-adapter.md) |
| 7 | Token-budget navigation (the per-session repo contract — pairs with #10) | [prompts/token-budget-navigation.md](prompts/token-budget-navigation.md) |
| 8 | Cross-agent handoff (session continuity) | [prompts/cross-agent-handoff.md](prompts/cross-agent-handoff.md) |
| 9 | Model router (WHICH tier/effort gets picked — pairs with #6) | [prompts/model-router.md](prompts/model-router.md) |
| 10 | Token economy (cross-session economics — pairs with #7) | [prompts/token-economy.md](prompts/token-economy.md) |
| 11 | Deep procurement (anti-default-bias research sweep) | [prompts/deep-procurement.md](prompts/deep-procurement.md) |
| 12 | Opportunity scout (proactive radar, hype-vs-real scored) | [prompts/opportunity-scout.md](prompts/opportunity-scout.md) |
| 13 | Task cards (executor-proof work units) | [prompts/task-cards.md](prompts/task-cards.md) |
| 14 | Vetting brief (GROUNDED vs ASSUMED before committing) | [prompts/vetting-brief.md](prompts/vetting-brief.md) |
| 15 | Grounded answer (retrieval-locked, citations validated) | [prompts/grounded-answer.md](prompts/grounded-answer.md) |
| 16 | Miss promotion (observation → deterministic rule, gated) | [prompts/miss-promotion.md](prompts/miss-promotion.md) |
| 17 | Safe cutover (flags, interlocks, rehearsed rollback) | [prompts/safe-cutover.md](prompts/safe-cutover.md) |
| 18 | Doctrine distiller (incidents → locked rules, no softening) | [prompts/doctrine-distiller.md](prompts/doctrine-distiller.md) |
| 19 | Planner–executor (frontier plans and gates, workhorse builds) | [prompts/planner-executor.md](prompts/planner-executor.md) |

**Standing input:** [prompts/projects-and-pains.template.md](prompts/projects-and-pains.template.md)
— the one context file the router/scout/procurement blocks read first
(`{{PROJECT_LIST_AND_PAINS}}`). Fill it once; keep the filled copy private.

## Locked modules

`locked/00`–`04` are behavioral invariants, not fill-in blocks: ground truth,
verify ladder, design-direction-first (extended), team orchestration, lane & hygiene.
Mount per the matrix in [locked/README.md](locked/README.md); agents obey them but never edit them.
Amendments are human-reviewed PRs only.

## Behaviors

[behaviors/elite-engineering.md](behaviors/elite-engineering.md) is the parameterized
operating contract — 12 binding rules plus the SEED→PROVE→LOCK→PRUNE lifecycle. Fill
the `{{PARAMETERS}}` once per project: `GATE_COMMAND`, `LIVE_SYSTEM`, `FLAG`, `OWNER`,
`SECRET_CLASSES`, `ASYMMETRY`, `STATE_DOC`. Every behavior in it earned its place by
catching a real failure — false-green screenshots, a comment that lied about what code
did, a merge that nearly deleted teammates' work, a PII guard tripped by the agent's
own docs.

## Architecture patterns & playbooks

Full catalog: **[PATTERNS.md](PATTERNS.md)** — deterministic pipelines, verify gates,
schema contracts, agent memory, session hygiene, pain points, the architecture
playbooks, and the one-page [playbooks/agent-os.md](playbooks/agent-os.md).

Terminology map (plain language → industry terms): [glossary/TERMINOLOGY.md](glossary/TERMINOLOGY.md).

## Efficiency architecture

Tier table, mandatory-indexing rule, and the human-gated self-improvement
loop: [efficiency/MODEL-TIERS.md](efficiency/MODEL-TIERS.md).

## Console

Browse and copy prompts in the browser: open [console/promptos-console.html](console/promptos-console.html).

## Used by

- [agent-kit](https://github.com/BFlinkDesign/agent-kit) — `AGENTS.md` §5 references the scope pipeline block
- Per-repo installs get a thin pointer at `agent/PROMPTS.md` (not a copy)
