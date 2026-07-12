---
id: runbook.release-promptos-pages
type: runbook
title: Release PromptOS Pages
summary: Build, deploy, and live-verify the PromptOS GitHub Pages artifact against the exact merged commit and source fingerprint.
created_at: 2026-07-12T00:10:51-05:00
updated_at: 2026-07-12T00:10:51-05:00
maturity: draft
domain: PromptOS operations
tags: [pages, deployment, receipt, mobile, rollback]
stage: operate
compatibility: [universal]
enforcement: deterministic
---

# Release PromptOS Pages runbook

## Preconditions

- [MERGED COMMIT] passed required repository and security checks.
- [PAGES WORKFLOW] is enabled on `main`.
- [LIVE URL] and previous verified deployment are recorded.

## Procedure

1. Confirm `main` resolves to [MERGED COMMIT].
2. Run the repository-declared Pages workflow for that commit.
3. Verify build and deploy jobs completed successfully.
4. Fetch [LIVE URL] with a cache-busting commit query.
5. Confirm the embedded source fingerprint, artifact count, Generator, Evaluator, Improver, workflows, playbooks, and runbooks.
6. Exercise one desktop and one iPhone-sized workflow in headless browser tests.
7. Capture the workflow run, deployment URL, screenshot, live content checks, and rollback commit.

## Verification

The hosted response must be HTTP 200 and contain the exact tokens and source fingerprint produced from [MERGED COMMIT]. Source or workflow success alone is not deployment proof.

## Required output

Return the merged commit, Pages workflow run, deployment URL, HTTP result, embedded source fingerprint, desktop and iPhone workflow evidence, rollback commit, blockers, and next checkpoint.

## Rollback

Redeploy the previous verified Pages artifact or revert the merged commit through the repository control lane. Verify the restored live fingerprint and user workflow.

## Known failure

A merge performed with GitHub's workflow token may not trigger a second push workflow. The merge control lane must explicitly dispatch [PAGES WORKFLOW] and verify the resulting deployment receipt.
