# PromptOS Target Architecture

Status: core, workbench, and Electron desktop direction accepted; implementation pending.

```text
Artifact sources and imported failures
                  |
                  v
        PromptOS Core Contracts
  schemas | lineage | datasets | graders
  baselines | receipts | release policy
                  |
        +---------+---------+
        |                   |
        v                   v
 Headless runner       Shared workbench UI
 CLI / CI / adapters   catalog / eval / compare
        |                   |
        |          +--------+--------+
        |          |                 |
        v          v                 v
 dev-setup       Browser        Desktop adapter
 control plane   fallback       Windows + macOS
```

## Boundaries

### PromptOS Core

Pure, testable modules own artifact parsing, schemas, structural lint, dataset
contracts, grader contracts, experiment comparison, release policy, receipts, and
lineage. Core code must not depend on the browser DOM, Electron, Tauri, GitHub
Actions, or a specific model provider.

### Workbench

The workbench presents catalog, intake, datasets, experiments, comparisons,
failures, and evidence. It consumes Core contracts and never reimplements scores
or release decisions in UI-only code.

### Desktop Shell

ADR-0001 selects Electron as the Windows and macOS desktop adapter around the
same React/TypeScript workbench and framework-neutral Core. The decision is based
on the intended local Node evaluator and provider/harness runner. It does not
approve the unmerged Prompt Engine or claim a desktop build exists. No working
TypeScript behavior may be duplicated in Rust merely to satisfy a shell choice.
The first accepted shell proof must include:

- a read-only folder connection and explicit user-selected receipt write;
- no unrestricted shell or home-directory access;
- Windows install, uninstall, upgrade, signing, and updater-signature proof;
- macOS signing, hardened runtime, entitlements, notarization, stapling,
  Gatekeeper, install, and update proof;
- crash recovery, offline behavior, keyboard access, accessibility, and rollback.

The browser remains a supported fallback. Nativefier is not part of the
production contract. Electron becomes a shipped capability only after the
prerequisites and target-host gates in
[`ADR-0001`](adr/0001-electron-desktop-runtime.md) pass.

### Headless Runner

The runner executes deterministic gates locally and provider-backed evaluations
when credentials and budgets permit. Every run records artifact, dataset, grader,
provider/model configuration, Git SHA, timestamps, cost, latency, errors, and
result hashes. Provider failures cannot rewrite an accepted baseline.

### External Systems

`dev-setup` owns autonomous repair, rate limits, branch isolation, deployment,
rollback, and critical-only alerting. PromptOS supplies evaluation contracts and
receipts; it does not execute fleet mutations. NewsWatch, frontier-ai-radar,
self-prompt-lab, and agent-kit remain separate owners exposed through bounded
adapters or generated releases.

## Promotion Sequence

1. Govern all current and historical capability state.
2. Replace readiness language with structural-lint language.
3. Add versioned behavioral datasets and deterministic graders.
4. Add provider matrices, immutable baselines, pairwise comparison, and budgets.
5. Add production failure capture, human review, and failure promotion.
6. Repair and accept the Node Prompt Engine, extract the shared workbench/Core,
   then prove Electron on Windows and macOS without coupling Core packages to
   that shell.
7. Connect the verified headless contract to the `dev-setup` repair/release loop.

No later stage may be represented as shipped because an earlier stage exists.
