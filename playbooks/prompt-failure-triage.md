---
id: playbook.prompt-failure-triage
type: playbook
title: Prompt failure triage
summary: Determine whether an observed failure belongs to the prompt, context, model, tools, grader, data, or runtime before revising the artifact.
created_at: 2026-07-12T00:10:51-05:00
updated_at: 2026-07-12T00:10:51-05:00
maturity: draft
domain: Prompt engineering
tags: [prompt, failure, triage, graders, providers]
stage: learn
compatibility: [universal, claude, chatgpt, codex, gemini, grok]
enforcement: gated
---

# Prompt failure triage playbook

## Trigger

Use when [FAILED CASE] did not produce [EXPECTED OUTCOME].

## Decision tree

1. Reproduce with the exact prompt, input, model, tools, configuration, and environment.
2. If the expected outcome is ambiguous, repair the contract or grader before the prompt.
3. If required context was absent or stale, repair retrieval and provenance.
4. If a required tool failed or lacked permission, repair the tool path and rerun the unchanged prompt.
5. If the grader disagrees with authoritative evidence, quarantine the grader.
6. If provider variance causes the failure, test a native adapter without forking the canonical outcome contract.
7. Revise the prompt only when the failure remains attributable to its instruction or boundaries.
8. Run the complete regression suite before promotion.

## Evidence required

Bind the failed case to prompt, input, provider, model, tool, environment, grader, output, and authoritative expected-result hashes.

## Required output

Return the responsible layer, reproduced evidence, repair target, tests added, full-suite result, next checkpoint, and baseline fallback.

## Failure modes

- Rewriting a prompt to compensate for a broken tool.
- Trusting an LLM grader over deterministic authority.
- Overfitting one public case.
- Promoting a candidate that fixes one failure while regressing another domain.
