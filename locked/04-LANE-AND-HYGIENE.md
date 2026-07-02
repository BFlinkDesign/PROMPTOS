# 04 — LANE & HYGIENE · LOCKED

> **STATUS: LOCKED.** Agents may quote and obey this module and flag conflicts with it.
> Agents may never edit it in place. Amendments ship as human-reviewed PRs only.
> **Changelog:** v1 (2026-07) — distilled from the Eagle ERP session's standing lane rule
> and hygiene sweeps.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `{{HOME_REPO}}` | The one repo this session/agent writes to directly |
| `{{FOREIGN_GATE}}` | How foreign-repo work ships: draft PR or issue in *that* repo, or a staged `handoff/` package in `{{HOME_REPO}}` when access is scoped |
| `{{WORK_BRANCH}}` | The designated branch; never push elsewhere without explicit permission |

## The lane rule (verbatim invariant)

All writes stay in the connected repo (`{{HOME_REPO}}`). Anything belonging to a different
repo goes as a **draft PR or issue in that repo's own gate — never a direct commit** — then
work continues in the home lane. Cross-repo *reads* stay fine. Unexpected foreign commits get
noted and left alone.

- If the session cannot reach the foreign repo at all, stage the package under
  `{{HOME_REPO}}/handoff/<repo>/` with ready-to-open PR metadata, and say so plainly.
- A merged PR is finished — never stack new commits on merged history; restart the branch
  from the default branch instead.

## The hygiene sweep (run at every natural pause, and always before ending a session)

1. **Working tree** — nothing uncommitted that represents finished work; temp files
   (scratch scripts, downloaded blobs, `.db` intermediates) deleted or moved to scratchpad.
2. **Branches** — local branches merged or superseded get deleted; remote branches whose PRs
   merged get deleted (retry transient failures; if a delete keeps failing, *record it* as
   an open item rather than silently dropping it).
3. **Worktrees** — no orphaned worktrees; `git worktree prune` after removal.
4. **Agents/nodes** — no running agents whose results nobody will read; stop them. No
   finished agents whose results were never integrated; read them or state why not.
5. **PRs/issues** — every open PR maps to live work; drafts carry an honest description of
   state; stale ones get closed with a note, not abandoned.
6. **The record** — anything skipped, blocked, or deferred is written down where the next
   session will see it (tasklist/doc), not carried in one agent's memory.

## Index-first (token discipline)

Before substantive work in *any* repo, produce or refresh a compact index (layout, key
modules, entry points, validators, conventions) and work from the index. Re-derive it only
when the repo changed. This is mandatory: unindexed sessions re-read the same files
repeatedly and burn context that should have gone to the task.

## Failures this module caught (provenance)

- A foreign-repo write scope denial was handled by staging a handoff package in the home
  repo instead of either violating the lane or dropping the request.
- An orphaned worktree and a leftover 210 MB intermediate `.db` were found and removed in a
  sweep; a remote branch delete that kept failing on a proxy disconnect was recorded as an
  open item per rule 2.

## Injection note (lower-tier models)

Small models should not make lane decisions. Give workers **read-only** access outside their
owned files and have the orchestrator perform all git/PR operations. The sweep runs as an
orchestrator checklist, never delegated.
