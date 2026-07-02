# Pattern: Agent memory (append-only ledgers)

Agents forget between sessions. **Ledgers** are the cheap, diff-reviewable
substitute for vector databases and "memory MCPs."

## Three files

| File | Role | Edit rule |
| --- | --- | --- |
| `PROJECT_PROFILE.md` | Generated repo index (languages, commands, layout) | Never hand-edit; regenerate with bootstrap |
| `ERRORS.md` | Failure modes hit in production | Append-only; one line per new failure |
| `GAPS.md` | Quiet risks not yet fixed | Append with owner action |

## Session protocol

**Start:** read profile → read GAPS → read last ~10 ERRORS lines.  
**End:** append any new failure or gap. Never rewrite history.

## Promotion loop (human-gated)

```
ledger entry ──> same failure twice? ──> distill to rule ──> PR ──> contract/test/hook
```

Discovery is cheap. Promotion is deliberate. Nothing self-modifies without review.

## Why not RAG for this

Ledgers answer "what broke last time?" in 20 lines. Vector search adds latency,
cost, and hallucination risk for a problem that append-only text solves.

## Wiring

Shipped in [agent-kit](https://github.com/BFlinkDesign/agent-kit). Every repo
gets its own ledgers; PROMPTOS stays domain-agnostic.

---

Paste-in operationalizations of the promotion loop: [miss-promotion](../prompts/miss-promotion.md)
(observation → deterministic rule, gated) and [doctrine-distiller](../prompts/doctrine-distiller.md)
(incidents → locked behavior, no softening).
