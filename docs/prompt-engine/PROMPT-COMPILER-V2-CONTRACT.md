# Prompt Compiler V2 Contract

Status: PROPOSED NORMATIVE CONTRACT
Date: 2026-07-12 America/Chicago

## Outcome

Prompt Compiler V2 converts rough intent plus explicit context into a versioned, provider-neutral Prompt IR, one or more justified candidate artifacts, and reproducible evaluation receipts.

It is not a text beautifier, a longer-prompt generator, or an authority that can certify its own output.

## Core invariants

1. Repository-specific work requires repository-specific context.
2. Missing context is represented as missing, never inferred as verified.
3. Every transformation preserves the original source and produces a diff.
4. Markdown is a rendered artifact, not the canonical internal representation.
5. Deterministic vetoes run before weighted scoring.
6. Structural completeness is not behavioral effectiveness.
7. Provider/model output is evidence, not authority.
8. High-impact decisions require independent verification and declared human authority.
9. Every accepted artifact is reproducible from versioned source, context, compiler, modules, provider configuration, datasets, graders, and baseline.
10. Every accepted change is reversible.

## Compiler stages

```text
intake
  -> normalize
  -> repository/evidence context binding
  -> Prompt IR
  -> strategy planning
  -> candidate generation
  -> deterministic vetoes
  -> behavioral evaluation
  -> candidate comparison
  -> human/declared authority decision
  -> release receipt
```

## Input contract

The compiler accepts:

- raw source text;
- artifact type;
- requested outcome;
- target repository profile or explicit `none`;
- governing domain;
- target users/operators/approvers;
- source and evidence references;
- constraints and prohibited actions;
- risk class;
- cost, latency, and provider budgets;
- allowed strategy modules;
- requested output surface and format;
- evaluation case set and accepted baseline, when available.

## Repository profile contract

A repository profile is a versioned, hash-bound observation containing only inspected facts and labeled inferences. It should include:

- repository identity, ref, and commit SHA;
- purpose and domain;
- active product contract and source-order documents;
- stack, package managers, languages, frameworks, and runtime;
- architecture boundaries;
- user workflows;
- data, auth, integration, and deployment shape;
- tests and gates;
- open risks, caveats, and blocked capabilities;
- current library/tool versions where verified;
- source timestamp and profile generator version.

The compiler must reject any claim that a repository profile is current when its ref or hash does not match the target execution state.

## Prompt IR contract

Prompt IR is provider-neutral and schema-validated. It must support:

```text
identity
source
outcome
task_class
governing_domain
repository_context
actors
evidence
assumptions
inputs
constraints
prohibitions
risk_and_authority
strategy_modules
output_contract
verification_contract
failure_and_rollback
provider_requirements
lineage
```

### Evidence labels

Every evidence item uses one of:

- `OBSERVED` — directly read, executed, measured, or captured;
- `INFERRED` — derived from observed facts with reasoning recorded;
- `ASSUMED` — necessary but unverified condition consuming assumption budget;
- `RECOMMENDED` — proposed future-state decision.

### Assumption budget

The compiler must declare:

- maximum allowed assumptions by risk class;
- assumptions introduced by each candidate;
- expiration/revalidation condition;
- whether an assumption blocks execution or only lowers confidence.

No high-risk candidate may advance with a load-bearing assumption that lacks an explicit authority decision.

## Strategy modules

Strategies are versioned modules with declared applicability, conflicts, costs, and tests. Initial modules may include:

- repository-forensic-orientation;
- deterministic-first;
- retrieval-grounded;
- bounded-execution;
- independent-review;
- adversarial-red-team;
- migration-preserving;
- progressive-disclosure-product-design;
- evidence-led-decision;
- failure-recovery-first;
- full-stack-vertical-slice;
- release-and-rollback.

A module cannot be selected merely because it is popular or recently released. Selection must be tied to task class, repository facts, and expected value.

## Candidate contract

Each candidate contains:

- candidate ID and parent IR ID;
- selected strategy modules and versions;
- rendered artifact;
- evidence-linked rationale;
- introduced assumptions;
- expected advantage over baseline;
- security and operational cost;
- reversibility;
- known failure modes;
- evaluation plan;
- rejection criteria;
- provider/model/config metadata when model-generated.

Candidates must be materially distinct. Formatting-only variants are not separate strategies.

## Deterministic vetoes

A candidate is blocked when any applicable veto fails:

- required repository evidence absent or stale;
- required source/license unclear;
- prompt requests unauthorized or irreversible action without a gate;
- output contract conflicts with governing domain authority;
- no rollback for material mutation;
- secrets or standing credentials are requested unnecessarily;
- claimed benchmark cannot be reproduced;
- required behavioral dataset or grader is absent;
- output hides failed safety, correctness, or authorization checks behind an aggregate score;
- candidate duplicates the source without solving the stated problem;
- candidate transforms an execution framework into another framework instead of applying it.

## Evaluation contract

Evaluation layers remain separate:

1. Structure
2. Behavior
3. Regression
4. Safety
5. Operations
6. Repository fit
7. Human/authority decision

The compiler must record:

- case and dataset versions;
- grader types and versions;
- provider/model/configuration;
- output hashes;
- cost, tokens, latency, errors, and retries;
- deterministic veto results;
- grader disagreements;
- baseline comparison;
- accepted/rejected decision and authority.

A model grader may assist but cannot independently certify a high-impact result produced by the same model family/configuration.

## FAVORS comparison

After vetoes, candidates may be ranked by:

- Fit — 25
- Advantage — 20
- Verifiability — 20
- Operational/security risk — 15
- Reversibility — 10
- Sustainability — 10

The receipt must expose component values and evidence. Aggregate score is advisory and cannot mask vetoes.

## Provider contract

Provider implementations must be replaceable adapters. Core must not depend on a vendor SDK.

Every provider call requires:

- explicit model and configuration;
- timeout and cancellation;
- token/cost ceiling;
- retry ceiling;
- redaction policy;
- trace ID;
- immutable request hash;
- raw response hash;
- normalized response validation;
- error classification.

Default CI uses deterministic/replay providers only. Credentialed provider runs are opt-in and produce receipts outside the default offline gate.

## Workbench contract

The workbench should guide the user through:

1. state the outcome;
2. attach or select repository/evidence context;
3. review detected facts, assumptions, constraints, and blockers;
4. compile candidate strategies;
5. compare evidence, differences, risks, cost, and expected value;
6. run bounded evaluation;
7. accept, experiment, watch, reject, or retire;
8. save version, receipt, and regression case when appropriate.

Use task-oriented defaults and progressive disclosure. Preserve expert controls without forcing them on first use.

## Release states

- `draft`
- `structural-complete`
- `behaviorally-tested`
- `experiment-approved`
- `accepted-baseline`
- `superseded`
- `retired`

No state is inferred from prompt length or structural score.

## First vertical slice

The first implementation must remain deterministic:

- add Prompt IR schema;
- compile existing Generator fields plus optional repository profile into IR;
- render equivalent markdown;
- generate a hash-backed compile receipt;
- show IR and receipt in the existing workbench;
- preserve all current behavior and gates;
- add negative tests for fabricated repository context and stale hashes.

Provider-backed semantic optimization is a later, separately gated slice.

## Acceptance criteria

Prompt Compiler V2 cannot be represented as implemented until:

- a versioned IR schema and parser exist;
- source/context/compiler/output lineage is reproducible;
- current Generator output is rendered from IR;
- repository context truth labels are enforced;
- compile receipts are hash-backed;
- structural, behavioral, safety, operational, and fit layers remain distinct;
- browser and headless consumers use the same Core contracts;
- all existing PromptOS gates remain green;
- capability ledger truthfully records the narrow implemented state.
