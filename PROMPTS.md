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
| 6 | Adversarial safety red-team (shields, filters, validators) | [prompts/adversarial-safety-red-team.md](prompts/adversarial-safety-red-team.md) |
| 7 | Session kickoff — align to the delivery systems | [prompts/session-alignment.md](prompts/session-alignment.md) |
| 8 | Adaptive product design (risk-routed repository execution) | [prompts/adaptive-product-design.md](prompts/adaptive-product-design.md) |

## Console

Browse and copy prompts in the browser: open [console/promptos-console.html](console/promptos-console.html).

## Used by

- [agent-kit](https://github.com/BFlinkDesign/agent-kit) — `AGENTS.md` references the scope pipeline and adaptive product-design blocks
- Per-repo installs get a thin pointer at `agent/PROMPTS.md` (not a copy)
