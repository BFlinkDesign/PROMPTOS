# Field hardening pass (test against messy real data)

Use when: a pipeline "works on the demo" but must survive production corpora.

---

> Harden [SYSTEM NAME] against real-world messy inputs.
>
> 1. Find [3] production-like corpora (not clean samples): mixed filenames,
>    portal downloads, malformed PDFs, huge files, missing indexes, stale dirs.
> 2. Run the full pipeline on each. Record: runtime, files processed, files
>    skip-ledgered, files timeout-ledgered, gate pass/fail counts.
> 3. For every hang/crash/silent wrong output:
>    - root cause (specific file + specific operation)
>    - fix (bounded: timeout, prune, skip ledger, schema check)
>    - one line in agent/ERRORS.md
> 4. Re-run the failing corpus after fix; prove the fix with before/after counts.
> 5. Append quiet risks to agent/GAPS.md (unbounded retention, single-trade
>    assumption, in-memory state loss, etc.).
>
> Bound every diagnostic loop: max [30] min wall clock per corpus, then report
> partial with what blocked. Never infinite retry on one pathological file.
