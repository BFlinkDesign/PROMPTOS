# Prompt Engine architecture

## Architectural style

The Prompt Engine uses a hexagonal, event-recorded architecture:

- **Domain:** contracts, metrics, statistics, Pareto dominance, claim policy.
- **Application:** deterministic optimization orchestrator and campaign evaluator.
- **Ports:** model-provider interface, target-execution interface, judge interface.
- **Adapters:** heuristic/replay provider, OpenAI-compatible HTTP provider, CLI, HTTP server, browser application.

Agents never own orchestration, release status, budgets, dataset access, or trust labels. Those are code-owned responsibilities.

## Components

### 1. Contract boundary

`contracts.mjs` validates and normalizes every request before a model call occurs. It rejects:

- absent validation or holdout splits;
- duplicate case IDs across splits;
- unsupported metric types;
- improve requests without a baseline;
- unbounded or invalid search settings;
- missing expected outputs for deterministic metrics.

Normalized requests are frozen.

### 2. Deterministic orchestrator

`orchestrator.mjs` owns the state machine:

```text
VALIDATE
-> ARCHITECT
-> GENERATE POPULATION
-> VALIDATION EVALUATION
-> PARETO SELECT
-> CRITIQUE
-> REVISE
-> REPEAT WITH HARD GENERATION/CALL LIMITS
-> HOLDOUT FINALISTS
-> BASELINE COMPARISON
-> REPORT
```

The model cannot skip, reorder, extend, or relabel stages.

### 3. Bounded specialist team

| Role | Receives | Cannot receive | Output |
| --- | --- | --- | --- |
| Architect | objective, constraints, training examples | holdout cases | structured task specification |
| Candidate engineer | spec, baseline, training examples | holdout cases | diverse candidate population |
| Target executor | one rendered candidate and one case | other candidate scores | task response |
| Adversarial critic | validation failures and structure checks | holdout cases | causal diagnosis and repair plan |
| Reviser | one candidate, critic evidence, spec | holdout cases | one revised candidate |
| Independent judge | case, response, rubric | author identity and search history | score and evidence |
| Release governor | machine results only | free-form model opinion | trust state and claim decision |

The release governor is code, not an LLM.

### 4. Search

The first search implementation combines:

- diverse initial strategy generation;
- validation-error reflection;
- bounded iterative revision;
- deduplication by content hash;
- Pareto-front selection;
- final holdout evaluation.

The search intentionally borrows high-level ideas from MIPRO-style joint instruction/example optimization, GEPA-style textual reflection and Pareto evolution, PromptAgent-style strategic search, and PromptWizard-style critique/synthesis. It does not claim algorithmic identity with those systems.

### 5. Evaluation

Each candidate receives:

- downstream task score;
- perturbation robustness score;
- critical-case failure count;
- deterministic structural score;
- prompt length;
- token usage;
- cost;
- latency.

The system avoids collapsing every concern into one arbitrary scalar during search. Pareto ranks preserve real tradeoffs.

### 6. Evidence and provenance

Every run records:

- request hash;
- candidate hashes;
- evaluation hashes;
- provider/model identity;
- model-call budget consumption;
- ordered stage events;
- baseline provenance;
- holdout statistics;
- final trust state.

Secrets are redacted before reports are emitted.

### 7. Interfaces

- CLI for local automation and CI.
- HTTP API for application integration.
- Static browser UI served by the API process.
- Skill wrapper for agent-host discovery and safe invocation.

## Deployment progression

### Current

Single Node process, synchronous API, filesystem-supplied requests and reports.

### Production campaign service

```text
Browser / CLI / MCP / CI
        |
API gateway + auth
        |
Run coordinator
        |-------- durable queue
        |-------- immutable artifact store
        |-------- Postgres run metadata
        |-------- provider adapters
        |-------- isolated benchmark workers
        |-------- metrics/trace exporter
```

Recommended production controls:

- OIDC or service-token authentication;
- per-tenant provider credentials in a secret manager;
- queue-level idempotency key using request hash;
- immutable dataset and baseline artifacts;
- worker egress allowlists;
- provider rate limits and circuit breakers;
- OpenTelemetry traces with prompt bodies redacted by default;
- signed campaign reports;
- separate benchmark author and release approver roles.

## Failure modes

| Failure | Control |
| --- | --- |
| Candidate overfits validation | Holdout hidden in code, not merely by instruction. |
| Builder self-grades | Independent scorer/judge port and code-owned release gate. |
| Search runs indefinitely | Hard model-call and generation budgets. |
| One metric hides regressions | Pareto ranking plus critical-case hard failures. |
| Vendor baseline changes | Frozen prompt text, timestamp, hash, and evidence URI. |
| Lucky model/seed result | Cross-model, cross-provider, cross-seed campaign gate. |
| Benchmark contamination | Dataset hashes, split isolation, and public/private suite separation. |
| Cost win masks quality loss | Separate quality, cost, latency, and robustness requirements. |
| Prompt verbosity inflates apparent quality | Equal output budgets and prompt-size objective. |
| LLM judge preference bias | Deterministic metrics first; multi-judge or cross-provider judging for subjective tasks. |
