---
id: playbook.provider-aware-agent-delivery
type: playbook
title: Provider-aware agent delivery
summary: Select a native agent adapter without duplicating the canonical task contract or confusing model behavior with host capabilities.
created_at: 2026-07-11T23:47:33-05:00
updated_at: 2026-07-11T23:47:33-05:00
maturity: draft
domain: Agent operations
tags: [providers, adapters, portability, benchmarks, agents]
stage: decide
compatibility: [universal, claude, claude-code, chatgpt, codex, gemini, gemini-cli, grok, grok-build]
enforcement: advisory
---

# Provider-aware agent delivery playbook

## Trigger

Use when [TASK CONTRACT] may run in more than one chat product, coding agent,
model, or tool harness.

## Decision tree

1. If the task is plain conversation with no host tools, use the universal artifact.
2. If the host automatically loads repository instructions, generate a thin native adapter:
   - Claude Code: `CLAUDE.md`, skills, commands, subagents, or hooks.
   - Codex: `AGENTS.md`, skills, and repository instructions.
   - Gemini CLI: `GEMINI.md`, custom commands, and extensions.
   - Grok Build: `AGENTS.md`, skills, plugins, hooks, and MCP configuration.
3. If only wording differs, keep one artifact until a controlled provider comparison proves a meaningful regression.
4. If behavior differs, add a versioned adapter, dataset cases, cost and latency limits, and an explicit replacement boundary.

## Evidence required

Record the canonical artifact hash, adapter hash, host version, model identifier,
dataset and split hashes, grader version, usage provenance, and observed result.

## Escalation

Do not create a provider fork when the actual problem is missing tools,
permissions, context, or verification. Escalate when the host cannot represent a
required authority boundary or when repeated controlled runs show a regression.

## Required output

Return the selected canonical artifact, native adapter target, governing evidence,
benchmark dataset, unresolved compatibility blockers, and fallback adapter.

## Failure modes

- Hand-maintained provider copies drift.
- One model grades its own preferred wording.
- Tool availability is mistaken for model quality.
- A public-case improvement leaks into the concealed holdout.
