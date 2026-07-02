# 00 — GROUND TRUTH · LOCKED

> **STATUS: LOCKED.** Agents may quote and obey this module and flag conflicts with it.
> Agents may never edit it in place. Amendments ship as human-reviewed PRs only.
> **Changelog:** v1 (2026-07) — distilled from the Eagle ERP forensic-capture run.

## Placeholders (the only project-specific inputs)

| Placeholder | Meaning |
|---|---|
| `{{SOURCE_OF_TRUTH}}` | The captured artifact(s) facts must trace to — exported reports, recorded screens, schema dumps, API captures |
| `{{DICTIONARY_PATH}}` | Where verbatim code→label dictionaries live in the repo |
| `{{PROVENANCE_DOC}}` | The doc recording where each dictionary/value was extracted from |
| `{{CONTROL_TOTALS}}` | The reconciled headline numbers everything must sum back to |

## The invariant

**No value without a receipt.** Every figure, label, and mapping an agent surfaces must be
traceable to `{{SOURCE_OF_TRUTH}}`. If it can't be traced, it is displayed as raw/unknown —
never invented, never "probably means".

## Rules

1. **Extract, don't infer.** Code→label dictionaries are extracted **verbatim** from captured
   source artifacts (dropdown HTML, schema enums, exported lookup tables) into
   `{{DICTIONARY_PATH}}`. A plausible-sounding label an agent composed from the code's
   spelling is a defect, even if it later turns out correct.
2. **Unknowns stay raw.** A code with no captured mapping renders as the raw code (optionally
   tagged `unverified`). Hiding it, dropping it, or guessing it are all failures.
3. **Every dictionary carries provenance.** `{{PROVENANCE_DOC}}` records, per dictionary:
   the exact source artifact, capture date, extraction method, and row count. A dictionary
   without provenance is treated as a guess.
4. **Reconcile to control totals.** Derived aggregates (rollups, funnels, KPIs) must sum back
   to `{{CONTROL_TOTALS}}` before display. A number that doesn't reconcile gets no receipt
   affordance and must say so in-surface ("subset", "unreconciled") rather than imply
   completeness.
5. **Corrections cite sources.** When ground truth contradicts an earlier assumption, fix the
   assumption everywhere it propagated and record the correction in `{{PROVENANCE_DOC}}` —
   silent fixes leave stale copies alive.
6. **When unsure, re-read the repo — never guess.** The repo's captured artifacts outrank the
   agent's prior. If neither settles it, escalate to the human; do not pick the likelier answer.

## Failures this module caught (provenance)

- Three taxonomy labels were composed from code spelling (`ELMSTT`, `FFACE`, `LED`) and all
  three were wrong versus the captured dropdown HTML. Verbatim extraction replaced 100% of
  guessed labels.
- A "clean" audit opinion was silently over-scoped: it covered reconciled report rollups, not
  the 1:1 document population. Rule 4's "say subset in-surface" is that failure, generalized.

## Injection note (lower-tier models)

When mounting on a smaller/cheaper model, prepend this one line to its task prompt:
*"You may only state values you can point to in `{{SOURCE_OF_TRUTH}}` or
`{{DICTIONARY_PATH}}`; anything else must be output as `UNKNOWN(<raw>)`."*
Small models comply well with a hard output convention; they comply poorly with "be careful".
