---
id: workflow.prompt-development-release
type: workflow
title: Prompt development and release
summary: Move a prompt from an outcome contract through structural admission, behavioral comparison, concealed holdout, approval, and monitored release.
created_at: 2026-07-12T00:10:51-05:00
updated_at: 2026-07-12T00:10:51-05:00
maturity: draft
domain: Prompt engineering
tags: [prompt, evaluation, holdout, release, regression]
stage: deliver
compatibility: [universal, claude, chatgpt, codex, gemini, grok]
enforcement: gated
---

# Prompt development and release workflow

## Inputs

- [OUTCOME CONTRACT]
- [SOURCE PROMPT]
- [VERSIONED DATASET]
- [ACCEPTED BASELINE]
- [TARGET PROVIDERS]
- [BUDGET]

## Phases

1. Define the observable outcome, graders, vetoes, and failure consequences.
2. Admit structurally complete candidates; reject missing inputs, output contracts, verification, or boundaries.
3. Generate and revise against public development cases only.
4. Freeze candidate text, configuration, and hashes.
5. Load the concealed holdout and compare candidate versus baseline under equivalent conditions.
6. Run independent review, redaction, cost, latency, and provider-variance checks.
7. Release the winning immutable artifact with rollback and monitoring.
8. Promote real failures into future regression cases without leaking protected data.

## Gates

- No holdout access before freeze.
- No promotion from structural score alone.
- No averaged pass when a safety, correctness, authority, privacy, or budget veto fails.
- Unknown usage or cost remains unknown when parity is required.
- Every release claim binds to prompt, dataset, split, grader, provider, model, and receipt hashes.

## Required output

Return Action, Evidence, Authority, Blockers, Next checkpoint, Fallback, candidate-versus-baseline result, and permitted claim state.

## Failure handling

Keep the accepted baseline active. Preserve the failed candidate and redacted receipt, identify the failed dimension, and add or repair the smallest case or grader before another campaign.
