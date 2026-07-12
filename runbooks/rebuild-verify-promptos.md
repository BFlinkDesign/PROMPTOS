---
id: runbook.rebuild-verify-promptos
type: runbook
title: Rebuild and verify PromptOS
summary: Regenerate the embedded catalog and scoring runtime, execute all repository gates, and recover without overwriting source artifacts.
created_at: 2026-07-11T23:47:33-05:00
updated_at: 2026-07-11T23:47:33-05:00
maturity: draft
domain: PromptOS operations
tags: [promptos, catalog, verification, ci, rollback]
stage: operate
compatibility: [universal, windows, macos, linux]
enforcement: deterministic
---

# Rebuild and verify PromptOS runbook

## Preconditions

- Repository: [PROMPTOS ROOT]
- Expected branch: [BRANCH]
- Node and npm versions satisfy the lockfile and CI contract.
- Uncommitted work has been inspected and preserved.

## Procedure

```powershell
git status --short --branch
npm ci
npm run catalog:build
npm run verify
git diff --check
git status --short
```

## Expected outputs

- Generated console data matches all tracked artifacts.
- Shared browser scoring runtime matches `tools/scoring-core.mjs`.
- Schemas, acceptance tests, feedback regressions, Promptfoo smoke, Pages build,
  review pipeline tests, and Playwright workflows pass.

## Verification

Inspect the final diff. Open the generated console through its test harness and
verify the artifact count, filters, evaluator receipt hash, and mobile overflow
behavior. A structural score is not behavioral certification.

## Rollback

Do not overwrite source Markdown to recover generated output. Restore the last
verified generated artifact from Git or rerun the generator from the unchanged
source set. If dependency restoration fails, preserve logs and return to the
last lockfile-backed commit.

## Known failures

- Running a globally resolved CLI instead of the lockfile version.
- Forgetting `npm run catalog:build` after source or scoring changes.
- Treating echo-provider Promptfoo success as model effectiveness.
