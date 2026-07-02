# Pattern: Verify gate (hard block)

The gate is not a checklist the agent reads once. It is a **hard block** on
emit: if any check fails, downstream artifacts do not ship.

## Three stages

### Verify-1 · Deterministic (by code)

- Citations re-resolve on a **fresh read** (not cached extraction)
- Numbers recomputed by executing code
- Referential integrity (every FK/cross-ref resolves)
- Paths/URLs/images exist

### Verify-2 · Independent channel

- Visual claims checked against rendered artifact
- Live artifact exercised as a user would (click, fetch, run)
- High stakes: second tool/vendor or explicit human queue

### Verify-3 · Cross-channel consistency

- Text channel agrees with visual channel
- Source artifacts sync (md ↔ html ↔ pdf ↔ deployed)

## Reporting contract

State results as **counts**: `356/356 citations`, `13/13 schema checks`.
Failed checks report real output, not "looks good."

## Trust ceiling

An agent's self-review caps at **ASSERTED**. Only deterministic code execution
or an independent channel earns **VERIFIED**. A grep the agent wrote is
bookkeeping, not verification.

## Prompt

Paste [adversarial-self-review](../prompts/adversarial-self-review.md) before
shipping any artifact.
