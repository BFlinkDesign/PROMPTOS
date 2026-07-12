# Review Pipeline Canary - 2026-07-11

## Purpose

This evidence-only change exercises the PromptOS autonomous review pipeline after
the issue #27 repair landed on `main`.

## Pass Contract

The canary passes only when the pipeline:

1. observes every versioned required check on the exact pull-request head SHA;
2. waits for a stable complete evidence set;
3. performs a SHA-bound squash merge without a direct operator merge;
4. verifies the resulting merge receipt before reporting `MERGED`; and
5. preserves the branch if its ref moves after evaluation.

The pull request, workflow run, sticky status comment, and merge commit are the
authoritative evidence. This file is the canary stimulus, not a self-certification.
