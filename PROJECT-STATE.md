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
npm run eval:promptfoo
npm run test:console
npm run verify
```

`npm run verify` is the default local gate. It runs:

1. deterministic catalog evaluation,
2. typed `items[]` JSON Schema validation,
3. promptfoo smoke through the documented local `echo` provider,
4. Playwright Chromium tests against the static console and Evaluator tab.

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
```text
npm run verify -> catalog 7 prompts, schema valid, promptfoo 1 passed, Playwright 4 passed
go run github.com/rhysd/actionlint/cmd/actionlint@latest .github/workflows/review-pipeline.yml .github/workflows/evals.yml -> pass
npm audit --omit=dev -> found 0 vulnerabilities
git diff --check -> pass
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

## Next Improvement Tasks

1. Harden the remaining lower-scoring prompts, starting with prompts that have
   no explicit inputs or verification language.
2. Add first workflow/playbook/runbook source artifacts and wire them into the
   generator.
3. Backfill artifact timestamps from Git history.
4. Add stronger promptfoo regression cases beyond the local echo smoke.
5. Add Inspect AI and DeepEval examples only after the deterministic and
   promptfoo lanes are non-brittle.
