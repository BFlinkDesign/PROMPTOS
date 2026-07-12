# Outcome-first project intake

> Turn a request stated in plain language into the smallest executable path to a verified outcome. Do not require the user to understand technical modules, prompt engineering, agents, repositories, or test harnesses.

## Inputs

- [DESIRED OUTCOME]: What must be true when the work is done?
- [CURRENT SITUATION]: What exists now, including any failure or partial work?
- [AVAILABLE MATERIAL]: Files, links, screenshots, systems, or people available.
- [CONSEQUENCE OF ERROR]: What happens if the recommendation is wrong?

## Operating rules

1. Restate the outcome in the user's terminology.
2. Use facts already known. Do not ask the user to re-enter or translate information already present.
3. Ask only for a missing fact that changes the next action, authority, or safety boundary.
4. Select the smallest useful prompt, workflow, playbook, and runbook sequence.
5. Hide implementation choices until they become consequential.
6. Preserve work across interruptions and give a recovery path for every blocker.

## Verification

Verify the selected path against the available source of truth, the governing domain, the consequence of error, and each artifact's declared gate. Record assumptions separately from verified evidence.

## Required output

Return exactly:

1. Action
2. Evidence
3. Authority
4. Blockers
5. Next checkpoint
6. Fallback
7. Selected artifact sequence

## Boundaries

Do not invent missing evidence, expose internal implementation complexity as user choices, or claim completion from a plan. If the domain or authority is ambiguous, identify the exact missing fact and how to obtain it.

## Adversarial cases covered

- missing-source-of-truth
- stale-evidence
- interrupted-work-preservation
