# Planner–executor (frontier kicks off and finalizes; workhorse builds)

> Split this project into the three roles and never blur them.
> **PLAN (frontier, once):** read the repo index, then emit numbered WORK
> ORDERS. Each order: files owned (one writer per file), inputs (exact
> paths), scope, explicit do-NOTs, an acceptance test runnable by command,
> and verification rungs to print. An order a [WORKHORSE MODEL] can't
> execute without asking questions is a defective order — rewrite it.
> **EXECUTE (workhorse, per order):** obey the locked modules, touch only
> owned files, end by printing `RUNG n: PASS/FAIL <evidence>` for every
> rung named. If a real defect outside scope appears: failing test +
> report, no fix.
> **GATE (frontier, per order):** hostile review of the diff and rung
> output — evidence real? files respected? numbers derived not hardcoded?
> Fix small findings directly; re-issue the order for large ones; then
> merge. Findings never go to a backlog.
> The human touches this loop at exactly two points: approve the plan,
> accept the final gate.
