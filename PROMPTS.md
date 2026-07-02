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
| 6 | Model routing (which agent, what effort, when) | [prompts/model-routing.md](prompts/model-routing.md) |
| 7 | Planner–executor (frontier plans/gates, workhorse builds) | [prompts/planner-executor.md](prompts/planner-executor.md) |
| 8 | Repo index first (token discipline) | [prompts/repo-index-first.md](prompts/repo-index-first.md) |

## Locked modules

`locked/00`–`04` are behavioral invariants, not fill-in blocks: ground truth,
verify ladder, design-direction-first (extended), team orchestration, lane & hygiene.
Mount per the matrix in `locked/README.md`; agents obey them but never edit them.
Amendments are human-reviewed PRs only.

## Console

Browse and copy prompts in the browser: open [console/promptos-console.html](console/promptos-console.html).

## Used by

- [agent-kit](https://github.com/BFlinkDesign/agent-kit) — `AGENTS.md` §5 references the scope pipeline block
- Per-repo installs get a thin pointer at `agent/PROMPTS.md` (not a copy)
