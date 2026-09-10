# Codex Handoff — Frontier Prompt Compiler V2

Status: IMPLEMENTATION HANDOFF
Date: 2026-07-12 America/Chicago
Target repository: `BFlinkDesign/PROMPTOS`
Branch: `architecture/frontier-prompt-compiler-v2`
Base observed at handoff: `ef58f79591aeb507c03a2b10ea53297360fe31bc`

## Mission

Advance PromptOS from a structurally governed prompt catalog/workbench into a repository-aware, evidence-backed Prompt Compiler that can transform rough intent into a versioned, testable, provider-aware execution artifact.

This handoff is an execution contract. Do not rewrite it into another generic prompt, framework, or planning essay. Inspect the current repository, preserve its accepted boundaries, then implement the smallest end-to-end slice that materially advances the product.

## Operator intent

The operator is not asking for a prettier prompt reformatter. The required product must:

1. understand the requested outcome, domain, repository, users, risks, and source-of-truth constraints;
2. inspect or consume repository-specific context before proposing architecture or instructions;
3. compile that context into a structured internal representation rather than concatenating prose;
4. generate materially distinct candidate strategies when a real decision exists;
5. evaluate candidates against explicit behavioral cases, deterministic vetoes, cost, latency, safety, and an accepted baseline;
6. preserve source, lineage, rejected alternatives, assumptions, evidence, and rollback;
7. output an executable repository-specific artifact, not another agnostic framework;
8. remain current through bounded read-only evidence adapters rather than owning general news/tool ingestion.

## Verified current repository reality

The following is directly supported by the current repository:

- PromptOS owns reusable prompts, workflows, playbooks, runbooks, their catalog, evaluator, schemas, receipts, and regression gates.
- PromptOS does not own autonomous developer-agent control, general news ingestion, tool discovery, or deployment control.
- `tools/scoring-core.mjs` provides deterministic structural parsing, generation, improvement, scoring, and receipt construction.
- `generatePrompt()` creates a fixed scaffold containing Objective, Inputs, Operating rules, Verification, Required output, and Failure handling.
- `improvePrompt()` only adds missing structural elements: title, inputs, verification, output contract, and boundaries.
- The current 0–100 result is structural lint only. It has no authority to claim correctness, effectiveness, maturity, safety, or release readiness.
- The shared React/TypeScript workbench plus framework-neutral Core direction is accepted. Electron is the accepted narrow desktop adapter, but no native desktop product is currently proven.
- The Prompt Engine branch remains unmerged and must not be rebased or imported wholesale. Its code may only be salvaged after the existing acceptance contract and a file-level salvage review.
- Default CI must remain deterministic and credential-free. Provider-backed evaluations belong in explicit credential-gated lanes.

## Problem statement

The current Generator and Improver are a valid minimum structural baseline, but they cannot produce the operator's intended outcome because they do not yet:

- model task intent semantically;
- ingest a target repository profile;
- distinguish governing domain from implementation domain;
- route evidence by authority and freshness;
- select prompt strategies by task type;
- generate and compare multiple candidate artifacts;
- run provider/model matrices;
- measure behavioral improvement against immutable baselines;
- learn from production failures beyond structural regression;
- manage prompt packages/modules as compiled dependencies;
- produce repo-specific architecture and implementation work from an agnostic executor.

## Product boundary

Preserve the existing ecosystem contract.

PromptOS should own:

- prompt artifact source and versions;
- semantic Prompt IR and compiler contracts;
- repository-context input contracts;
- strategy selection and candidate generation;
- evaluation datasets, graders, comparisons, receipts, release decisions, lineage, and retirement;
- the shared workbench and headless compiler/evaluator interfaces.

PromptOS should not own:

- continuous GitHub/Hugging Face/arXiv/news crawling;
- autonomous repository mutation or deployment;
- fleet credentials or standing secrets;
- a general AI operations cockpit.

Use read-only normalized evidence snapshots from `frontier-ai-radar`, `dev-setup`, repository manifests, official documentation exports, or user-provided evidence. PromptOS evaluates and compiles that evidence; it does not silently absorb those systems.

## Required architecture

Implement toward these boundaries, adjusting exact paths only when repository evidence requires it:

```text
artifact/repository/evidence inputs
              |
              v
       PromptOS Core Contracts
 schemas | Prompt IR | lineage | policies | receipts
              |
      +-------+---------+
      |                 |
      v                 v
Prompt Compiler     Evaluation Engine
parse/normalize     datasets/graders
context adapter     provider matrix
strategy planner    vetoes/baselines
candidate builder   cost/latency/safety
      |                 |
      +--------+--------+
               v
       Shared Workbench UI
 intake | context | compile | diff | compare | evidence
               |
       +-------+-------+
       |               |
    Browser        Electron adapter
   fallback       Windows/macOS later
```

### Prompt IR minimum contract

The first Prompt IR must be explicit, versioned, schema-validated, and provider-neutral. At minimum include:

- artifact ID and version;
- artifact type;
- user outcome;
- target task class;
- governing domain and authority boundaries;
- target repository identity and verified repository profile hash;
- actors/users/operators/approvers;
- available evidence references and trust labels;
- assumptions with budgets and expiration;
- required inputs and missing blockers;
- constraints and prohibited actions;
- risk class and human gates;
- selected strategy modules;
- output contract;
- verification contract;
- failure and rollback contract;
- provider/model compatibility requirements;
- lineage to source prompt, compiler version, modules, datasets, graders, and accepted baseline.

Do not make markdown the internal source of truth. Markdown remains an import/export and human-editing surface.

## Candidate strategy behavior

The compiler must not generate arbitrary variation for theater. It should produce multiple candidates only when distinct strategies are plausible.

Examples of legitimate strategy differences:

- deterministic-first vs model-assisted;
- plan-first vs direct bounded execution;
- retrieval-heavy vs repository-native source inspection;
- single-agent vs independent reviewer;
- synchronous workflow vs checkpointed background workflow;
- conservative migration vs bounded replacement.

Every candidate must state:

- why it exists;
- what evidence supports it;
- what assumptions it consumes;
- expected advantage;
- operational/security cost;
- reversibility;
- test plan;
- rejection criteria.

## Decision framework

Use the FAVORS dimensions as a candidate decision record, not as a substitute for hard gates:

- Fit to repository and real workflow — 25%
- Advantage over current baseline — 20%
- Verifiability and evidence quality — 20%
- Operational and security risk — 15%
- Reversibility and migration safety — 10%
- Sustainability and maintenance health — 10%

A failed deterministic veto always defeats the weighted score.

Minimum vetoes:

- unclear legal/license status;
- source or repository context missing for a repository-specific claim;
- no rollback for material mutation;
- no behavioral dataset for an effectiveness claim;
- unreproducible benchmark;
- hidden or unbounded credentials;
- authorization/security boundary unresolved;
- no measurable problem or expected benefit;
- model is final authority over money, safety, engineering, legal, regulatory, or irreversible action;
- operational complexity exceeds demonstrated value.

## Prompt Perfect black-box baseline

Treat Prompt Perfect as a user-visible benchmark, not as source code or authority.

Observed current public/product behavior as of this handoff:

- one-click or hotkey prompt rewriting;
- an output organized into clearer Goal, Context, Instructions, Output Format, and Constraints sections;
- prompt saving and library reuse;
- prompting feedback/rating;
- cross-tool/browser and ChatGPT-native surfaces;
- low-friction workflow with no required prompt-engineering syntax.

The current Prompt Perfect website is publicly reachable and markets active products. The operator separately reported that it was purchased and is being discontinued. That acquisition/discontinuation claim is not verified in the public sources inspected for this handoff and must remain `ASSUMED / REQUIRES SOURCE` until a primary announcement is captured.

Reverse-engineer only observable behavior and public contracts. Do not seek hidden prompts, proprietary code, private APIs, license bypasses, or confidential implementation details.

Prompt Perfect is the minimum user-experience baseline. PromptOS must exceed it through repository context, evidence, compilation, behavioral evaluation, lineage, provider comparison, and release governance.

See `docs/research/prompt-perfect-black-box-baseline-2026-07-12.md`.

## Implementation sequence

### Slice 0 — Refresh and collision check

Before edits:

```powershell
git status --short --branch
git fetch --prune origin
gh pr list --state open --json number,title,isDraft,headRefName,baseRefName,mergeable,url
git log -1 --oneline
npm ci
npm run verify
```

If the local Codex session has uncommitted work, do not overwrite it. Use a dedicated worktree for this branch or reconcile intentionally.

### Slice 1 — Prompt IR and compile receipt

Implement the smallest vertical slice:

1. Add schema for Prompt IR.
2. Add a pure parser/normalizer that converts the existing Generator form fields plus optional repository context into Prompt IR.
3. Add a deterministic renderer that emits the current markdown scaffold from Prompt IR without changing current behavior.
4. Add a compile receipt containing source hash, context hash, compiler version, modules, assumptions, blockers, and rendered artifact hash.
5. Add positive and negative tests.
6. Expose compile receipt and IR preview in the existing browser workbench without provider calls.

Acceptance:

- current Generator output remains reproducible from IR;
- identical inputs produce identical hashes;
- missing repository context cannot be represented as verified context;
- no DOM dependency enters Core;
- no provider credential is required;
- `npm run verify` remains green;
- the UI clearly says `deterministic compilation`, not `prompt effectiveness`.

### Slice 2 — Semantic compiler provider contract

Add a provider-neutral semantic compiler interface, but ship a deterministic/replay implementation first.

Required provider request:

- Prompt IR;
- repository profile/evidence references;
- allowed strategy modules;
- budget and timeout;
- requested candidate count;
- redaction policy.

Required provider response:

- normalized candidate IRs;
- rationale tied to evidence IDs;
- assumptions introduced;
- unresolved blockers;
- token/cost/latency/error metadata;
- provider/model/version/config ID;
- raw-response hash and normalized-output hash.

No provider may write repository files or declare release readiness.

### Slice 3 — Behavioral comparison

Add versioned cases that prove the compiler does more than structural padding.

Minimum case families:

- vague prompt requiring safe clarification or bounded assumptions;
- agnostic executor that must become repository-specific rather than reproduce itself;
- product-design prompt requiring materially distinct concept directions;
- high-risk prompt requiring authority gates;
- prompt with contradictory requirements;
- prompt where the correct action is to preserve the original because rewriting reduces fidelity;
- prompt where a smaller prompt beats a longer prompt on cost and behavior.

Compare:

- source prompt;
- current deterministic Improver candidate;
- Prompt Compiler candidate(s);
- accepted baseline.

Record behavior, safety, cost, latency, errors, and grader disagreements separately. Do not collapse vetoes into one score.

### Slice 4 — Frontier evidence adapter

Implement one read-only adapter contract for a normalized frontier-radar snapshot. Do not add general crawling to PromptOS.

The adapter must:

- validate schema and source hashes;
- preserve timestamps and authority tier;
- mark stale or contradictory evidence;
- expose evidence to compiler context by explicit selection;
- never auto-promote a library, model, dataset, paper, or architecture pattern.

### Slice 5 — Production failure learning

Extend the existing feedback loop so a real failed prompt run can retain:

- artifact/compiler/provider versions;
- repository/context hashes;
- input case;
- output and grader evidence;
- failure classification;
- accepted correction;
- promoted regression case;
- revalidation date.

## Workbench UX contract

The user flow must be intent-first and complexity-absorbing:

```text
state outcome -> attach/choose repository context -> review detected constraints
-> compile candidates -> compare evidence and tradeoffs -> select experiment
-> run bounded evaluation -> accept/watch/reject -> save version and receipt
```

Requirements:

- prefill known context;
- never force duplicate entry;
- show the normal path first;
- progressively disclose advanced provider, grader, cost, and strategy controls;
- preserve expert keyboard and batch workflows;
- expose source, assumptions, blockers, candidate differences, and rejected alternatives;
- never call a longer prompt “better” merely because it is longer or structurally complete;
- preserve the original prompt and make every accepted transformation diffable and reversible.

## Explicit non-goals for this PR family

Do not:

- create another agnostic master prompt as the deliverable;
- merge or rebase the stale Prompt Engine branch wholesale;
- replace the accepted product boundary;
- add Supabase, Sentry, Redis, queues, microservices, or vector databases without repository-specific need and an ADR;
- add live credentials to default CI;
- wrap the current monolithic HTML in Electron;
- claim semantic quality from structure lint;
- claim Prompt Perfect parity from a visual imitation;
- silently mutate prompt source or downstream repositories;
- make PromptOS own frontier crawling or autonomous deployment.

## Verification and evidence

For each slice, produce:

- exact files changed;
- schema/contract version;
- commands executed;
- test output;
- generated hashes/receipts;
- screenshots for user-visible behavior;
- negative/failure-path evidence;
- known limitations;
- rollback procedure;
- trust classification: VERIFIED, INFERRED, ASSUMED, RECOMMENDED.

Before any behavior-changing PR is marked ready:

```powershell
git diff --check
npm run verify
```

Provider-backed claims additionally require a reproducible credential-gated experiment receipt outside default CI.

## Definition of done for the first implementation PR

The first implementation PR is done only when:

1. Prompt IR exists as a versioned validated schema.
2. Existing Generator inputs compile deterministically into IR and render back to equivalent markdown.
3. A compile receipt binds source, context, compiler, modules, assumptions, blockers, and output hashes.
4. The browser workbench displays IR and receipt evidence without provider credentials.
5. Positive and negative tests prove repository context cannot be silently fabricated.
6. Existing Generator, Improver, Evaluator, catalog, feedback, and browser tests remain green.
7. Capability ledger and project-state documentation truthfully reflect the new narrow capability.
8. No semantic effectiveness or Prompt Perfect parity claim is made.
9. The next provider-backed experiment is specified but remains separately gated.

## Handoff response expected from Codex

Do not answer with a new framework. Return:

1. refreshed repository and branch state;
2. current implementation map for the files that will change;
3. conflicts with this contract, if any;
4. the bounded Slice 1 plan;
5. code, tests, and documentation changes;
6. exact verification results;
7. remaining blockers and the next checkpoint;
8. rollback instructions.

Use the repository's Outcome Governance Standard fields in the final report:

- Action
- Evidence
- Authority
- Blockers
- Next Checkpoint
- Fallback
