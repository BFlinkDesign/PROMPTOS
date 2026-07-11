# PromptOS Project State

Last verified: 2026-07-11 America/Chicago

This file is an operating snapshot, not a substitute for live state. Start every
session by refreshing Git and GitHub:

```powershell
git status --short --branch
git fetch --prune origin
gh pr list --state open --json number,title,isDraft,headRefName,baseRefName,mergeable,url
```

## Durable Checkout

Primary local clone:

```text
C:\GitHub-Repos\PROMPTOS
```

Default branch:

```text
main
```

Last verified hardening baseline:

```text
c7ec86d Harden decision matrix prompt quality (#19)
```

Later docs-only handoff commits may sit on top of this baseline. Use
`git log -1 --oneline` for the current checkout commit.

Use temporary worktrees for risky feature work, but do not bake temporary paths
or branch names into repo docs after the branch is merged.

## Current Hardening Spine

The repo now has a local, no-API verification spine:

```powershell
npm run prompt:quality
npm run catalog:build
npm run catalog:evaluate
npm run schema:validate
npm run feedback:promote
npm run feedback:verify
npm run eval:promptfoo
npm run test:console
npm run verify
```

`npm run verify` is the default local gate. It runs:

1. the 15-prompt quality contract and adversarial-case coverage,
2. deterministic catalog evaluation and generated-data freshness,
3. typed `items[]` validation plus task-report schema compilation,
4. promoted feedback regression validation,
5. promptfoo smokes through the documented local `echo` provider,
6. Playwright Chromium tests against the static console and Evaluator tab.

## Generated Console Contract

`console/promptos-console.html` embeds generated catalog data and a generated
browser copy of the scoring runtime. Neither section is hand maintained.
Regenerate both from `PROMPTS.md`, `prompts/*.md`, and `tools/scoring-core.mjs`:

```powershell
npm run catalog:build
```

Then verify the generated data still matches source:

```powershell
npm run catalog:evaluate
```

The evaluator fails on broken catalog links, missing prompt files, stale console
data, stale browser scoring runtime, malformed embedded JSON, and duplicate
catalog entries. Quality scores are reported for triage; low scores should
become follow-up prompt hardening work.

## Typed Item Contract

`schema/items.schema.json` is the canonical artifact model. Generated catalog
data uses:

```text
items[]: prompt | workflow | playbook | runbook
```

Each item carries `type`, `source_path`, `title`, `summary`,
`input_requirements`, `expected_output_format`, `rules`, `domain`, `tags`,
`maturity`, `created_at`, `updated_at`, `score`, and `related`.

`prompts[]` remains embedded as a compatibility projection only.

## Browser-First Evaluation Receipts

The Evaluator accepts catalog prompts, a connected PromptOS directory, native
open-file selection, hidden file-input fallback, drag/drop, paste, and catalog
JSON. Catalog cards can enter the Evaluator and return to the same prompt.

Markdown is scored by the generated browser copy of `tools/scoring-core.mjs`.
Each receipt contains the exact SHA-256 of the evaluated text, deterministic
score and verdict, factor evidence, and the OGS fields Action, Evidence,
Authority, Blockers, Next Checkpoint, and Fallback. Confidence percentages are
not part of the receipt contract.

All writes require an explicit user click. A connected PromptOS directory can
write receipts only beneath `snapshots/`; the console never writes `feedback/`
or `tests/failures/`. Without directory access, save falls back to
`showSaveFilePicker` and then a JSON download. Unsupported open APIs fall back
to the file input. The console remains a zero-network, single-file browser app.

## Supporting Task Contracts

`templates/task-report.md` is the human-readable task-report shape and
`schema/task-report.schema.json` is the JSON contract compiled by
`npm run schema:validate`. `guides/global-agent-instructions.example.md` is a
non-authoritative example of separating global working agreements from
repo-local facts, gates, and architecture.

## Prompt Engine Boundary

The separate Prompt Engine branch remains unmerged and unproven. It is outside
this catalog-evaluator workflow slice and no Prompt Engine runtime behavior is
claimed here.

## Outcome Governance Standard

`OGS.md` is now the normative governing standard for decision and evaluator
language. The user-facing evaluator contract is:

```text
Action
Evidence
Authority
Blockers
Next Checkpoint
Fallback
```

Core rules:

1. Domain First: every decision identifies the governing domain before
   evaluating authority.
2. Reality is the only truth; everything else is evidence competing to
   approximate reality.
3. Authority is domain-bound. User preference governs goals and priorities, not
   physics, law, safety, contracts, verified measurements, or governing
   standards.
4. Measurements are evidence, not truth. They become authoritative only after
   passing the measurement verification gate.
5. No artifact self-certifies. Sensors, photos, AI outputs, calculations,
   drawings, models, documents, and tests require independent verification
   appropriate to their domain.

## Feedback Regression Loop

Raw real-world prompt failures can be staged in:

```text
feedback/*.json
```

Run:

```powershell
npm run feedback:promote
```

Promotion validates each raw feedback file against the current catalog, writes a
structured case to `tests/failures/*.json`, and refreshes
`tests/promptfoo-regression.json`. The default `npm run verify` gate then checks
that the generated promptfoo regression matrix is current and runs it through
the local deterministic `echo` provider.

The current seed cases are synthetic and labeled as such:

```text
tests/failures/seed-decision-matrix-evidence-gate.json
tests/failures/seed-scope-pipeline-verification.json
```

## Installed Tooling

Node tools are declared in `package.json` and `package-lock.json`.

Python eval tools are declared in `requirements-dev.txt`. They are installed in
the local `.venv`, which is ignored by Git. Recreate it when needed:

```powershell
C:\Python313\python.exe -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

## Last Verified Evidence

Commands run from the active feature worktree:

```text
npm run verify -> exit 0
- prompt quality: 15 prompts checked, minimum 85/100, 9 adversarial cases covered
- catalog evaluation: 15 prompts, average 99/100; every prompt at least 85/100
- schemas: 15 generated and 15 embedded items valid; task-report positive and negative controls passed
- feedback: 2 failure cases and 2 promptfoo regression tests valid
- promptfoo: 3 passed, 0 failed, 0 errors
- Playwright Chromium: 21 passed
```

The console renders the 15 tracked prompt blocks from `PROMPTS.md`; it no longer
carries the older unrelated 159-item embedded catalog.

## Known Caveats

- Full `npm audit` is clean after the promptfoo `0.121.18` patch update.
- `npm install-scripts ls` may report pending install-script approvals for
  dependency packages used by Playwright, SWC, or ONNX. Review before approving.
- Existing timestamps are still `legacy-unknown`; backfill with Git history
  before treating dates as provenance.
- The schema supports workflows, playbooks, and runbooks, while the current
  generated source set is 15 prompt files listed in `PROMPTS.md`.
- Windows and macOS desktop requirements are prompt delivery contracts, not
  target-host proof for the browser console; current CI is Ubuntu + Chromium.
- `PromptOS Verify` CI uses Node 24 because the lockfile is generated by npm 11.
  Earlier Node 22 CI failed at `npm ci` with a stale-lock error even though the
  local gate passed.

## Next Improvement Tasks

1. Add real promoted failure cases as soon as the console finds a real miss.
2. Backfill artifact timestamps from Git history.
3. Add first workflow/playbook/runbook source artifacts and wire them into the
   generator.
4. Add credential-gated model-judge examples only outside default CI; keep
   `npm run verify` deterministic.
