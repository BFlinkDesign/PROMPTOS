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
| 1 | Session kickoff - align to the delivery systems | [prompts/session-alignment.md](prompts/session-alignment.md) |
| 2 | Repository takeover | [prompts/repository-takeover.md](prompts/repository-takeover.md) |
| 3 | Scope pipeline (corpus → trust-tiered deliverable) | [prompts/scope-pipeline.md](prompts/scope-pipeline.md) |
| 4 | Decision matrix (high-stakes choice) | [prompts/decision-matrix.md](prompts/decision-matrix.md) |
| 5 | Full-stack delivery contract | [prompts/full-stack-delivery-contract.md](prompts/full-stack-delivery-contract.md) |
| 6 | Task plan | [prompts/task-plan.md](prompts/task-plan.md) |
| 7 | Design direction first (UI work) | [prompts/design-direction-first.md](prompts/design-direction-first.md) |
| 8 | Task implement | [prompts/task-implement.md](prompts/task-implement.md) |
| 9 | UI fidelity | [prompts/ui-fidelity.md](prompts/ui-fidelity.md) |
| 10 | Reproduce trace patch | [prompts/reproduce-trace-patch.md](prompts/reproduce-trace-patch.md) |
| 11 | Independent diff review | [prompts/independent-diff-review.md](prompts/independent-diff-review.md) |
| 12 | Adversarial self-review (before shipping) | [prompts/adversarial-self-review.md](prompts/adversarial-self-review.md) |
| 13 | Adversarial safety red-team (shields, filters, validators) | [prompts/adversarial-safety-red-team.md](prompts/adversarial-safety-red-team.md) |
| 14 | Release gate | [prompts/release-gate.md](prompts/release-gate.md) |
| 15 | Retrospective (project pause) | [prompts/retrospective.md](prompts/retrospective.md) |

## Console

Browse and copy prompts in the browser: open [console/promptos-console.html](console/promptos-console.html).

## Used by

- [agent-kit](https://github.com/BFlinkDesign/agent-kit) — `AGENTS.md` §5 references the scope pipeline block
- Per-repo installs get a thin pointer at `agent/PROMPTS.md` (not a copy)
