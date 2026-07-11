# ADR-0001: Electron Desktop Runtime

Status: **ACCEPTED FOR ARCHITECTURE; IMPLEMENTATION BLOCKED ON PREREQUISITES**  
Date: 2026-07-11 America/Chicago

## Decision

Use **Electron + React + TypeScript** for the first PromptOS desktop shell on
Windows and macOS.

Keep the browser console as the supported fallback. Keep all catalog,
evaluation, receipt, lineage, and release logic in framework-neutral TypeScript
packages. Electron APIs may exist only in the desktop adapter. Do not rewrite
working TypeScript behavior in Rust to satisfy a shell choice.

This decision does not claim that a desktop application exists. Implementation
must not begin by wrapping the current monolithic HTML file. The prerequisites
and target-host release gates below remain blocking.

## Verified Repository Reality

The decision is based on the canonical checkout at commit
`0b66f6715ff3e99deba2e3745213a49073a43c37`:

- `console/promptos-console.html` is the only current console. It is a
  234,988-byte, 2,876-line static browser application with 211 top-level
  declarations; it is not a React application or installed desktop binary.
- Current `main` has no local HTTP service and no process-execution code.
  Production Node imports in `tools/` are limited to filesystem, path, and
  crypto operations used by build, validation, benchmark, and feedback CLIs.
- The unmerged `origin/codex/prompt-engine-agent-team` branch contains 13 unique
  commits with a Node ESM engine, CLI, provider adapters, campaign runner, and
  localhost service. It is four current-main commits behind and has named
  correctness defects in `CODEX.md`; it is evidence, not accepted authority.
- Windows and macOS desktop packaging, signing, updates, clean-host lifecycle,
  and rollback have not been tested.

The pasted premise that the current canonical product already has a merged
Node Prompt Engine and local service is therefore false. The intended product,
however, requires a local headless evaluator and provider/harness runner. If the
existing Node engine is repaired and accepted, Electron can host that runtime
without a Rust rewrite or separately packaged Node sidecar.

## Why Electron

Electron's main process runs Node.js and owns native lifecycle and privileged
operations. Long-running, CPU-intensive, or crash-prone Node work can run in
Electron utility processes. A sandboxed renderer can remain a normal React web
application and communicate through a narrow preload bridge.

That maps to the intended PromptOS runtime:

```text
React renderer
      |
typed allowlisted preload bridge
      |
Electron main process
      |
Node utility process
      |
PromptOS TypeScript Core
  catalog | evaluator | providers | campaigns | receipts | release policy
```

The local HTTP server is not the desktop boundary. The desktop adapter should
import the accepted Core directly or invoke it in a utility process. HTTP stays
an optional browser/remote adapter, not an internal requirement.

Official Electron guidance requires sandboxed renderers, disabled renderer Node
integration, context isolation, a restrictive content security policy, sender
validation, and a limited `contextBridge` API. Packaging and auto-update remain
release work, and distributable artifacts must be signed.

## Why Not Tauri 2 For Desktop V1

Tauri 2 is a valid static-SPA shell and has a strong capability model. It is the
better candidate if PromptOS remains a static browser application with no local
Node evaluator.

It is not the selected v1 shell because accepting the intended Node engine would
force one of three additional architectures:

1. rewrite the engine in Rust;
2. move local evaluation to a remote service; or
3. bundle Node as a platform-specific sidecar with scoped shell permissions,
   process supervision, version coupling, IPC, signing, and update ownership.

Tauri's official guidance describes a static frontend host and a separately
configured Node sidecar. That extra runtime boundary has no demonstrated user
benefit for PromptOS today. Tauri may be reconsidered only if the accepted Core
no longer requires local Node or a measured spike proves a material product
advantage.

Expo is not a desktop-shell candidate. A future mobile review/approval companion
would be a separate product decision and cannot own local repositories,
compilers, provider secrets, or the headless evaluator.

## Required Boundaries

Target layout:

```text
apps/
  desktop/
    main/
    preload/
    renderer/
  web/
packages/
  contracts/
  core/
  evaluator/
  providers/
  provenance/
  release-policy/
  ui/
```

Rules:

- `packages/*` cannot import Electron APIs.
- The renderer has no Node integration, filesystem, shell, Git, credential, or
  environment-variable access.
- Preload exposes named operations, never generic `exec`, `readFile`,
  `writeFile`, environment access, or raw `ipcRenderer`.
- Repository and file authority starts with explicit user selection and is
  scoped to that selection.
- Provider credentials are stored by the main process in the platform credential
  store and are never sent to the renderer or logs.
- Provider and campaign work runs in a cancellable utility process with bounded
  concurrency, time, attempts, and budget.
- Every evaluation and release decision emits the same versioned receipt as CLI
  and CI. The shell cannot define a second passing standard.

## Blocking Implementation Sequence

1. Rebase and adversarially repair the unmerged Prompt Engine. Resolve its
   holdout-selection, provenance, cost-accounting, and report-redaction defects.
2. Extract catalog, scoring, receipts, datasets, graders, and release policy into
   framework-neutral TypeScript packages with parity tests.
3. Replace the monolithic console with a React/TypeScript workbench while
   preserving the 25 verified browser workflows and all capability-ledger states.
4. Add Electron main, preload, renderer, and utility-process adapters with a
   typed IPC contract and hostile-renderer tests.
5. Prove Windows install, uninstall, upgrade, signing, updater signature,
   offline operation, crash recovery, accessibility, and rollback.
6. Prove macOS bundle signing, hardened runtime, entitlements, notarization,
   stapling, Gatekeeper, install, update, accessibility, and rollback on a Mac.

Until step 6 passes, product surfaces must continue to say that desktop support
is missing.

## Consequences

Accepted cost:

- Electron bundles Chromium and Node, increasing installer size and baseline
  memory compared with Tauri.
- PromptOS must maintain strict IPC and renderer-isolation tests.
- Windows and macOS signing and updater infrastructure remain mandatory.

Avoided cost:

- no duplicate Rust implementation of the evaluator;
- no Node-to-sidecar packaging and cross-runtime IPC layer;
- one TypeScript domain implementation shared by desktop, browser, CLI, and CI;
- direct reuse of the accepted Prompt Engine after its independent repair gate.

## Reopen Conditions

Reopen this ADR if any of these becomes verified:

- the accepted Core no longer requires a local Node runtime;
- all provider and campaign execution moves behind a remote API;
- installer size or idle memory fails a measured product budget;
- OS WebView behavior passes the full workbench suite and a Tauri spike removes
  more operational complexity than it adds;
- Electron cannot satisfy a required enterprise security or distribution policy.

## Official Sources

- [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron utility process](https://www.electronjs.org/docs/latest/api/utility-process)
- [Electron packaging and signing](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)
- [Tauri frontend configuration](https://v2.tauri.app/start/frontend/)
- [Tauri Node sidecar](https://v2.tauri.app/learn/sidecar-nodejs/)
- [Tauri capabilities](https://v2.tauri.app/reference/acl/capability/)
- [Tauri Windows signing](https://v2.tauri.app/distribute/sign/windows/)
- [Tauri macOS signing](https://v2.tauri.app/distribute/sign/macos/)
