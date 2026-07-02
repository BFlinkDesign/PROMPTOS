# 03 — ELITE TEAM ORCHESTRATION · LOCKED

> **STATUS: LOCKED.** Agents may quote and obey this module and flag conflicts with it.
> Agents may never edit it in place. Amendments ship as human-reviewed PRs only.
> **Changelog:** v1 (2026-07) — distilled from a 14-agent sprint (9 file-scoped owners,
> 2 researchers, 3 adversarial gates, orchestrator fix-pass).

## Placeholders

| Placeholder | Meaning |
|---|---|
| `{{ORCHESTRATOR_MODEL}}` | Frontier model that plans, integrates, and fixes (e.g. the strongest tier available) |
| `{{WORKER_MODEL}}` | Cheaper tier for scoped execution (e.g. a mid-tier model at medium effort) |
| `{{FILE_MAP}}` | The ownership table: every file exactly one writer per wave |
| `{{GATES}}` | The adversarial checks between waves (from module 01's ladder, rung 5) |

## The invariant

**One writer per file, adversaries who built nothing, and an orchestrator who fixes with its
own hands.** Parallelism without these three produces merge soup, self-graded homework, and
findings that die in a report.

## Rules

1. **Index before you spawn.** The orchestrator (or a scout agent) builds a compact repo index
   first — layout, key modules, conventions, validators — and hands each worker only its slice.
   Mandatory: it prevents N workers independently re-reading the repo and burning N× tokens.
2. **Strict file ownership.** `{{FILE_MAP}}` assigns each file exactly one writer per wave.
   Two agents needing the same file means the split is wrong — re-split, or serialize.
3. **Schema-forced returns.** Workers return structured output (forced schema where the
   harness supports it), never prose the orchestrator must parse by vibe.
4. **Adversarial gates are outsiders.** `{{GATES}}` agents reviewed nothing they wrote and are
   prompted to *refute* the done-claim, not to summarize it. A gate that praises is a wasted
   spawn.
5. **The orchestrator fixes.** Gate findings are fixed by `{{ORCHESTRATOR_MODEL}}` directly in
   a fix-pass — not bounced back to workers (context is gone; re-briefing costs more than
   fixing) and not filed as future work.
6. **Pipeline over barrier.** Stage work per-item wherever stages don't need cross-item
   context; hard barriers only for dedup/merge/early-exit decisions.
7. **Right-size the tier.** Mechanical, well-briefed slices run on `{{WORKER_MODEL}}`;
   judgment calls (design direction, root-cause, gate verdicts) stay on
   `{{ORCHESTRATOR_MODEL}}`. This is how frontier behavior gets injected into cheaper tiers:
   the frontier model writes the brief, the checklist, and the acceptance test; the small
   model executes inside those rails (see the injection notes in modules 00–02, 04).
8. **Budget-aware, failure-tolerant.** Treat spend limits and dead agents as expected: workers
   return null on death, the orchestrator filters and re-plans. A workflow that dies with its
   agents was designed wrong.
9. **No orphaned nodes.** Every spawn ends the wave either merged, cancelled, or explicitly
   handed off. Idle agents, stale worktrees, and finished-but-unread results are hygiene
   defects (module 04).

## Failures this module caught (provenance)

- A discovery workflow died mid-run on a spend limit; per rule 8 the orchestrator pivoted to
  direct execution instead of stalling.
- Gate findings ("390px overflow", "bespoke hex") were fixed same-wave by the orchestrator;
  the earlier pattern of routing them back to workers had doubled the cost of every finding.

## Injection note (lower-tier models)

The worker brief template: *scope (files you own) · inputs (index slice, tokens, dictionaries)
· acceptance test (verbatim) · output schema · the one line from module 00.* A
`{{WORKER_MODEL}}` with that brief outperforms an unbriefed frontier model on scoped work.
