# Reusable prompt blocks

Battle-tested prompt patterns. Fill the [BRACKETS]; everything else stays.
They are model-agnostic — paste into Claude, Codex, Cursor, Gemini, or any
capable LLM.

**Canonical home:** https://github.com/BFlinkDesign/PROMPTOS  
**Local install:** `C:\Eagle\PROMPTOS`

Sort order: oldest to newest by `created_at` ascending. Legacy entries with unknown timestamps sort before timestamped entries until backfilled.

---

## Catalog

| Created at | Updated at | Block | File |
| --- | --- | --- | --- |
| legacy-unknown | legacy-unknown | Scope pipeline (corpus → trust-tiered deliverable) | [prompts/scope-pipeline.md](prompts/scope-pipeline.md) |
| legacy-unknown | legacy-unknown | Decision matrix (high-stakes choice) | [prompts/decision-matrix.md](prompts/decision-matrix.md) |
| legacy-unknown | legacy-unknown | Design direction first (UI work) | [prompts/design-direction-first.md](prompts/design-direction-first.md) |
| legacy-unknown | legacy-unknown | Adversarial self-review (before shipping) | [prompts/adversarial-self-review.md](prompts/adversarial-self-review.md) |
| legacy-unknown | legacy-unknown | Retrospective (project pause) | [prompts/retrospective.md](prompts/retrospective.md) |
| legacy-unknown | legacy-unknown | Adversarial safety review (shields, filters, validators) | [prompts/adversarial-safety-red-team.md](prompts/adversarial-safety-red-team.md) |
| legacy-unknown | legacy-unknown | Session kickoff — align to the delivery systems | [prompts/session-alignment.md](prompts/session-alignment.md) |
| 2026-07-06T00:38:04-05:00 | 2026-07-06T00:38:04-05:00 | DCC asset pipeline (AI mesh → engine-ready asset) | [prompts/dcc-asset-pipeline.md](prompts/dcc-asset-pipeline.md) |

## Console

Browse and copy prompts in the browser: open [console/promptos-console.html](console/promptos-console.html).

## Used by

- [agent-kit](https://github.com/BFlinkDesign/agent-kit) — `AGENTS.md` §5 references the scope pipeline block
- Per-repo installs get a thin pointer at `agent/PROMPTS.md` (not a copy)