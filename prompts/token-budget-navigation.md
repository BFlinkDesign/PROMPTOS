<!-- promptos-block: id=token-budget-navigation v=1.1 -->
# Token-budget navigation (mandatory repo indexing)

Use when: any agent session in a repo — this is the anti-token-burn contract.
The single proven lever: agents read a small deterministic INDEX instead of
re-discovering the repo every session. Pair with the model-tier adapter.

---

> Before ANY other action in this repo:
> 1. Read [agent/PROJECT_PROFILE.md] (the generated index). If it is missing
>    or references files that no longer exist, regenerate it with
>    [python agent/bootstrap.py] and read the fresh copy. Do not proceed
>    without an index; do not substitute a full-tree walk for it.
> 2. Read [agent/GAPS.md] (known risks) and the last [10] lines of
>    [agent/ERRORS.md] (recent failure modes). Nothing else preemptively.
>
> The index itself (≤ [150] lines; regenerate only when the tree changed):
> purpose in two sentences; one line per top-level dir; entry points;
> build/test/verify commands verbatim; where ground truth lives; conventions
> that differ from defaults; active branches/PRs; known gaps with links.
> Derive it by listing and skimming — do not read whole files to build it.
> If a fact in the index contradicts the repo, the repo wins — fix the index
> in the same commit. Subagents start from the index too, and are handed only
> their slice.
>
> Navigation budget for this session:
> - Targeted reads only: open a file because the index, a grep hit, or a
>   stack trace names it — never "to look around".
> - Search before read: one focused search (pattern + path filter) replaces
>   opening N candidate files.
> - Never re-derive: if a state/handoff file ([PROGRESS.md / state.json])
>   answers a question, trust it over re-investigation; verify only the
>   load-bearing claim you are about to act on.
> - Large artifacts (logs, corpora, exports): sample head/tail + grep counts;
>   never read whole files into context.
> - Delegation: when a sub-task needs wide reading, hand it a summary
>   contract ("return ≤[20] lines: findings + file:line cites"), not an
>   open-ended exploration.
>
> At session end, append one line each (append-only, never rewrite history):
> - [agent/ERRORS.md]: any failure mode hit, with root cause if known.
> - [agent/GAPS.md]: any risk noticed but not fixed.
> These ledgers are the raw material the self-improvement loop promotes
> into rules — skipping them starves it.
