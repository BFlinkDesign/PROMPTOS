# Usage receipts — how prompt blocks report from the field

Prompt blocks execute inside agent hosts we cannot instrument (Claude Code,
Codex, Cursor, Gemini, any LLM). The only universal runtime is **the repo the
agent is working in, plus the agent's obligation to write files**. So telemetry
rides the artifact: every block carries an id+version header, and using a block
obligates the agent to leave a one-line receipt in the consuming repo.

## The receipt (one line, machine-parseable)

```
PROMPTOS-RECEIPT: block=<id> v=<version> outcome=win|loss|neutral gate="<command/count evidence>" note="<≤120 chars>" repo=<name> date=<YYYY-MM-DD>
```

- `block` / `v` — copy from the `<!-- promptos-block: id=… v=… -->` header of
  the block you used.
- `outcome` — **graded by evidence, not feeling**:
  - `win` = the block's promised effect happened AND the gate line proves it
    (a command that passed, a count, a caught failure).
  - `loss` = the block was followed and the bad outcome it exists to prevent
    happened anyway — or following it caused harm. **Loss receipts are the most
    valuable line you can write**; they are the raw material for amendments.
  - `neutral` = used, no observable effect either way.
- `gate` — a command + its result or a count ("pytest 248 passed",
  "route log audited 7/7", "caught near-clobber before push"). Never "worked
  great".
- `note` — what would make the block better, or empty. No secrets, no PII, no
  customer names — receipts get aggregated into a public scoreboard.

## Where it goes

Append to `agent/RECEIPTS.log` in the repo you are working in (create it if
missing; append-only, never rewrite). If the project keeps ledgers elsewhere,
next to `ERRORS.md` is right.

## Rules

1. One receipt per block actually used per session — not per mention.
2. Write the receipt in the same commit/session as the work; a receipt
   reconstructed later is marked `note="retrospective"`.
3. A session that used a block and left no receipt is itself a miss — flag it
   in the consuming repo's `ERRORS.md`.
4. Self-reporting is known-lossy and gameable. The scoreboard therefore also
   scores **absence**: a block with zero receipts anywhere is UNPROVEN, and
   UNPROVEN + old = DECAYING. Silence is a signal, not a pass.

## The loop this feeds

```
receipts (field)  →  telemetry/harvest.py  →  telemetry/SCOREBOARD.md
     →  losing/decaying blocks flagged  →  amendment PR (challenger version)
     →  both versions carry receipts for a while  →  the record decides
     →  loser pruned (PRUNE by evidence, never by rot)
```

Amendment PRs to a block SHOULD cite receipts (ideally ≥3, at least one loss)
as their rationale — evolution is evidence-gated, the same bar the
doctrine-distiller applies to new rules.
