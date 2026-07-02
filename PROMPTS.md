# Reusable prompt blocks

Battle-tested prompt patterns. Fill the [BRACKETS]; everything else stays.
They are model-agnostic — paste into Claude, Codex, Cursor, Gemini, or any
capable LLM.

**Canonical home:** https://github.com/BFlinkDesign/PROMPTOS  
**Local install:** `C:\Eagle\PROMPTOS`

---

## Catalog

| # | Block | File |
| --- | --- | --- |
| 1 | Scope pipeline (corpus → trust-tiered deliverable) | [prompts/scope-pipeline.md](prompts/scope-pipeline.md) |
| 2 | Decision matrix (high-stakes choice) | [prompts/decision-matrix.md](prompts/decision-matrix.md) |
| 3 | Design direction first (UI work) | [prompts/design-direction-first.md](prompts/design-direction-first.md) |
| 4 | Adversarial self-review (before shipping) | [prompts/adversarial-self-review.md](prompts/adversarial-self-review.md) |
| 5 | Retrospective (project pause) | [prompts/retrospective.md](prompts/retrospective.md) |
| 6 | Model-tier adapter (inject frontier discipline downward) | [prompts/model-tier-adapter.md](prompts/model-tier-adapter.md) |
| 7 | Token-budget navigation (mandatory repo indexing) | [prompts/token-budget-navigation.md](prompts/token-budget-navigation.md) |

## Efficiency architecture

Tier table, mandatory-indexing rule, and the human-gated self-improvement
loop: [efficiency/MODEL-TIERS.md](efficiency/MODEL-TIERS.md).

## Console

Browse and copy prompts in the browser: open [console/promptos-console.html](console/promptos-console.html).

## Used by

- [agent-kit](https://github.com/BFlinkDesign/agent-kit) — `AGENTS.md` §5 references the scope pipeline block
- Per-repo installs get a thin pointer at `agent/PROMPTS.md` (not a copy)
