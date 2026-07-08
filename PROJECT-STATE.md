# PromptOS Project State

Last verified: 2026-07-08 America/Chicago

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

Use temporary worktrees for risky feature work, but do not bake temporary paths
or branch names into repo docs after the branch is merged.

## Current Hardening Spine

The repo now has a local, no-API verification spine:

```powershell
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

1. deterministic catalog evaluation,
2. typed `items[]` JSON Schema validation,
3. promoted feedback regression validation,
4. promptfoo smokes through the documented local `echo` provider,
5. Playwright Chromium tests against the static console and Evaluator tab.

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

## Console Evaluator

The Evaluator tab accepts pasted text, file-picker input, or dropped Markdown /
JSON. Markdown is scored with `tools/scoring-core.mjs`; catalog JSON reports item
count, average score, weak items, and typed-schema gaps.

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

Commands run from `C:\GitHub-Repos\PROMPTOS`:

```text
npm ci -> clean install passed under Node 24 / npm 11
npm run feedback:promote -> 0 staged feedback files, 2 promptfoo regression tests
npm run feedback:verify -> 2 failures, 2 promptfoo regression tests
npm run eval:promptfoo -> 3 passed, 0 failed, local echo provider
npm run verify -> catalog 7 prompts, average score 83/100, schema valid, feedback 2 failures/2 regressions, promptfoo 3 passed, Playwright 4 passed
go run github.com/rhysd/actionlint/cmd/actionlint@latest .github/workflows/review-pipeline.yml .github/workflows/evals.yml -> pass
npm audit --omit=dev -> found 0 vulnerabilities
git diff --check -> pass
npm ci --dry-run -> pass
HTTP Playwright smoke -> title PromptOS Console, 7 cards, Evaluator 85/100 READY
```

The console renders the 7 tracked prompt blocks from `PROMPTS.md`; it no longer
carries the older unrelated 159-item embedded catalog.

## Known Caveats

- Full dev `npm audit` reports moderate transitive findings through promptfoo's
  dependency chain. `npm audit --omit=dev` is the production-relevant check for
  this repo shape.
- `npm install-scripts ls` may report pending install-script approvals for
  dependency packages used by Playwright, SWC, or ONNX. Review before approving.
- Existing timestamps are still `legacy-unknown`; backfill with Git history
  before treating dates as provenance.
- The schema supports workflows, playbooks, and runbooks, but the current
  generated source set is still the 7 prompt files listed in `PROMPTS.md`.
- `PromptOS Verify` CI uses Node 24 because the lockfile is generated by npm 11.
  Earlier Node 22 CI failed at `npm ci` with a stale-lock error even though the
  local gate passed.

## Next Improvement Tasks

1. Harden the remaining lower-scoring prompts, starting with prompts that have
   no explicit inputs or verification language.
2. Add first workflow/playbook/runbook source artifacts and wire them into the
   generator.
3. Backfill artifact timestamps from Git history.
4. Add real promoted failure cases as soon as the console finds a real miss.
5. Add credential-gated model-judge examples only outside default CI; keep
   `npm run verify` deterministic.
