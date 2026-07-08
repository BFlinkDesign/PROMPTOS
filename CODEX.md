# CODEX.md

Codex operating notes for `PROMPTOS`.

## Repository Role

`PROMPTOS` is a portable, tool-agnostic prompt and workflow library. It stores
reusable prompt blocks in `prompts/`, a catalog in `PROMPTS.md`, a static browser
console in `console/`, and repo-owned audit/state docs for professional-grade
evaluation work.

Do not copy prompt content into downstream repos. Downstream repos should get a
thin `agent/PROMPTS.md` pointer that names this repo as the canonical source.

## Source Order

1. `PROJECT-STATE.md` for current branch, PR, gates, caveats, and next actions.
2. `README.md` for repo purpose and workflow.
3. `PROMPTS.md` for the tracked prompt catalog.
4. `prompts/*.md` for individual prompt blocks.
5. `schema/items.schema.json` for the typed artifact contract.
6. `tools/scoring-core.mjs` for the shared deterministic scoring rules.
7. `feedback/` for raw failure staging.
8. `tests/failures/` and `tests/promptfoo-regression.json` for promoted regressions.
9. `console/promptos-console.html` for the static local browser console.
10. `audits/*.md` for dated quality and architecture assessments.
11. `package.json`, `package-lock.json`, and `requirements-dev.txt` for eval tool setup.
12. `.github/workflows/` for remote security scanning and verification.

## Platform Boundary

Keep Codex-specific behavior in this file. Do not edit `CLAUDE.md`, Cursor
rules, Gemini files, or other platform-owned files unless the user explicitly
asks for that platform to change.

This repository should stay usable by multiple agents. Codex-owned docs may
describe how Codex should operate here, but they must not redefine another
tool's runtime contract.

## Worktree Boundary

The durable local clone is:

```text
C:\GitHub-Repos\PROMPTOS
```

Do not trust a remembered branch name or a stale handoff path. Start with:

```powershell
git status --short --branch
git fetch --prune origin
gh pr list --state open --json number,title,isDraft,headRefName,baseRefName,mergeable,url
```

Use temporary worktrees for feature branches when useful, but remove them after
merge and do not bake temporary paths into tracked docs.

## Eval Tooling

Node tooling:

```powershell
npm install
npm run tool:promptfoo
npm run tool:playwright
```

Python tooling:

```powershell
C:\Python313\python.exe -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\inspect.exe --version
.\.venv\Scripts\deepeval.exe --version
.\.venv\Scripts\pytest.exe --version
```

Installed eval stack:

- `promptfoo` for prompt regression configs and CI-friendly model/prompt comparisons.
- `@playwright/test` for local console smoke tests, screenshots, and file/drop workflows.
- `inspect-ai` and `inspect-evals` for higher-end agent/tool/sandbox evals.
- `deepeval` and `pytest` for Python/pytest-style LLM app evaluation.

## Local Gates

Core repo hygiene:

```powershell
git status --short --branch
git diff --check
```

Default local verification gate:

```powershell
npm run verify
```

Catalog and console hardening:

```powershell
npm run catalog:build
npm run catalog:evaluate
npm run schema:validate
npm run feedback:promote
npm run feedback:verify
```

Installer smoke:

```powershell
$tmp = Join-Path $env:TEMP ("promptos-install-smoke-{0}" -f ([guid]::NewGuid().ToString("N")))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
try {
  powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Target $tmp
  Test-Path (Join-Path $tmp "agent\PROMPTS.md")
} finally {
  $resolved = [System.IO.Path]::GetFullPath($tmp)
  $tempRoot = [System.IO.Path]::GetFullPath($env:TEMP)
  if ($resolved.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
      (Split-Path -Leaf $resolved).StartsWith("promptos-install-smoke-", [System.StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
}
```

Eval tooling smoke:

```powershell
npm run tool:promptfoo
npm run tool:playwright
.\.venv\Scripts\inspect.exe --version
.\.venv\Scripts\deepeval.exe --version
.\.venv\Scripts\pytest.exe --version
```

Console browser smoke:

```powershell
node -e "const { chromium } = require('@playwright/test'); (async()=>{ const b=await chromium.launch({headless:true}); const p=await b.newPage(); await p.goto('file:///' + process.cwd().replace(/\\/g,'/') + '/console/promptos-console.html'); console.log(await p.title()); await b.close(); })().catch(e=>{ console.error(e); process.exit(1); });"
```

Expected console smoke output:

```text
PromptOS Console
```

## Known Caveats

- `npm audit --omit=dev` is clean.
- Full dev audit currently reports moderate transitive findings through
  promptfoo's OpenTelemetry dependency chain. `npm audit fix --force` proposes
  a breaking promptfoo downgrade; do not force-apply without reviewing.
- `npm install-scripts ls` reports install-script approvals pending for
  dependency packages. The CLI and Playwright browser smoke still passed in the
  local worktree.
- The console embeds generated data from `PROMPTS.md` and `prompts/*.md`. Do not
  hand-edit the `const DATA = ...` payload; run `npm run catalog:build`.
- `items[]` is the canonical catalog shape. `prompts[]` remains as a generated
  compatibility projection for older browser and JSON consumers.
- The in-browser Evaluator uses a generated copy of `tools/scoring-core.mjs`.
  If scoring logic changes, `npm run verify` fails until `npm run catalog:build`
  refreshes the embedded runtime.
- Raw feedback lives in `feedback/*.json`; promoted regressions live in
  `tests/failures/*.json`. Run `npm run feedback:promote` after adding raw
  feedback, then `npm run verify`.
- `PromptOS Verify` CI uses Node 24 because the committed lockfile is generated
  by npm 11. A clean `npm ci` passed locally under Node 24/npm 11.

## Next Work Slice

The repo has the durable deterministic spine. Continue hardening in this order:

1. Add 3 to 5 high-value promptfoo regression cases beyond the current local
   echo smoke.
2. Add first-class workflow, playbook, and runbook source directories once their
   content model is settled.
3. Backfill real `created_at` and `updated_at` values from Git history instead
   of inventing dates.
4. Add credential-gated model-judge examples only outside default CI; keep
   `npm run verify` deterministic.
5. Record Inspect AI and DeepEval starter examples only after the deterministic
   feedback loop has more real cases.

Keep each slice independently revertible and commit by concern.
