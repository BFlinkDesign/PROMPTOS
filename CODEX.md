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
3. `OGS.md` for the normative Outcome Governance Standard.
4. `PROMPTS.md` for the tracked prompt catalog.
5. `prompts/*.md` for individual prompt blocks.
6. `schema/items.schema.json` for the typed artifact contract.
7. `tools/scoring-core.mjs` for the shared deterministic scoring rules.
8. `feedback/` for raw failure staging.
9. `tests/failures/` and `tests/promptfoo-regression.json` for promoted regressions.
10. `console/promptos-console.html` for the static local browser console.
11. `audits/*.md` for dated quality and architecture assessments.
12. `package.json`, `package-lock.json`, and `requirements-dev.txt` for eval tool setup.
13. `.github/workflows/` for remote security scanning and verification.
14. `ecosystem/registry.json` and `docs/PROMPTOS-ECOSYSTEM.md` for product
    ownership, integration, migration, and retirement boundaries.
15. `docs/PRODUCT-CONTRACT.md` and `docs/TARGET-ARCHITECTURE.md` for the
    normative product boundary and accepted desktop/core direction.
16. `governance/capabilities.json` for every verified, partial, missing,
    intake, superseded, and retired capability.
17. `docs/EVALUATION-BENCHMARK.md` and `benchmarks/*.json` for current
    official-source capability parity and adversarial structural-lint limits.
18. `intake/legacy-console-v1/` for the preserved 159-record historical
    catalog; intake is never active or authoritative without promotion gates.

## Ecosystem Boundary

PromptOS owns reusable prompt artifacts, their catalog, evaluator, receipts,
schemas, and browser console. It does not own dev-setup runtime policy,
agent-kit bootstrap contracts, self-prompting automation, NewsWatch ingestion,
or a general operations cockpit.

Do not install OperatorOS or any other consolidation bundle into this repo. Use
the validated ecosystem registry to route each candidate artifact to its actual
owner, then import only the normalized prompt/workflow/playbook/runbook content
that passes PromptOS quality and regression gates.

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

- Full `npm audit` is clean after the promptfoo `0.121.18` patch update.
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
- The 0-100 value is deterministic structure lint. It is not prompt quality,
  effectiveness, maturity, or release authority. Behavioral claims require a
  versioned dataset, declared graders, an accepted baseline, and a reproducible
  experiment receipt.
- Raw feedback lives in `feedback/*.json`; promoted regressions live in
  `tests/failures/*.json`. Run `npm run feedback:promote` after adding raw
  feedback, then `npm run verify`.
- The target desktop architecture is a narrow adapter around the shared
  React/TypeScript workbench and Core contracts. Electron and Tauri 2 remain
  candidates pending a repository-grounded runtime ADR. Do not add Nativefier or
  claim desktop support until Windows and macOS target-host release gates pass.
- Windows and macOS desktop requirements in the prompt suite are delivery
  contracts, not native target-host proof for this browser console. CI remains
  Ubuntu plus Chromium until PromptOS ships a real native desktop artifact.
- `PromptOS Verify` CI uses Node 24 because the committed lockfile is generated
  by npm 11. A clean `npm ci` passed locally under Node 24/npm 11.

## Browser-First File Access Status

The browser-first File System Access slice is implemented on the current
feature branch:

1. Feature-detect `window.showDirectoryPicker` and `window.showOpenFilePicker`.
   Open folders read-only, then request read/write permission only from the
   explicit receipt-save action.
2. Preserve current drop, paste, and file-input behavior as fallback.
3. Let users open the local PromptOS folder, inspect prompt files, and save
   provenance-backed evaluation receipts under `snapshots/` from explicit user
   gestures.
4. Do not write browser-generated receipts to `feedback/` or silently promote
   them into
   `tests/failures/*.json`; promotion remains the deterministic
   `npm run feedback:promote` / `npm run verify` path unless the user chooses a
   specific regression-save flow.
5. Preserve paste, drag/drop, file-input, save-picker, and JSON-download
   fallbacks when the native APIs are unavailable.
6. Keep the console browser-based until native distribution has a concrete
   requirement.

## Outcome Governance Direction

`OGS.md` is the governing response and decision standard. Build evaluator UX
around outcome language, not confidence language:

```text
Action
Evidence
Authority
Blockers
Next Checkpoint
Fallback
```

Apply Domain First before authority ranking. Do not let user preference, model
output, a document, a measurement, or a test self-certify. Authority is
domain-bound, governing authorities are domain-specific, and measurements
become authoritative only after passing the measurement verification gate.

## Next Work Slice

The repo has the durable deterministic spine. Continue hardening in this order:

1. Add 3 to 5 high-value promptfoo regression cases beyond the current local
   echo smoke.
2. Add first-class workflow, playbook, and runbook source directories once their
   content model is settled.
3. Backfill real `created_at` and `updated_at` values from Git history instead
   of inventing dates.
4. Correct the unmerged Prompt Engine branch's holdout-selection, provenance,
   cost-accounting, and report-redaction defects before considering a merge.
5. Add credential-gated model-judge examples only outside default CI; keep
   `npm run verify` deterministic.
6. Record Inspect AI and DeepEval starter examples only after the deterministic
   feedback loop has more real cases.

Keep each slice independently revertible and commit by concern.

---

### AGENT PERSISTENT MEMORY

- Last verified hardening baseline: `c7ec86d`
  (`Harden decision matrix prompt quality (#19)`).
- Current checkout commit is always the live `git log -1 --oneline` value; do
  not treat this handoff block as a substitute for that one command.
- Verified narrow status: source generation, schemas, local structural lint,
  capability inventory, and browser workflows pass. Behavioral effectiveness
  remains unverified.
- Current catalog baseline: 16 active source-backed prompts plus 159 historical
  intake records. The active catalog averages `99/100` structure lint; that
  value has no effectiveness or release authority.
- Current console baseline: 25 Playwright tests covering the browser receipt,
  file-access, explicit-save, fallback, no-network, and mobile-overflow paths.
- Default workflow: read `PROJECT-STATE.md` first, then run only the narrow gate
  needed for the task. Use `npm run verify` before behavior-changing commits.
- Feedback workflow: stage raw failures in `feedback/*.json`, promote with
  `npm run feedback:promote`, and verify with `npm run feedback:verify` or the
  full `npm run verify` gate.
- Keep credentialed/model-judge evals outside default offline CI. Re-audit when
  a capability claim, benchmark, source, dependency, or runtime path changes.
- Architecture decision: share one React/TypeScript workbench across the browser
  fallback and a narrow Windows/macOS shell. Select Electron or Tauri 2 only
  after inventorying the real Node/process requirements and running measured
  security, packaging, update, and target-host spikes. Do not add Nativefier.
- Outcome decision: evaluator output should follow the Outcome Governance
  Standard contract: action, evidence, authority, blockers, next checkpoint,
  fallback. Do not expose confidence theater as user-facing value.
- Next useful work: add versioned behavioral datasets and graders, then compare
  candidate prompt versions against immutable accepted baselines before
  repairing or importing the unmerged Prompt Engine.
