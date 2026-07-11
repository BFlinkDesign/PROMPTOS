# PromptOS Ecosystem Consolidation

Status: canonical product-boundary decision for PromptOS.
Observed: 2026-07-11 America/Chicago.

## Action

Use one PromptOS product and one PromptOS console:

```text
Repository: https://github.com/BFlinkDesign/PROMPTOS
Local checkout: C:\GitHub-Repos\PROMPTOS
Console source: console\promptos-console.html
```

Do not create a console-hub repository and do not merge NewsWatch, dev-setup,
agent-kit, or their runtimes into PromptOS. Integrate only through bounded,
read-only adapters or links.

The machine-readable ownership contract is
[`ecosystem/registry.json`](../ecosystem/registry.json). `npm run
schema:validate` rejects multiple canonical products, duplicate asset IDs,
another native PromptOS owner, or a retirement candidate incorrectly marked to
keep.

## Product Boundary

PromptOS owns:

- reusable prompts, workflows, playbooks, and runbooks;
- the typed artifact catalog and quality evaluator;
- deterministic receipts, snapshots, schemas, regressions, and browser tests;
- the browser-first local console on Windows and macOS.

PromptOS does not own:

- developer-agent runtime policy, hooks, installers, or control-plane doctrine;
- self-prompting automation and scheduled agent execution;
- news ingestion, ranking, market data, or external-signal storage;
- a general operations cockpit;
- native desktop packaging without a demonstrated distribution requirement.

## One Surface, Separate Owners

| Console surface | Owner | Integration rule |
| --- | --- | --- |
| Catalog | PromptOS | Native. Render only generated `items[]`. |
| Evaluator | PromptOS | Native. Deterministic local scoring and explicit receipt writes. |
| Sources | PromptOS shell | Planned read-only adapter index; never an authoring backdoor. |
| Frontier radar | dev-setup | Read an exported catalog snapshot with source timestamp and provenance. |
| News signals | NewsWatch | Deep link or consume a bounded read-only snapshot. Never copy credentials or ingestion code. |
| Agent contracts | dev-setup / agent-kit | Link to the governing contract or generated release. Do not copy it into prompts. |
| Harness status | Owning runtime | Show status/evidence only. The browser console must not silently execute automation. |

This gives the user one place to inspect PromptOS-related capabilities without
turning one repository into every system.

## Disposition Matrix

| Asset | Verified role | Decision |
| --- | --- | --- |
| `BFlinkDesign/PROMPTOS` | Catalog, evaluator, receipts, prompt quality gates | **Canonical product.** |
| Desktop `promptos-console.html` | Historical 159-item PromptOS console snapshot | **Retired 2026-07-11.** It was byte-for-byte a PromptOS Git object, the canonical main console passed verification, no shortcut targeted it, and the stale folder was removed. |
| OperatorOS Agentic Playbook v1 ZIP | Uncommitted doctrine, prompts, schemas, installers, and migration proposal | **DRAFT source package. Do not install.** Salvage artifacts only after owner-specific review and stronger gates. |
| dev-setup `frontier-ai-radar/` | Tool intake, evidence, quarantine, adoption | **Keep in dev-setup.** Add a read-only export adapter only when the Sources view is implemented. |
| dev-setup `self-prompt-lab/` | Bounded self-prompting automation reference | **Keep in dev-setup.** Link or display status; do not merge runtime code. |
| `BFlinkDesign/agent-kit` | Portable agent operating contract and bootstrap | **Keep separate pending owner audit.** Make it a generated dev-setup release before considering retirement. |
| `BFlinkDesign/newswatch` | Full external-signal application | **Keep separate.** Integrate by snapshot or deep link. |
| `C:\Scripts\console-kit\newswatcher` | Static producer/adapter prototype | **Migrate unique adapter logic, then retire.** Do not preserve a second console product. |
| `BFlinkDesign/promptforge` | README plus fleet boilerplate | **Archive candidate.** No implementation exists to merge. |
| `BFlinkDesign/promptvault-ai` | README plus fleet boilerplate | **Archive candidate.** No implementation exists to merge. |
| Duplicate dev-setup checkouts | Separate branches and local changes | **Do not delete.** Reconcile Git state in a dedicated dev-setup cleanup task. |

## OperatorOS Package Audit

Verified package identity:

```text
SHA-256: a19a288c03bf8872f1dc8f7ebea64603325a213618c54b4639733f17fd634a53
Files: 101
Unsafe archive paths: 0
Python compile: PASS
Package synthetic selftest: PASS
Potential secret shapes in extracted files: 0
```

Those checks prove archive identity, parseability, and the package's narrow
synthetic fixtures. They do not establish production readiness.

Blocking findings:

1. The package declares itself the only doctrine owner, conflicting with the
   live authoritative dev-setup control-plane contract.
2. `bootstrap_repo.py` overwrites `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Cursor
   rules, and Copilot instructions. That violates platform ownership and can
   erase repository-specific contracts.
3. `validate_records.py` implements selected required-field and enum checks but
   does not load the shipped JSON Schema files. "Record-schema validation" is
   therefore broader than the exercised implementation.
4. `check_sprawl.py` checks exact hashes, nested `AGENTS.md`, and three
   hard-coded deprecated filenames. It does not perform the claimed semantic
   overlap analysis and rejects the live PromptOS tree solely because
   `design-direction-first.md` is on its fixed list.
5. The package contains no GitHub Actions delivery pipeline, rate-limit policy,
   observability backend, critical-only alert router, isolated AI repair loop,
   deployment canary, hot-load mechanism, or rollback executor.
6. Its selftest runs each tool's synthetic `--selftest`; it does not run the
   package gates against live PromptOS, agent-kit, dev-setup, or NewsWatch.

Salvage candidates:

- domain-bound authority and evidence/trust separation;
- record schemas after real schema validation and negative fixtures;
- bounded work-order and verification receipt concepts;
- adaptive product-design and adversarial-review content after PromptOS quality
  normalization;
- migration inventory vocabulary after removing the single-doctrine premise.

Rejected as-is:

- the installer;
- the claim that OperatorOS supersedes dev-setup;
- hard-coded sprawl decisions;
- Linear as a prerequisite for technical truth or delivery;
- any production-candidate label before real repo and live deployment evidence.

## Desktop Contract

The supported product is a browser-first local console that runs on Windows and
macOS. File System Access APIs are progressive enhancement; open-file, drag,
drop, paste, save-picker, and JSON-download fallbacks preserve the workflow.

Do not wrap the monolithic console merely to make it look installed. ADR-0001
selects Electron for the eventual Windows/macOS shell because the intended local
Node evaluator and provider runner would otherwise require a second runtime or
sidecar. Implementation remains blocked until the Node engine is repaired and
the shared React/TypeScript workbench and Core are extracted.

## Open Pull Request Disposition

The following decisions reduce the old draft stack without losing Git history:

| PR | Decision |
| --- | --- |
| #1 and #2 | Close as explicitly superseded by #4. |
| #3 | Move the Hardness Ladder concept to dev-setup architecture; it is control-plane design, not PromptOS catalog content. |
| #4 | Close after recording a salvage issue. Extract only reusable prompt/workflow/playbook artifacts; keep locked operating doctrine in dev-setup or agent-kit. |
| #5 | Close after recording its receipt/eval concepts in the salvage issue. It is stacked on #4 and its runtime-wide telemetry belongs outside the catalog. |
| #10 | Close as superseded. Its proposed mega-console assumed unverified shared contracts and would create another product owner. |
| #20 | Keep until its prompt is cataloged, quality-gated, and either merged or absorbed by a prompt-content PR. |
| #21 | Canonical current implementation slice. Merge only after local and GitHub verification pass. |

Closing a PR does not delete its branch or commits. The salvage issue must link
the exact PRs and list the content that still needs a destination.

## Cleanup Gates

1. Merge the canonical catalog/evaluator implementation and verify main.
2. Audit `console-kit/newswatcher` against NewsWatch; migrate only unique,
   non-secret adapter behavior.
3. Archive `promptforge` and `promptvault-ai` only after checking releases,
   packages, deployments, open product PRs, and external consumers.
4. Reconcile duplicate dev-setup checkouts in a separate task. They currently
   contain divergent branches or uncommitted work and are not safe to remove.

## Security Blocker Outside PromptOS

NewsWatch currently has a credential-shaped value in tracked project-state
documentation. Do not copy that document into PromptOS or an adapter. Rotate
the credential through the owning service, remove the value from the current
tree, and decide whether private Git history must be rewritten. Redaction alone
does not rotate the credential or remove historical copies.

## Next Checkpoint

The next product feature is a small **Sources** view backed by explicit adapter
contracts, not a merged console hub. Start with the frontier radar's exported
catalog because it is static, provenance-friendly, and read-only. Add NewsWatch
only after its credential incident and dirty checkout are resolved.
