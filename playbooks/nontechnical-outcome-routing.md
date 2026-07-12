---
id: playbook.nontechnical-outcome-routing
type: playbook
title: Nontechnical outcome routing
summary: Translate plain-language intent into the smallest governed artifact sequence while the system absorbs technical complexity.
created_at: 2026-07-12T00:10:51-05:00
updated_at: 2026-07-12T00:10:51-05:00
maturity: draft
domain: Product operations
tags: [intake, routing, nontechnical, outcomes, progressive-disclosure]
stage: align
compatibility: [universal]
enforcement: advisory
---

# Nontechnical outcome routing playbook

## Trigger

Use when [USER REQUEST] states a desired result but not the technical path.

## Routing decisions

1. Identify the governing domain and the observable finish condition.
2. Reuse facts already available; do not ask the user to translate implementation terms.
3. Ask one blocking question only when the answer changes authority, safety, cost, or the next action.
4. Select one primary workflow, then attach prompts for individual decisions and runbooks for deterministic operations.
5. Show the current action and next checkpoint. Keep advanced evidence available but collapsed.
6. Preserve progress when the user pauses, changes devices, or encounters a failure.

## Evidence required

Record the original request, interpreted outcome, governing domain, known facts, unresolved blockers, selected artifact IDs and hashes, and user-confirmed consequential decisions.

## Required output

Return the plain-language outcome, first action, selected artifact sequence, facts already known, one blocking question if required, next checkpoint, and fallback.

## Failure modes

- Exposing repository, schema, model, or provider choices before they matter.
- Asking the user to repeat information already present.
- Starting implementation before authority and consequence are known.
- Returning a menu when one safe default is available.
