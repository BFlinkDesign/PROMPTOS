# PromptOS Prompt Engine

A deterministic prompt-generation and prompt-improvement system with a bounded agent team, hidden holdouts, multi-objective search, regression evidence, and a hard release-claim gate.

This is not a single "improve this prompt" agent. The **skill is the invocation surface**; the implementation is a deterministic application service whose agent roles are constrained by code.

## Decision

Use this shape:

```text
PromptOS skill / CLI / HTTP API / browser UI
                    |
          deterministic orchestrator
                    |
 architect -> candidate engineer -> benchmark -> critic -> reviser
                    |                    |
              bounded search      independent judge
                    |
       hidden holdout + Pareto ranking + statistics
                    |
       report, provenance, and release claim gate
```

Why:

- A skill alone is prose and cannot prove downstream performance.
- One agent can generate or critique, but it self-grades and overfits easily.
- An unconstrained agent team adds coordination variance and cost.
- A deterministic orchestrator can use specialist agents while enforcing budgets, holdout isolation, reproducibility, and statistical release rules.

## Current implementation

- JavaScript ES modules on Node 24; no new runtime dependency.
- CLI, HTTP API, and browser UI.
- OpenAI-compatible provider adapter through native `fetch`.
- Deterministic heuristic provider for CI and offline smoke tests.
- Architect, generator, adversarial critic, reviser, target executor, independent judge, and release governor roles.
- Validation-guided iterative search inspired by reflective and Pareto prompt optimization.
- Hidden holdout isolation enforced by the orchestrator and tested.
- Pareto ranking over quality, robustness, critical failures, cost, latency, structural score, and prompt size.
- Paired bootstrap for one-run baseline comparison.
- Hierarchical bootstrap and cross-provider evidence requirements for independent campaign certification.
- Immutable hashes, ordered event logs, bounded model-call ledger, and secret redaction.

## Trust states

| State | Meaning |
| --- | --- |
| `FAILED` | No eligible candidate survived. |
| `BENCHMARKED` | Candidate was evaluated, but it did not clear the configured baseline gate. |
| `BASELINE-WIN` | One run beat the configured baseline under that run's policy. This is not an independent superiority claim. |
| `INDEPENDENTLY-BENCHMARKED-SUPERIOR` | A multi-run campaign cleared provider, model, suite, seed, holdout, robustness, provenance, cost, latency, and confidence gates. |

Only the campaign evaluator can emit the final state.

## Run

From the repository root:

```powershell
npm run prompt-engine:test
npm run prompt-engine:demo
npm run prompt-engine:serve
```

Then open `http://127.0.0.1:8787`.

Direct CLI:

```powershell
node prompt-engine/src/cli.mjs optimize prompt-engine/fixtures/request.json --provider heuristic
node prompt-engine/src/cli.mjs serve --provider heuristic --port 8787
node prompt-engine/src/cli.mjs campaign report-1.json report-2.json --policy prompt-engine/fixtures/campaign-policy.json
```

## Real model provider

The first real adapter targets an OpenAI-compatible `/chat/completions` endpoint so the core remains provider-neutral.

```powershell
$env:PROMPTOS_PROVIDER = "openai-compatible"
$env:PROMPTOS_MODEL_BASE_URL = "https://provider.example/v1"
$env:PROMPTOS_MODEL_NAME = "model-name"
$env:PROMPTOS_MODEL_API_KEY = "..."
node prompt-engine/src/cli.mjs optimize request.json --provider openai-compatible --out report.json
```

Do not commit keys. Provider identity, model, token counts, latency, and hashes are recorded; credentials are not.

## Request contract

Every optimization request must contain:

- an objective;
- a baseline prompt for `improve` mode;
- validation cases;
- concealed holdout cases;
- metric definitions;
- bounded search settings;
- constraints and claim policy.

Training and validation cases can guide candidate construction. Holdout content is not passed to architect, generator, critic, or reviser roles.

See [`fixtures/request.json`](fixtures/request.json).

## Anthropic baseline protocol

To benchmark against Anthropic's Prompt Improver:

1. Freeze the task brief, variables, examples, and original prompt.
2. Run those exact inputs through Anthropic's tool.
3. Save the returned prompt verbatim.
4. Record `vendor`, `tool`, `capturedAt`, `sourceHash`, and an evidence URI or archived screenshot reference.
5. Give the baseline the exact ID `anthropic-prompt-improver`.
6. Run it through the same target models, cases, seeds, token limits, and budgets as PromptOS candidates.

A sample manifest is in [`fixtures/anthropic-baseline.example.json`](fixtures/anthropic-baseline.example.json). The campaign gate rejects missing or malformed provenance.

## API

```text
GET  /health
GET  /
POST /v1/optimize
POST /v1/campaign/evaluate
```

The API is synchronous in this first slice. Long-running production campaigns should use a durable queue and artifact store while preserving the same domain contracts.

## Verification

```powershell
node --test prompt-engine/test/*.test.mjs
```

The suite covers:

- request validation and duplicate-case rejection;
- bounded agent orchestration;
- holdout non-disclosure;
- prompt perturbation behavior;
- Pareto ranking;
- provider request shape;
- paired and hierarchical bootstrap determinism;
- independent claim refusal and certification paths;
- HTTP health and static application delivery.

## Scientific position

The implementation does **not** claim to be better than Anthropic or any optimizer today. It implements the mechanism that can establish or falsify that claim. A valid claim requires the independent campaign contract in [`docs/BENCHMARK-CONTRACT.md`](docs/BENCHMARK-CONTRACT.md).
