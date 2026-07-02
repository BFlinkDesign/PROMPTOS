<!-- promptos-block: id=safe-cutover v=1.0 -->
# Meta: safe-cutover runbook generator — legacy (LIVE) → new

For migrating live traffic/processing off a running system without breaking it. The
incident behind the interlock rule: two "brains" (legacy scheduler + new engine) can
silently double-process the same live data unless one PROVABLY yields.

## Prompt
> Generate a cutover runbook for moving **{{traffic}}** from **{{legacy}}** (LIVE) to
> **{{new}}**. Hard requirements:
>
> 1. Every step before the flip is **read-only or dry** — list the exact commands and
>    their expected outputs.
> 2. The flip is **ONE reversible action** (env var / flag: `{{FLAG}}`), owned by
>    {{OWNER}}, confirm-first.
> 3. An **interlock PROVES no double-processing**: the new system checks the legacy
>    heartbeat and REFUSES to run while it's fresh — and the runbook includes a step
>    that demonstrates the refusal firing.
> 4. **Rollback is one line**, loses no data, and is rehearsed in the doc, not implied.
> 5. A **flip-criteria checklist** where every box is a command output, not a feeling.
>
> Structure: prerequisites (one-time) → auth (one-time, interactive) → read-only
> smokes (identity, list, one real object end-to-end) → dry cycle with every guard
> shown firing → THE FLIP → rollback → checklist.

## Standing rules
- Destructive verbs (send/move/delete/write) require `confirm=True` in code and are
  never exposed to convenience CLIs or smoke tools.
- If a proxy system verifies part of the path (e.g. a different auth stack proves the
  tenant works), record EXACTLY which half it proved — a proxy's green is not the
  system's green.
