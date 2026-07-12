---
id: workflow.desktop-app-delivery
type: workflow
title: Desktop application delivery
summary: Deliver a Windows or macOS desktop application through architecture, native behavior, packaging, signing, accessibility, update, and rollback gates.
created_at: 2026-07-12T00:10:51-05:00
updated_at: 2026-07-12T00:10:51-05:00
maturity: draft
domain: Desktop applications
tags: [windows, macos, desktop, packaging, release]
stage: deliver
compatibility: [universal, windows, macos]
enforcement: gated
---

# Desktop application delivery workflow

## Inputs

- [PRODUCT OUTCOME]
- [REPOSITORY ROOT]
- [TARGET PLATFORMS]
- [APPROVED ARCHITECTURE]
- [RELEASE CHANNEL]

## Phases

1. Verify the product contract, local-runtime needs, target OS versions, and framework decision.
2. Keep domain logic independent from the desktop shell and renderer.
3. Implement one complete user outcome with native window, menu, shortcut, file, permission, and failure behavior.
4. Build and run on real Windows and macOS target hosts or approved hosted runners.
5. Test keyboard, screen reader, scaling, reduced motion, resizing, offline behavior, crash recovery, and data preservation.
6. Produce signed Windows packages and hardened, signed, notarized macOS artifacts.
7. Test update, rollback, clean-host installation, uninstall, and retained user data.
8. Release through a staged channel and verify the installed artifact.

## Gates

- Source parsing is not a native build.
- A web render is not proof of desktop behavior.
- Windows requires package signature and install evidence.
- macOS requires hardened runtime, entitlements, notarization, and Gatekeeper evidence.
- Unsupported target-host checks are BLOCKED or N/A with cited authority, never silently skipped.

## Required output

Return per-platform artifacts, target-host commands, observed behavior, accessibility evidence, signing and notarization receipts, rollback result, blockers, and next checkpoint.

## Failure handling

Hold the last signed release. Quarantine the candidate, preserve logs and crash artifacts, and return to the smallest failed platform gate without changing shared domain behavior unnecessarily.
