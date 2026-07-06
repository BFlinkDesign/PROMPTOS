# PromptOS Project State

Last verified: 2026-07-06 15:44 America/Chicago

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
npm run eval:promptfoo
npm run test:console
npm run verify
```

`npm run verify` is the default local gate. It runs:

1. deterministic catalog evaluation,
2. promptfoo smoke through the documented local `echo` provider,
3. Playwright Chromium tests against the static console.

## Generated Console Contract

`console/promptos-console.html` embeds catalog data, but that data is not hand
maintained. Regenerate it from `PROMPTS.md` and `prompts/*.md`:

```powershell
npm run catalog:build
```

Then verify the generated data still matches source:

```powershell
npm run catalog:evaluate
```

The evaluator fails on broken catalog links, missing prompt files, stale console
data, malformed embedded JSON, and duplicate catalog entries. Quality scores are
reported for triage; low scores should become follow-up prompt hardening work.

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
npm run catalog:evaluate -> 7 prompts, average score 76/100, no warnings
npm run eval:promptfoo -> 1 passed, 0 failed, local echo provider
npm run test:console -> 2 passed, Chromium
npm run verify -> all three gates passed
```

The console now renders the 7 tracked prompt blocks from `PROMPTS.md`; it no
longer carries the older unrelated 159-item embedded catalog.

## Known Caveats

- Full dev `npm audit` reports moderate transitive findings through promptfoo's
  dependency chain. `npm audit --omit=dev` is the production-relevant check for
  this repo shape.
- `npm install-scripts ls` may report pending install-script approvals for
  dependency packages used by Playwright, SWC, or ONNX. Review before approving.
- The console is still a prompt browser, not a full evaluator UI. The local
  deterministic evaluator exists in `tools/`, but there is not yet an in-browser
  Evaluator or Tools tab.
- The repo still needs a typed artifact model before workflows, playbooks, and
  runbooks become first-class catalog items.

## Next Improvement Tasks

1. Add an Evaluator or Tools tab that accepts pasted or dropped Markdown/JSON and
   runs the same deterministic scoring rules client-side.
2. Promote the catalog schema from `prompts[]` to typed `items[]` with
   `type`, `created_at`, `updated_at`, `maturity`, `domain`, and `tags`.
3. Harden the remaining lower-scoring prompts, starting with prompts that have
   no explicit inputs or verification language.
4. Add CI for `npm run verify` after the local gate is stable.
5. Add Inspect AI and DeepEval examples only after the deterministic and
   promptfoo lanes are non-brittle.
