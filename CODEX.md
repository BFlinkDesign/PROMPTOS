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
5. `console/promptos-console.html` for the static local browser console.
6. `audits/*.md` for dated quality and architecture assessments.
7. `package.json`, `package-lock.json`, and `requirements-dev.txt` for eval tool setup.
8. `.github/workflows/` for remote security scanning.

## Platform Boundary

Keep Codex-specific behavior in this file. Do not edit `CLAUDE.md`, Cursor
rules, Gemini files, or other platform-owned files unless the user explicitly
asks for that platform to change.

This repository should stay usable by multiple agents. Codex-owned docs may
describe how Codex should operate here, but they must not redefine another
tool's runtime contract.

## Worktree Boundary

Current safe implementation branch:

```text
C:\Temp\promptos-audit-github
branch: codex/prompt-library-audit
PR: https://github.com/BFlinkDesign/PROMPTOS/pull/9
```

The original checkout at `C:\GitHub-Repos\PROMPTOS` is the durable local clone.
Keep it clean. Use a temporary worktree for feature branches when the original
checkout has unrelated local files or is behind `origin/main`.

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

Installed eval stack on PR #9:

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
- The console currently uses `DATA.prompts`, `payload.prompts`, and `S.prompts`.
  It still needs the typed `items[]` schema before workflows, playbooks, and
  runbooks can be first-class.

## Next Work Slice

Do not start by reshaping everything. Add the durable evaluation spine in this
order:

1. Add a deterministic catalog evaluator that scores prompt entries for inputs,
   rules, summaries, output contracts, and enforceability.
2. Add `promptfooconfig.yaml` with 3 to 5 high-value prompt regression cases.
3. Add Playwright tests for the console, including paste/drop evaluation input.
4. Add an Evaluator or Tools tab to the console that can paste or drag/drop JSON
   and Markdown, then run the deterministic local score.
5. Record Inspect AI and DeepEval starter examples only after the deterministic
   and promptfoo lanes are working.

Keep each slice independently revertible and commit by concern.
