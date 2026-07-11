---
name: prompt-engine
description: Generate, improve, benchmark, and release prompts through the PromptOS deterministic agent team. Use when prompt quality must be measured against downstream cases rather than judged by appearance.
---

# PromptOS Prompt Engine skill

## Use when

- creating a reusable production prompt from a task objective;
- improving an existing prompt using examples and measured failures;
- comparing a candidate against Anthropic Prompt Improver or another baseline;
- running a regression suite after a prompt change;
- preparing an evidence-backed release claim.

## Do not use when

- the user needs only a one-off informal rewrite;
- no success cases, rubric, or holdout can be defined and the output is low stakes;
- the task is unsafe or outside applicable policy.

## Invocation

1. Read `prompt-engine/README.md` and `prompt-engine/docs/BENCHMARK-CONTRACT.md`.
2. Create or update a request JSON using `prompt-engine/fixtures/request.json` as the contract example.
3. Keep training, validation, and holdout cases separate.
4. Run:

```text
node prompt-engine/src/cli.mjs optimize <request.json> --provider <provider> --out <report.json>
```

5. Inspect the winner, critical failures, perturbations, Pareto front, budget, and event log.
6. Treat `BASELINE-WIN` as local evidence only.
7. For an external superiority claim, collect run reports and run:

```text
node prompt-engine/src/cli.mjs campaign <reports...> --policy prompt-engine/fixtures/campaign-policy.json --out <campaign.json>
```

## Hard rules

- Never expose holdout inputs or labels to architect, generator, critic, or reviser roles.
- Never label a prompt superior from structural scoring, one model, one suite, or one seed.
- Never fabricate an Anthropic baseline. Capture the exact tool output and provenance.
- Never silently increase target-model or search budgets for one system.
- Never let an LLM assign the final trust state.
- Stop when the model-call ledger reaches its configured bound.
- Preserve raw reports, candidate hashes, provider/model identity, and campaign policy.

## Output

Return:

- selected prompt and strategy;
- downstream and robustness scores;
- critical failures;
- cost, latency, and model-call budget;
- baseline comparison with confidence interval;
- claim status and every blocking reason;
- paths to the run and campaign reports.
