---
id: workflow.repository-repair-release
type: workflow
title: Repository repair and release
summary: Reproduce a repository defect, implement the smallest durable repair, verify behavior, and release through evidence-bound gates.
created_at: 2026-07-11T23:47:33-05:00
updated_at: 2026-07-11T23:47:33-05:00
maturity: draft
domain: Software delivery
tags: [repository, repair, testing, release, rollback]
stage: deliver
compatibility: [universal, claude-code, codex, gemini-cli, grok-build]
enforcement: gated
---

# Repository repair and release workflow

## Inputs

- [REPOSITORY PATH]
- [TARGET BEHAVIOR]
- [GATE COMMAND]
- [DEPLOYMENT TARGET]

## Phases

1. **Orient:** verify repository identity, Git state, authority, and current runtime evidence.
2. **Reproduce:** exercise the defect before changing code and retain the failing observation.
3. **Repair:** implement the smallest durable change consistent with the current architecture.
4. **Verify:** run [GATE COMMAND], inspect the diff, and exercise the changed behavior.
5. **Review:** run an independent or deterministic regression check and resolve verified findings.
6. **Release:** merge through the repository control lane, deploy only with authority, and verify [DEPLOYMENT TARGET].

## Gates

- Preserve unrelated and uncommitted work.
- Do not claim completion when a required command was not run.
- Do not treat a merge, green source check, or deployment request as live behavior proof.
- Record commit, artifact hash, test result, deployment receipt, and rollback point.

## Required output

Return Action, Evidence, Authority, Blockers, Next checkpoint, Fallback, and the
trust state: VERIFIED, ASSERTED, DRAFT, or BLOCKED.

## Failure handling

If a gate fails, stop promotion, preserve evidence, return to the last verified
artifact, and identify the smallest next observation that can unblock work.
