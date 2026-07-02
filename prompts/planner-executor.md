<!-- promptos-block: id=planner-executor v=1.1 -->
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
> The gater fixes findings with its own hands (the executor's context is
> gone; re-briefing costs more than fixing); re-issue an order only when
> the order itself was defective — wrong scope or wrong split. Then merge.
> Findings never go to a backlog.
> The human touches this loop at exactly two points: approve the plan,
> accept the final gate.

Card anatomy for delegation beyond this loop (Why / Effort / Risk + guardrail):
[task-cards](task-cards.md). The fan-out version of this pattern (many executors,
strict file ownership, adversarial gates) is locked as
[locked/03](../locked/03-ELITE-TEAM-ORCHESTRATION.md).
