# Evals — regression tests for prompt blocks

Receipts (telemetry/) measure blocks **in the field**. Evals measure them
**on the bench**: before an amendment PR merges, the changed block must still
pass its golden cases. This is what keeps "improvements" from quietly breaking
the behavior a block earned its place with.

## Golden case format

One folder per block, `case-NNN.md` per case:

```markdown
# <block-id> / case-NNN — <one line>
## Setup
The task/context handed to the model along with the block (verbatim).
## Must produce (checkable assertions, not vibes)
- [ ] assertion greppable or countable in the output
- [ ] ...
## Must NOT produce
- [ ] the failure mode this block exists to prevent
```

Rules:
- Assertions must be **mechanically checkable** (a string present, a count, a
  structure) — a human skim is a smell.
- Every case encodes a REAL incident where possible (same bar as canary tests).
- A block with zero eval cases can still ship, but its scoreboard verdict is
  capped at USED — write the case when the first loss receipt arrives.

## The referee protocol (who grades)

Consistent with the trust ceiling in [locked/01](../locked/01-VERIFY-LOOP.md):

1. **Deterministic first** — if every assertion is greppable/countable, a
   script grades it. That is the only grade that counts as VERIFIED.
2. **Cross-vendor referee** — for judgment-shaped assertions, a *different
   vendor's* model (e.g. Gemini CLI grading Claude output, or vice versa)
   replays the case with-block vs without-block and grades against the
   checklist. Independent = certifiable.
3. **Same-vendor fresh session** — records an ADVISORY grade only; it can
   never certify (same-model self-grading).

## Amendment gate (evolution, not churn)

An amendment PR to `prompts/<block>.md` must carry:
1. Receipt evidence (cite lines from `telemetry/usage.jsonl`, ideally ≥3 and
   at least one `loss`) — why the change is needed;
2. A version bump in the block header (`v=1.1 → v=1.2`);
3. Green evals for the new version (existing cases + one new case encoding the
   loss that motivated the change).

Champion/challenger: when the change is contentious, keep both versions live —
the old block text moves to `evals/<block>/champion-v<old>.md` for reference,
field receipts carry `v=`, and the scoreboard's per-version record decides.
Loser is pruned by that evidence, never by fashion.
