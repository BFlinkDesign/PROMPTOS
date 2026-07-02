# The Hardness Ladder — a constitution that makes itself unnecessary

Design proposal, 2026-07-02. Written from inside the current system, against
it. The existing doctrine (anti-decay bullets, SVL, ledgers, trust tiers) is
treated here as raw material, not law.

## 0 · The inversion

Today's stack fights agent forgetfulness by **repeating rules louder**: an
anti-decay hook re-injects the same eight bullets every single turn, CLAUDE.md
ships ~50KB of prose per session, and the deepest verification machinery is so
ceremonial it rarely runs. The doctrine even names its own disease — "prose
rules decay; a rule binds only outside the model" — and then remains ~90%
prose.

Invert it. **Stop writing rules for agents to remember. Build a world where
the wrong action is impossible, the right action is the default, proof is a
by-product of doing the work, and the constitution rewrites itself downward
into harder tiers on a schedule.**

Four pillars + a metabolism.

## 1 · Pillar I — The hardness ladder

Every rule lives at exactly one level, and the system's health is measured by
where its rules sit — not by how well they're written.

| L | Tier | Binding force | Example |
| --- | --- | --- | --- |
| 0 | Prose | hope | "never re-derive facts" |
| 1 | Trigger-keyed reminder | salience at the right moment | JIT injection (Pillar III) |
| 2 | Hook / gate | blocked action | guard.py refusing `git add -A` |
| 3 | Schema / contract | invalid data cannot exist | `additionalProperties:false`, FK validation |
| 4 | Tool default | right thing happens without asking | session boots FROM state file; prover runs on emit |
| 5 | Structural impossibility | no code path exists | no `$` field in any agent tool → agents cannot emit dollars |

Two laws:

- **Rules only move up.** Every recurring L0 violation is a build ticket for
  its L2+ replacement, not a louder sentence.
- **Doctrine health = % of rules at L2+.** Track it. The goal state is an
  always-on prose budget near zero because everything load-bearing became
  hooks, schemas, defaults, and impossibilities.

The deepest consequence: **stop phrasing rules as prohibitions and rebuild
them as affordances.** "Never leave scratch in customer folders" (L0) becomes
"the scratch dir is pre-created, pre-pathed, and the only writable default"
(L4). A pit of success costs zero attention forever.

## 2 · Pillar II — Proof-carrying work (trust tiers become computed, not claimed)

Today an agent *claims* VERIFIED/ASSERTED. That is backwards — a label the
worker assigns to itself is exactly the self-grading the doctrine bans.

Replace claims with **proof objects**. Every artifact type registers a
*prover* — a small deterministic function that exercises the live artifact
and emits machine-readable evidence:

```
pdf      -> pages, extracted-text assertions, rendered-page hashes
server   -> endpoint probes + response invariants
table    -> recomputed totals vs displayed totals
webpage  -> screenshot + DOM assertions
number   -> the code that derives it, re-run
```

- One command (`prove <artifact>`), one proof object, appended to a
  `proofs.jsonl` ledger next to the artifact.
- **Trust tier is derived from the proof object by rule** — deterministic
  evidence ⇒ VERIFIED; model-only reasoning ⇒ capped at ASSERTED; no proof
  object ⇒ DRAFT. The model never types the word "VERIFIED" again; the
  ledger computes it.
- Verification becomes *zero-marginal-cost*, which is the only cost at which
  it actually happens every time. The cathedral (dual-loop, cross-vendor
  panels) remains — reserved for the rare high-stakes call, invoked BY the
  risk score (Pillar IV), not by conscience.

## 3 · Pillar III — The just-in-time constitution

Always-on context is the wrong delivery mechanism for rules: expensive every
turn, stale by mid-session, and flattened into noise by repetition. Rules
should arrive like exceptions, not like wallpaper.

- Every rule carries **trigger metadata**: a tool-call pattern, file-path
  pattern, phase, or artifact type.
  `trigger: git commit` → inject the two commit rules, then.
  `trigger: path~=customers-share` → inject the share-hygiene rule, then.
- A tiny router (the hooks already see every tool call) injects the 1–3
  rules whose triggers fire — **at the moment of relevance, in full,
  once** — instead of 50KB of everything always.
- Target: always-on constitutional load ≤ ~300 tokens (identity + pointers).
  Everything else is event-driven.
- Same mechanism serves memory: memories keyed by *situation* fire when the
  situation occurs, instead of an index the agent must remember to consult.

This is cheaper AND more binding: a rule delivered at its trigger moment has
maximum salience exactly when violation is possible.

## 4 · Pillar IV — Earned autonomy (the human is the scarcest resource)

Today the gate is binary — PR review or nothing — and one human is the
bottleneck for everything. Replace with **risk-scored gating**:

```
risk = blast_radius × irreversibility × (1 - demonstrated_trust)
```

- **Low risk** → auto-proceed, logged.
- **Medium** → proceed + loud notification with a one-line undo command.
- **High** → queue a **decision card**: one sentence of context, the action,
  the reversal path, expiry. The human reviews *cards*, not diffs.
- `demonstrated_trust` is not vibes: it is a small per-(model, task-class)
  table fed by the proof ledger — pass-rates the system already generates as
  a by-product of Pillar II. Agents *earn* wider defaults where their proofs
  hold, and lose them where proofs fail. Scaffolding density (the model-tier
  adapter) stops being static per model and becomes **adaptive per track
  record**.
- Settled choices live in a schema'd, append-only `DECISIONS.jsonl`
  (decision, why, alternatives rejected, **expiry condition**). No agent
  re-litigates a live decision; no decision outlives its expiry condition
  unreviewed. Decisions stop being immortal prose dogma.

## 5 · The metabolism — self-improvement with a pulse, not an intention

The current discover→promote loop is correct and almost never runs, because
it relies on someone remembering. Give it a metabolism:

1. **Scheduled distillation** (every N sessions or weekly): a pass over
   ERRORS/GAPS ledgers MUST run and MUST emit its findings as
   ladder-climbing PRs — each recurring failure paired with its L2+
   implementation, never with more prose.
2. **Doctrine telemetry**: hooks count rule firings, blocks, and near-misses.
   Every rule pays rent.
   - Fired often → harden (move up the ladder).
   - Never fired in a quarter → delete (it was wallpaper).
   - Blocked legitimate work repeatedly → redesign (it's friction, not
     safety).
3. **The constitution audits itself by its own standard**: token cost per
   rule per session, violation catch-rate, % at L2+ — published as a small
   scoreboard. A doctrine that preaches "verify the value" must verify
   itself.

## 6 · Migration map — today's eight anti-decay bullets, retired upward

| Today (L0/L1 prose, re-sent every turn) | Destination |
| --- | --- |
| "Verify the LIVE artifact" | L4: provers run on emit; unproven artifacts are born DRAFT |
| "Verify the VALUE, math by code" | L3/L4: `number` prover — derived values carry their derivation code |
| "Self-grading caps at ASSERTED" | L3: tier is computed from proof objects; the claim path no longer exists |
| "Trust-tier every deliverable" | L3: derived field, impossible to omit or inflate |
| "No guessing / verify names live" | L2: probe-before-use hook on external identifiers |
| "No hardcoded real-world facts" | L2/L5: constants linter + facts only importable from constants source |
| "Incomplete beats fabricated / absence proof" | L1 JIT + L3: extraction schemas require a skip-ledger field — silence is invalid data |
| "Bound every loop / human-gate irreversibles" | L2/L4: governor defaults on every loop primitive; risk-scored gates (Pillar IV) |

The eight-bullet hook then shrinks to one line: *"Rules arrive when relevant;
proofs are computed; when in doubt, prove it."*

## 7 · What survives untouched

- The **human gate on irreversible actions** — now sharper, because cards
  replace diffs and low-risk noise stops reaching the human at all.
- **Bounded loops** — promoted from commandment to physics (defaults in the
  loop primitives).
- **Incomplete beats fabricated** — the one rule that stays prose, because it
  is a value, not a procedure. Constitutions need exactly a few of those.
- The **three-repo split** (law / playbooks / project) — this design slots in
  as agent-kit's enforcement layer and PROMPTOS's architecture pattern.

## 8 · Build order (each step ships value alone)

1. **Prover registry + proofs.jsonl** for the two artifact types that matter
   most today (pdf, server) — trust tiers computed for those, immediately.
2. **JIT rule router** on the existing hook infrastructure; move 3 of the 8
   bullets behind triggers; cut always-on injection proportionally.
3. **DECISIONS.jsonl** schema + "read before re-litigating" gate.
4. **Telemetry counters** in hooks; first scoreboard after two weeks.
5. **Scheduled distillation** job with the PR-output requirement.
6. **Trust table + risk-scored gates** — last, because it feeds on months of
   proof-ledger data the earlier steps generate.

---

*The test of this design is its own first law: nothing above may remain
prose. Every section names its L2+ implementation. When the migration
completes, this document should be deletable — replaced by the world it
describes.*
