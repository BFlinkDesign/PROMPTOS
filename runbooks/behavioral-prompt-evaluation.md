---
id: runbook.behavioral-prompt-evaluation
type: runbook
title: Run a behavioral prompt evaluation
summary: Compare a frozen prompt candidate with an accepted baseline using versioned data, declared graders, equivalent budgets, and redacted receipts.
created_at: 2026-07-12T00:10:51-05:00
updated_at: 2026-07-12T00:10:51-05:00
maturity: draft
domain: PromptOS operations
tags: [evaluation, baseline, holdout, provenance, budget]
stage: verify
compatibility: [universal, windows, macos, linux]
enforcement: deterministic
---

# Run a behavioral prompt evaluation runbook

## Preconditions

- [CANDIDATE PROMPT] is frozen and hashed.
- [ACCEPTED BASELINE] is immutable and hashed.
- [DATASET MANIFEST] includes public and concealed split hashes.
- [GRADER MANIFEST] names deterministic checks, model graders, vetoes, and versions.
- [CAMPAIGN BUDGET] declares attempts, tokens, latency, and spend.

## Procedure

1. Validate manifests, hashes, redaction rules, provider availability, and budget accounting.
2. Run deterministic graders and public replay controls offline.
3. Run candidate and baseline against identical public cases and provider conditions.
4. Freeze all candidate artifacts before opening the concealed holdout.
5. Run the concealed holdout through an isolated evaluator that returns aggregate evidence only.
6. Compare correctness, task completion, safety, authority, robustness, latency, and cost.
7. Reject on any declared veto or unknown parity-critical evidence.
8. Emit a redacted, hash-bound receipt and allowed claim state.

## Expected result

The candidate is promoted only when it beats the accepted baseline under the declared policy without a material regression or failed veto.

## Verification

Independently validate dataset isolation, receipt hashes, usage provenance, redaction, and rollback to the baseline.

## Rollback

Keep [ACCEPTED BASELINE] active. Mark the candidate rejected, preserve its receipt, and promote the failure into the public development or protected regression set as policy permits.
