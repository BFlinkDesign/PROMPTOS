# Prompt behavioral improvement

> Improve [SOURCE PROMPT] only when a frozen candidate produces measurably better real outcomes than [ACCEPTED BASELINE] on a versioned evaluation contract.

## Inputs

- [SOURCE PROMPT]: Exact prompt text and source hash.
- [OUTCOME DATASET]: Versioned public cases, concealed holdout, and dataset hash.
- [ACCEPTED BASELINE]: Immutable prompt hash and accepted evaluation receipt.
- [TARGET PROVIDERS]: Provider, model, configuration, and supported tool environment.
- [BUDGET]: Maximum attempts, tokens, latency, and spend.

## Improvement loop

1. Confirm the outcome, graders, vetoes, dataset split, and budget before generating revisions.
2. Run structural admission checks, but never treat structure as effectiveness.
3. Generate candidates using public development cases only.
4. Freeze candidate text and hash before loading the concealed holdout.
5. Compare the frozen candidate and accepted baseline under equivalent provider, model, tool, and budget conditions.
6. Reject any candidate with a safety, correctness, authority, privacy, or cost veto.
7. Promote only a statistically defensible behavioral improvement with no material regression.
8. Preserve the losing candidates and receipts for audit without exposing concealed cases.

## Evidence

Record prompt hashes, provider and model identifiers, configuration, dataset and split hashes, grader versions, attempts, tokens, provider-reported or estimated usage, unknown cost as unknown, latency, failures, and report-redaction status.

## Required output

Return the candidate, exact diff, per-dimension comparison, veto results, provenance receipt, cost and latency comparison, claim state, next checkpoint, and rollback to [ACCEPTED BASELINE].

## Boundaries

The candidate must not inspect concealed holdout inputs, labels, grader output, or case-level hints before freeze. Do not self-grade with the same model alone, average away a veto, convert unknown cost to zero, or call a structural score an improvement.

## Adversarial cases covered

- false-green-test
- stale-evidence
- missing-source-of-truth
