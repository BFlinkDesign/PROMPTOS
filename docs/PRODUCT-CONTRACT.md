# PromptOS Product Contract

Status: normative.
Updated: 2026-07-11 America/Chicago.

## Outcome

PromptOS is the governed workbench for creating, finding, evaluating, comparing,
and releasing reusable prompts, workflows, playbooks, and runbooks. It must make
the evidence behind an artifact visible without confusing structural completeness
with real-world effectiveness.

The product succeeds when a user can move from an artifact or observed failure to
a reproducible evaluation, a justified release decision, and a durable regression
case without losing source, history, or prior capabilities.

## Product Boundary

PromptOS owns:

- artifact source, metadata, catalog, versions, lineage, and retirement records;
- deterministic lint, behavioral evaluation contracts, datasets, experiments,
  comparisons, receipts, and regression gates;
- the shared workbench UI and its Windows, macOS, and browser delivery surfaces;
- explicit adapters that read evidence from external systems.

PromptOS does not own:

- developer-agent hooks, fleet policy, autonomous repair, or deployment control;
- news ingestion, tool discovery, or general operations monitoring;
- another repository's platform instructions or runtime contract.

Those belong to `dev-setup`, NewsWatch, frontier-ai-radar, and their respective
owners. PromptOS may display bounded evidence from them but cannot silently absorb
their runtimes.

## User Contract

Every evaluation must distinguish these layers:

1. **Structure:** required sections, inputs, boundaries, and output language.
2. **Behavior:** outputs produced on versioned test cases and judged by declared
   deterministic, model, or human graders.
3. **Regression:** candidate behavior compared with an immutable accepted baseline.
4. **Safety:** adversarial and misuse cases, including over-blocking controls.
5. **Operations:** cost, latency, errors, trace coverage, and production failures.

A structure score is lint. It is never readiness, maturity, effectiveness, or
release authority. An artifact is releasable only when its declared behavioral
and operational gates pass.

## No Silent Feature Loss

Every shipped, historical, proposed, retired, or superseded capability must have
one record in `governance/capabilities.json` containing:

- current status and trust tier;
- owning system and canonical source;
- evidence and runnable gate;
- user impact and next action;
- replacement or retirement reason when applicable.

Removing a capability from navigation, generated data, or source code does not
remove this obligation. Intake content stays non-authoritative until promoted,
but it remains discoverable and dispositioned.

## Delivery Surfaces

- **Shared workbench:** one UI and one core contract for catalog, evaluation,
  comparison, evidence, and receipts.
- **Windows and macOS desktop:** a narrow shell around the shared workbench is
  required. Electron and Tauri 2 remain candidates until a repository-grounded
  ADR inventories the Node runtime and proves packaging, signing, updating,
  security, and target-host behavior. Core packages cannot depend on either shell.
- **Browser:** offline-capable fallback for reading, paste/drop evaluation, and
  explicit file operations. Browser permission grants are not represented as
  permanent filesystem authority.
- **CLI/CI:** headless execution of the same schemas, datasets, graders, and release
  policies. The UI cannot implement a different definition of passing.

Desktop claims remain DRAFT until Windows packaging/signing/update and macOS
bundle/signing/notarization/Gatekeeper tests run on their target hosts.

## Release Authority

Release decisions require:

- versioned artifact, dataset, grader, model/configuration, and baseline IDs;
- deterministic vetoes before weighted scores;
- recorded output, cost, latency, error, and safety results;
- reproducible logs or receipts tied to the Git commit;
- explicit blockers and rollback;
- independent review for high-impact changes.

No aggregate score may hide a failed veto. No model, evaluator, merged PR, or green
test self-certifies the outcome it is intended to prove.

## Operational Reality

As of this version:

- the 16-file catalog, static browser console, generated source fingerprint, and
  local verification pipeline are VERIFIED for their narrow contracts;
- the deterministic 0-100 value is VERIFIED only as structural lint;
- the historical 159-record console catalog is preserved as intake, not approved
  active content;
- model matrices, versioned experiments, pairwise comparisons, human annotation,
  production traces, and online evaluation are not implemented;
- Windows and macOS desktop applications are not implemented;
- autonomous CI repair and deployment remain owned by `dev-setup` and are not a
  verified PromptOS capability.

The product must display these states directly. It must not convert planned work
into implied capability.
