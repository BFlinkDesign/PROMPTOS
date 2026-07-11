# PromptOS Evaluation Benchmark

Status: current capability baseline, not a product-ranking claim.

## Method

PromptOS is compared with capabilities documented by current official sources:

- [Promptfoo assertions and metrics](https://www.promptfoo.dev/docs/configuration/expected-outputs/)
  and [red teaming](https://www.promptfoo.dev/docs/red-team/quickstart/)
- [LangSmith offline and online evaluation](https://docs.langchain.com/langsmith/evaluation),
  [pairwise comparison](https://docs.langchain.com/langsmith/evaluate-pairwise),
  and [human evaluation](https://docs.langchain.com/langsmith/evaluation-concepts)
- [Braintrust immutable experiments](https://www.braintrust.dev/docs/evaluate/run-evaluations)
  and [scorers](https://www.braintrust.dev/docs/evaluate/write-scorers)
- [Inspect AI tasks, sandboxes, approvals, and limits](https://inspect.aisi.org.uk/tasks.html)
- [OpenAI Evals](https://platform.openai.com/docs/api-reference/evals/run-output-item-object?lang=node)
  and [graders](https://platform.openai.com/docs/api-reference/graders?api-mode=chat)
- [Tauri desktop distribution](https://v2.tauri.app/distribute/)

The machine-readable benchmark is
`benchmarks/premium-capability-baseline.json`. It contains 20 capability
criteria and deliberately avoids assigning marketing scores to competitors.

## Current Result

Run:

```powershell
npm run benchmark:platform
```

Current baseline:

- 3 verified criteria
- 3 partial criteria
- 14 missing criteria
- premium capability parity: **not proven**

The verified strengths are source provenance, deterministic structural lint,
and an offline local workbench. The largest blockers are behavioral datasets,
output graders, provider matrices, immutable experiments, pairwise comparison,
red teaming, bounded agent execution, cost/latency budgets, human annotation,
production traces, and desktop release lifecycle.

## Release Rule

PromptOS may claim a premium-grade evaluation baseline only when every criterion
is verified by its named gate. A weighted average cannot override a missing
security, correctness, reproducibility, or desktop-lifecycle criterion.

The adversarial structural-lint benchmark is separate:

```powershell
npm run benchmark:evaluator
```

The current run preserves two intentionally useless prompts that score 100/100.
This is a measured baseline defect, not a desired invariant. A future lint
improvement may lower those scores, but no structural score may become
user-facing readiness or effectiveness authority.
