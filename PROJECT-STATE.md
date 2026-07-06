# PromptOS Project State

Last verified: 2026-07-06 15:27 America/Chicago

## Current GitHub State

Repository: `BFlinkDesign/PROMPTOS`

Primary active branch:

```text
codex/prompt-library-audit
```

Open PR:

```text
PR #9: docs: add prompt library audit
https://github.com/BFlinkDesign/PROMPTOS/pull/9
head: 31f2525ac2d8d4517376a61ac9b73569f7b84cae
state: draft
checks: green as of 2026-07-06 01:17 America/Chicago
```

The exact current head changes when this state file is updated. Refresh it with:

```powershell
gh pr view 9 --json number,title,isDraft,mergeable,headRefOid,statusCheckRollup,url
```

PR #9 currently contains:

- `audits/prompt-library-audit-2026-07-06.md`
- README audit pointer
- npm eval/test tooling metadata
- Python eval tooling requirements
- repo ignore rules for local dependencies and test outputs

No GitHub issues existed when last checked after PR #9 was opened. Do not assume
issues have been created unless `gh issue list --state open` says so.

## Worktrees

Durable local clone:

```text
C:\GitHub-Repos\PROMPTOS
branch: main
```

Implementation worktree:

```text
C:\Temp\promptos-audit-github
branch: codex/prompt-library-audit
```

Use the implementation worktree for PR #9 follow-up work. Keep the durable local
clone clean and fast-forwarded to `origin/main`.

## Installed Packages

Node:

```text
node: v24.2.0
npm: 11.18.0
promptfoo: 0.121.17
@playwright/test: 1.61.1
```

Python:

```text
C:\Python313\python.exe: Python 3.13.14
inspect-ai: 0.3.244
inspect-evals: 0.14.3
deepeval: 4.0.7
pytest: 9.1.1
```

The Python packages are installed in the local worktree `.venv`, which is
ignored by Git.

## Verified Gates

Local gate evidence from `C:\Temp\promptos-audit-github`:

```text
git diff --cached --check -> pass
install.ps1 smoke -> installed pointer: agent/PROMPTS.md -> PROMPTOS
npm run tool:promptfoo -> 0.121.17
npm run tool:playwright -> Version 1.61.1
.\.venv\Scripts\inspect.exe --version -> 0.3.244
.\.venv\Scripts\deepeval.exe --version -> 4.0.7
.\.venv\Scripts\pytest.exe --version -> pytest 9.1.1
Playwright Chromium smoke -> PromptOS Console
npm audit --omit=dev -> found 0 vulnerabilities
```

Remote PR checks on `31f2525`:

```text
CodeQL Advanced / Analyze (actions): success
CodeQL Advanced / Analyze (javascript-typescript): success
CodeQL: success
GitGuardian Security Checks: success
Socket Security: Project Report: success
Socket Security: Pull Request Alerts: success
CodeRabbit: success
```

## Caveats

- Full dev `npm audit --audit-level=moderate` reports 9 moderate findings through
  promptfoo's transitive OpenTelemetry dependency chain.
- `npm audit fix --force` proposes a breaking promptfoo downgrade. Do not run it
  without reviewing the promptfoo version impact.
- `npm install-scripts ls` reports pending install-script approvals for:
  `onnxruntime-node@1.24.3`, `@playwright/browser-chromium@1.61.1`, and
  `@swc/core@1.15.43`.
- The console is still prompt-only. It has no `items[]` artifact model yet.
- The Evaluator or Tools tab is not implemented yet.
- No promptfoo, Inspect AI, DeepEval, or Playwright test files have been added
  yet beyond dependency metadata.

## Next Agent Instructions

Start here:

```powershell
cd C:\Temp\promptos-audit-github
git status --short --branch
gh pr view 9 --json number,title,isDraft,mergeable,headRefOid,statusCheckRollup,url
```

If the worktree is clean and PR #9 is still current, continue with the next
slice:

1. Add a deterministic catalog evaluator under `tools/` or `scripts/`.
2. Add fixtures under `evals/fixtures/`.
3. Add a Playwright config and a console smoke test.
4. Add a promptfoo config with a small golden set.
5. Only then add the console Evaluator or Tools tab.

Commit order should stay atomic:

1. Deterministic evaluator and fixtures.
2. Playwright console tests.
3. promptfoo config.
4. Console UI evaluator tab.
5. Documentation updates.

Do not squash or merge PR #9 until the user explicitly asks.

## Merge Strategy Reminder

The older PromptOS PR stack still matters:

- PR #4 is the likely canonical base, but it was conflicting when last checked.
- PR #5 is stacked on PR #4.
- PR #3 is clean but design-only.
- PR #1 and PR #2 appear superseded by PR #4 unless specific files are recovered.
- The DCC branch should wait until PR #4 is resolved or explicitly rejected.

Refresh live GitHub state before acting on any of these.
