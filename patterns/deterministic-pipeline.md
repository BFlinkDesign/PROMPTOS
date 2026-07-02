# Pattern: Deterministic gated pipeline

**Domain:** Any job that reads a corpus and produces a scoped, defensible
output (documents, code analysis, compliance review, inventory, RFP response).

**Not for:** Open-ended chat, creative writing, one-shot Q&A.

## Shape

```
INGEST ──> SWEEP ──> EXTRACT ──> RECONCILE ──> VERIFY GATE ──> EMIT
  │          │          │            │              │
 hash      anchors    dual-channel   rules      HARD BLOCK
 dedupe    + FP ctrl  text + vision  + FK       re-resolve all
```

## Layer responsibilities (agnostic)

| Stage | Job | Must produce |
| --- | --- | --- |
| Ingest | Walk inputs, hash, dedupe, classify, ledger skips | Stable file IDs + skip ledger |
| Sweep | Page/section scan for domain anchors + negative controls | Hit list with disposition |
| Extract | Pull mutations, dimensions, prices, constraints | Evidence records with citations |
| Reconcile | Merge authority order, map to output template | Scope items + foreign keys |
| Verify gate | Re-read every citation fresh; recompute every number | Pass/fail counts — no emit on fail |
| Emit | Render human artifact with trust tiers | PDF/HTML/code only if gate passed |

## Authority order (default)

Latest override > spatial source (drawing/photo) > base spec > vendor quote.
Encode explicitly per domain in a config file, never in agent prose.

## Why this beats "smart document parsing"

Neural extraction is fast but silently wrong. The pipeline makes wrongness
**visible and blocking**: every claim has a resolvable anchor or an explicit
UNTRUSTED tier. Speed comes from deterministic sweeps + bounded workers;
trust comes from the gate.

## Prompt

Use [scope-pipeline](../prompts/scope-pipeline.md) for the paste-in block.
Use [elite-architecture-pass](../playbooks/elite-architecture-pass.md) to
design a new pipeline for an unfamiliar domain.
