# PROMPTOS

Portable **agent engineering kit** — prompt library, architecture patterns,
playbooks, and efficiency rules for any project. One canonical home; never
copied into every repo.

Born from the EagleScope production build day and generalized for any domain:
deterministic pipelines, verify gates, trust tiers, token discipline, cross-agent
unification, and the real-world pain points agents actually hit.

## What this is (industry terms)

| You might call it | PROMPTOS provides |
| --- | --- |
| Prompt library / meta-prompts | `prompts/` — paste-in blocks |
| Agent harness patterns | `patterns/` — architecture without domain logic |
| Context engineering | Token-budget navigation + mandatory repo index |
| Eval / verify harness | Verify gate pattern + adversarial review block |
| Agent memory | Ledger pattern (pairs with agent-kit) |
| Model routing | Model router + model-tier adapter + MODEL-TIERS architecture |

Full glossary: [glossary/TERMINOLOGY.md](glossary/TERMINOLOGY.md)

## Doctrine (one paragraph)

Deterministic systems do the volume; models run only on survivors and are
validated deterministically. Frontier models do judgment (plans, gates, review);
workhorse models do bulk building against written acceptance tests. When an
incident teaches something, it becomes a testable behavior here — not a memory.

## Quick start

```text
# Browse prompts locally — open in any browser
<clone-root>/PROMPTOS/console/promptos-console.html

# Read catalogs
<clone-root>/PROMPTOS/PROMPTS.md     # paste-in blocks
<clone-root>/PROMPTOS/PATTERNS.md    # architecture & playbooks
```

## Install into any repo

```powershell
<clone-root>\agent-kit\install.ps1 -Target "path\to\repo"   # operating law (private repo)
<clone-root>\PROMPTOS\install.ps1 -Target "path\to\repo"   # pointer only
```

Writes `agent/PROMPTS.md` as a **pointer** — prompt content stays here.

## Three-repo stack

| Repo | Role |
| --- | --- |
| **[agent-kit](https://github.com/BFlinkDesign/agent-kit)** | Operating contract, verify/trust docs, bootstrap, per-project ledgers |
| **PROMPTOS** (this repo) | Reusable prompts + patterns + playbooks — domain-agnostic |
| **Your project** | Code + `agent/ERRORS.md` + `agent/GAPS.md` + generated profile |

## Contents

| Section | What |
| --- | --- |
| [prompts/](prompts/) | 19 paste-in blocks + the projects-and-pains standing-context template — full catalog in [PROMPTS.md](PROMPTS.md) |
| [patterns/](patterns/) | Architecture: gated pipeline, verify gate, schema contracts, memory, hygiene, pain catalog |
| [playbooks/](playbooks/) | Multi-step workflows: elite architecture pass, new repo bootstrap, field hardening |
| [efficiency/](efficiency/) | Model-tier table + self-improvement loop |
| [locked/](locked/) | Behavioral invariants (00–04) — agents obey, never edit; amendments via human-reviewed PR |
| [behaviors/](behaviors/) | Parameterized operating contract + SEED→PROVE→LOCK→PRUNE lifecycle |
| [glossary/](glossary/) | Plain language → industry terminology |

## Adding content

1. **Prompt block** → `prompts/your-block.md` + row in `PROMPTS.md`
2. **Pattern** → `patterns/your-pattern.md` + row in `PATTERNS.md`
3. **Playbook** → `playbooks/your-playbook.md` + row in `PATTERNS.md`
4. Commit. No per-repo copies to update.
