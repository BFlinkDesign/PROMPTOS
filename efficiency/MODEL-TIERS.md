# Model-tier efficiency architecture

How to get frontier-grade output at every tier without frontier-grade token
burn — proven methods only, each one already exercised in production on the
EagleScope / agent-kit stack. Companion prompt blocks:
[model-tier-adapter](../prompts/model-tier-adapter.md) ·
[token-budget-navigation](../prompts/token-budget-navigation.md).

## 1 · The tier table

| Tier | Examples | Give it | Never give it |
| --- | --- | --- | --- |
| **FRONTIER** | Fable/Opus-class | Goals + constraints + verify gates. Trust its planning; strip ceremony (no restated plans, no per-step narration). | Step-by-step checklists it must echo back — that is pure token burn at this tier. |
| **MID** | Sonnet-class | Injected scaffolding: 3-line plan, small slices (≤3 files), a proof command per slice, stop-after-2-failures rule. | Open-ended multi-system refactors in one pass; unbounded "keep trying" loops. |
| **SMALL** | Haiku-class, local models | Mechanical templates: exact file, exact diff shape, exact verify command, one retry. | Design decisions, reconciliation judgment, anything requiring source-weighing. |

The **same invariants bind every tier** (verify the value, verify the live
artifact, bounded loops, no fabricated values); only the *scaffolding density*
changes. That is the whole trick: frontier discipline is written down once and
injected downward, instead of hoping smaller models improvise it.

## 2 · Mandatory repo indexing (the token-burn killer)

Rule: **an agent may not walk a repo it has an index for.**

- Every repo carries a generated `agent/PROJECT_PROFILE.md` (languages,
  build/test/lint commands, layout, entry points), produced by a
  deterministic, stdlib-only `agent/bootstrap.py` — no network, no LLM,
  regenerate in seconds when stale. (Shipped pattern: agent-kit.)
- Session start = read index + GAPS + ERRORS tail. Everything else is a
  targeted read driven by the index, a search hit, or a stack trace.
- Staleness check is mechanical: if the index cites a missing file,
  regenerate before proceeding.
- Why not embeddings/RAG for this: a 60-line deterministic profile answers
  the questions agents actually ask at session start, costs nothing to
  regenerate, and never hallucinates. Vector search is for content lookup
  inside large corpora, not repo orientation.

## 3 · The self-improvement loop (discover → promote, human-gated)

```
run work ──> append-only ledgers ──> recurring pattern? ──> promote to rule ──> PR review ──> contract/pack
             ERRORS.md · GAPS.md        (≥2 occurrences)      (deterministic        (human gate)
                                                               wording, testable)
```

- **Capture** is cheap and mandatory: one ledger line per failure mode / gap
  at session end (see token-budget-navigation block).
- **Promotion** is deliberate and gated: when the same failure appears twice,
  it gets distilled into a rule — a contract line, a trade-pack entry, a
  hook, or a test — and lands via PR, never silently. (Doctrine: discovery
  is a candidate, promoted rules are deterministic/tested/reversible.)
- **Proof this works:** EagleScope 2026-07-02 — a hand-caught bid-day miss
  ("single-vs-double-sided / flush") was promoted the same day into
  trade-pack anchors + a section-context sweep + regression tests with
  negative controls (PR #9). The system got permanently harder to fool at
  zero ongoing token cost.
- The loop is **bounded**: promotion happens at review points, not in a
  background daemon; nothing self-modifies without the PR gate.

## 4 · Wiring per host (same kit, every tool)

| Host | Wire-up |
| --- | --- |
| Claude Code | `CLAUDE.md` points at `AGENTS.md` (agent-kit) + these blocks; hooks re-inject the invariants each turn (anti-decay). |
| Cursor | `.cursor/rules/` pointer to `AGENTS.md`; blocks pasted from the console. |
| Codex | Reads `AGENTS.md` natively; keep it the canonical contract. |
| Gemini / other | `GEMINI.md` pointer file; the prompt blocks are model-agnostic by construction. |

One canonical contract + pointer files per tool — never per-tool forks of the
rules (fork drift is itself a documented failure mode).

## 5 · What is deliberately NOT here

- No autonomous self-modification (rules change only through PRs).
- No per-repo copies of prompts (pointer installs only; edit once).
- No speculative "memory databases" — append-only text ledgers + generated
  index cover the need and stay diff-reviewable.
