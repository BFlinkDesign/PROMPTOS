# PROMPTOS

Portable, tool-agnostic prompt library for AI coding agents. One canonical
home for reusable prompt blocks — not copied into every repo.

Born from the EagleScope build day: scope pipeline, decision matrix,
design-first UI, adversarial review, and retrospective patterns extracted
from production work.

## Quick start

```powershell
# Browse locally
start C:\Eagle\PROMPTOS\console\promptos-console.html

# Or read the catalog
notepad C:\Eagle\PROMPTOS\PROMPTS.md
```

## Install pointer into a repo

```powershell
C:\Eagle\PROMPTOS\install.ps1 -Target "C:\path\to\your\repo"
```

This writes `agent/PROMPTS.md` as a **pointer** to this repo — it does not
copy prompt content. Edit prompts here once; every repo sees the update.

## Relationship to agent-kit

| Repo | Role |
| --- | --- |
| **agent-kit** | Operating contract (`AGENTS.md`), verify gates, trust tiers, bootstrap, per-project ledgers |
| **PROMPTOS** (this repo) | Reusable prompt blocks — the *what to ask* library |
| **Your project repo** | Thin pointers + project-specific `agent/ERRORS.md` and `agent/GAPS.md` |

Install both:

```powershell
C:\Eagle\agent-kit\install.ps1 -Target "C:\path\to\repo"
C:\Eagle\PROMPTOS\install.ps1 -Target "C:\path\to\repo"
```

## The prompts

The catalog contains 15 tracked prompts. `PROMPTS.md` is the canonical index;
`npm run prompt:quality` enforces the 15-prompt baseline, a minimum deterministic
score of 85/100 for every prompt, and the required adversarial cases.

| Workflow stage | Prompt coverage |
| --- | --- |
| Align and take over | Session alignment, repository takeover |
| Plan and decide | Scope pipeline, decision matrix, task plan, design direction first |
| Implement and debug | Full-stack delivery, task implement, UI fidelity, reproduce-trace-patch |
| Review and release | Independent diff review, adversarial self-review, adversarial safety red-team, release gate |
| Learn | Retrospective |

## Verify locally

```powershell
npm ci
npm run verify
```

The verify gate runs prompt quality first, checks the generated console catalog,
validates the typed `items[]` and task-report schemas, validates promoted
feedback regressions, runs local promptfoo smokes through the no-API `echo`
provider, and launches Playwright Chromium against the static console and
Evaluator tab.

Regenerate the console payload after editing `PROMPTS.md` or `prompts/*.md`:

```powershell
npm run catalog:build
```

## Audits

- [Prompt library audit - 2026-07-06](audits/prompt-library-audit-2026-07-06.md)

## Standards

- [Outcome Governance Standard](OGS.md) - normative universal decision
  architecture for outcome-first AI systems.

## Adding a prompt

1. Add `prompts/your-block.md` with the fill-in-the-bracket template.
2. Add a row to `PROMPTS.md` catalog.
3. Run `npm run catalog:build`.
4. Run `npm run verify`.
5. Commit. No per-repo copies to update.

## Catalog schema

The console catalog is generated as `items[]` with typed artifacts:
`prompt`, `workflow`, `playbook`, or `runbook`. The compatibility `prompts[]`
projection remains embedded for older consumers, but `items[]` is the canonical
schema validated by `npm run schema:validate`.

## Evaluation receipts

The zero-network console supports a browser-first catalog-to-evaluator workflow.
Open a catalog card and choose **Evaluate this prompt**, or load local source
through a connected PromptOS directory, the native open-file picker, the hidden
file-input fallback, drag/drop, or paste. Every prompt receipt records the exact
SHA-256 of the text actually evaluated and the Outcome Governance fields:
Action, Evidence, Authority, Blockers, Next Checkpoint, and Fallback. Receipts
use deterministic scores and verdicts, not confidence percentages.

Writes require an explicit **Save receipt** click. With a connected directory,
the console writes only under `snapshots/`; it never writes `feedback/` or
`tests/failures/`. Without directory access, it uses the native save picker when
available and otherwise downloads the JSON receipt.

## Supporting contracts

- [`templates/task-report.md`](templates/task-report.md) is the human-readable
  implementation report template.
- [`schema/task-report.schema.json`](schema/task-report.schema.json) is its JSON
  contract and is compiled by `npm run schema:validate`.
- [`guides/global-agent-instructions.example.md`](guides/global-agent-instructions.example.md)
  is a non-authoritative example that separates global working agreements from
  repo-local facts and gates.

## Scope boundary

The separate Prompt Engine branch remains unmerged and unproven. It is not part
of this catalog, adversarial prompt suite, or evaluation-receipt slice.

## Feedback regressions

Raw real-world failures go in `feedback/*.json`. Promote them into durable test
cases with:

```powershell
npm run feedback:promote
npm run verify
```

Promoted cases live in `tests/failures/` and regenerate
`tests/promptfoo-regression.json`, which promptfoo runs through the local
deterministic provider.
