# Independent benchmark contract

## Claim under test

> Under equal task inputs, target models, token ceilings, execution budgets, datasets, perturbations, and scoring rules, does PromptOS generate or improve prompts that outperform Anthropic's Prompt Improver and other declared baselines on unseen downstream task performance without unacceptable cost, latency, robustness, or critical-case regressions?

The answer is `UNPROVEN` until the campaign gate passes.

## Why structural scoring is insufficient

A prompt can look well organized and still reduce task accuracy. The deterministic structural score is a development diagnostic only. Release decisions are dominated by downstream behavior on concealed data.

Anthropic documents its improver as a four-stage process involving example identification, structured drafting, reasoning refinement, and example enhancement. That is a baseline design reference, not independent evidence of superiority:

- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-tools

Prompt optimization research demonstrates that measured search can outperform manual or simpler prompting, including DSPy/MIPRO, PromptAgent, PromptWizard, and GEPA:

- DSPy: https://arxiv.org/abs/2310.03714
- MIPRO: https://arxiv.org/abs/2406.11695
- PromptAgent: https://arxiv.org/abs/2310.16427
- PromptWizard: https://arxiv.org/abs/2405.18369
- GEPA: https://arxiv.org/abs/2507.19457
- PromptBench: https://arxiv.org/abs/2312.07910

The Prompt Engine uses these as design inputs. It must still establish its own results.

## Required baselines

At minimum:

1. raw user prompt;
2. Anthropic Prompt Improver output;
3. expert-written prompt where available;
4. one open optimization baseline, preferably DSPy MIPROv2 or GEPA;
5. ablations of PromptOS with reflection, examples, or Pareto selection disabled.

Every baseline must be frozen and hashed before target-model evaluation.

## Baseline provenance

Anthropic baseline manifests require:

```json
{
  "id": "anthropic-prompt-improver",
  "prompt": "verbatim output",
  "provenance": {
    "vendor": "Anthropic",
    "tool": "prompt-improver",
    "capturedAt": "2026-07-11T12:00:00Z",
    "sourceHash": "sha256-of-verbatim-output",
    "evidenceUri": "immutable archive or screenshot reference",
    "inputBundleHash": "sha256-of-original-prompt-examples-feedback"
  }
}
```

The same original prompt, feedback, examples, and variables must be supplied to each prompt-generation system where their interfaces permit it. Interface differences are documented, not silently normalized.

## Dataset design

Use both public and private suites.

### Public independent suites

Recommended coverage:

- instruction following and format adherence;
- reasoning tasks such as BIG-Bench Hard subsets;
- robustness and adversarial prompt variation through PromptBench-style perturbations;
- classification, extraction, summarization, grounded QA, tool selection, and structured output;
- agentic tasks where success can be verified from traces and environment state.

Do not optimize directly against public test labels. Public datasets should be pinned by version and hash.

### Private suites

Include real PromptOS workloads and failures:

- high-stakes decision matrices;
- corpus scoping;
- design direction;
- adversarial review;
- DCC asset-pipeline planning;
- prior production misses promoted from feedback.

A private holdout owner must remain separate from prompt authors for the final campaign.

## Split policy

For every suite:

- training: examples and prompt construction;
- validation: search feedback and candidate selection;
- holdout: final evaluation only;
- audit holdout: optional second concealed set held by another operator.

The optimizer never receives holdout inputs, labels, rubrics, aggregate errors, or per-case feedback before the final candidate set is frozen.

## Equal-budget policy

Comparisons use the same:

- target model and version;
- system/user message placement where technically possible;
- temperature and seed policy;
- maximum input and output tokens;
- tool availability;
- retrieval context;
- timeout and retry policy;
- number of target executions per case;
- judge model and rubric;
- monetary or rollout search budget.

Report both **quality at equal cost** and **cost at equal quality**. A system may not buy a win through an undisclosed larger search budget.

## Campaign matrix

Default minimum certification matrix:

- 9 completed reports;
- at least 2 provider organizations;
- at least 3 provider/model combinations;
- at least 3 benchmark suites;
- at least 3 seeds;
- at least 300 paired holdout cases;
- paired perturbation evidence;
- at least 75% run-level win rate.

A stronger publication-grade campaign should target more tasks, models, and cases.

## Metrics

Primary:

- exact or deterministic task success where possible;
- validated structured-output correctness;
- environment or tool-trace success for agents;
- rubric score only when deterministic scoring is impossible.

Secondary:

- adversarial and perturbation robustness;
- critical-case failures;
- latency;
- total tokens;
- dollar cost;
- prompt length;
- variance across seeds and models.

Judge-based metrics must use blinded candidate identity and preferably a judge provider different from the builder provider. Judge calibration cases and agreement statistics are required for publication-grade results.

## Statistics

Single-run development comparisons use paired bootstrap confidence intervals over cases.

Independent campaigns use hierarchical bootstrap:

1. sample runs/suites/models with replacement;
2. sample paired cases within each sampled run;
3. calculate the mean candidate-minus-baseline delta;
4. repeat under a fixed declared seed;
5. report the observed delta and confidence interval.

Certification requires the lower confidence bound to exceed the declared minimum gain, not merely a positive point estimate.

## Hard failure conditions

The campaign remains `UNPROVEN` if any of these occur:

- baseline provenance is missing;
- case pairing is incomplete;
- holdout contamination is detected;
- critical failures increase;
- robustness confidence falls below policy;
- provider/model/suite/seed diversity is below policy;
- the cost or latency ratio exceeds policy;
- the confidence lower bound does not clear the minimum gain;
- benchmark code, data, or reports cannot be reproduced from pinned artifacts.

## Claim language

Allowed before campaign pass:

- "The system beat the configured baseline in this run."
- "The implementation is benchmark-ready."
- "The result is measured on the named suite and model."

Prohibited before campaign pass:

- "best prompt improver"
- "better than Anthropic"
- "state of the art"
- "independently validated"

Allowed after a valid pass:

> PromptOS outperformed the frozen Anthropic Prompt Improver baseline under the published campaign policy, datasets, models, budgets, metrics, and confidence interval dated [DATE].

The claim must link the signed campaign report and retain its scope limitations.
