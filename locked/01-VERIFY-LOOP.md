# 01 — VERIFY LOOP · LOCKED

> **STATUS: LOCKED.** Agents may quote and obey this module and flag conflicts with it.
> Agents may never edit it in place. Amendments ship as human-reviewed PRs only.
> **Changelog:** v1 (2026-07) — distilled from the Eagle ERP dashboard build (10 routes,
> vision-gated at 390px). v1.1 (2026-07, consolidation PR) — absorbed the verify-gate
> pattern (trust ceiling, counts reporting, fresh-read discipline) and the
> integrator-gate rules; this module is now the single verification home.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `{{TYPECHECK_CMD}}` | Static gate, e.g. `npx tsc --noEmit`, `cargo check`, `mypy .` |
| `{{BUILD_CMD}}` | Production build, e.g. `npm run build` |
| `{{RUNTIME_PROBE}}` | How to boot + hit the real artifact (dev server + headless browser, binary + smoke test) |
| `{{SURFACES}}` | Enumerable list of routes/screens/endpoints to verify — every one, not a sample |
| `{{VIEWPORTS}}` | Widths/targets that must not break (e.g. 390px mobile) |

## The invariant

**"Done" is a claim that requires attached proof.** No agent reports completion on the
strength of having written code. Proof climbs a ladder; each rung gates the next.

## The ladder

1. **Static** — `{{TYPECHECK_CMD}}` exits 0. Catches the cheap 80%.
2. **Build** — `{{BUILD_CMD}}` exits 0. Dev-mode-only passes don't count.
3. **Runtime** — `{{RUNTIME_PROBE}}` boots the real artifact and exercises **every** item in
   `{{SURFACES}}`; zero console/page errors.
4. **Vision** — screenshot each surface at each `{{VIEWPORTS}}` width and *look at it*.
   Mechanical check alongside: horizontal overflow is `scrollWidth > clientWidth` on the
   document element — assert it is false. Layout bugs are invisible to every lower rung.
5. **Adversarial** — a *different* agent (or a fresh pass with an explicit skeptic prompt)
   tries to refute the "done" claim. Findings return to rung 1.

## Rules

1. **Fix-and-reclimb.** Any failure at rung N sends the work back through rungs 1..N. A fix
   verified only at the rung that failed routinely breaks a lower rung.
2. **Whole enumeration, no sampling.** Verify all of `{{SURFACES}}` every pass. The source build's
   worst regression hid on the one route a sampled pass skipped.
3. **Root-cause before re-fix.** If the same symptom survives two fixes, stop patching the
   symptom and find the mechanism (the 390px overflow survived three cosmetic fixes; the cause
   was min-content propagation in grid children — one `min-w-0`, everywhere, ended it).
4. **Self-sufficient auth.** If a gate needs a login/session the agent has standing
   authorization for, the agent performs it; blocking on "couldn't log in" is a failure.
5. **Proof travels with the claim.** Commit messages and reports state which rungs ran and
   their results ("tsc 0, build 0, 10/10 routes OK at 390px"). An unproved "verified" is
   treated as unverified.
6. **Tests ride with their code.** A test lands in the same commit as the code it guards;
   splitting them is how "verified locally" turns into red CI.
7. **Canaries from real failures.** Every field-reported bug becomes a regression test
   built from the *actual* offending data, not a synthetic approximation.
8. **Silence is not success.** A skipped test, an empty result, a monitor that only greps
   the happy path — all read as "fine" while broken. Make skips loud; watch failure
   signatures, not just success markers.
9. **Clean-room before diagnosing.** Before treating any build-output anomaly as real,
   clean the output dir and rebuild — long-lived environments accumulate stale artifacts
   that fake regressions.
10. **Merged ≠ live.** Deployment is a named step with its own gate; the ladder ends at
    the LIVE artifact, not the merged branch.

## Independence & the trust ceiling

- **Self-review caps at ASSERTED.** Only deterministic code execution or an independent
  channel earns VERIFIED. A grep the agent wrote for its own work is bookkeeping, not
  verification.
- **Gates are run by the integrator,** not just claimed by the builder — green means the
  machine said so.
- **Fresh-read discipline (the deterministic rung):** citations re-resolve on a fresh
  read, never from cached extraction; numbers are recomputed by executing code; every
  cross-reference resolves; every path/URL/image exists.
- **Cross-channel consistency:** the text channel agrees with the visual channel; source
  artifacts stay in sync (md ↔ html ↔ pdf ↔ deployed).
- **High stakes escalate:** a second tool/vendor or an explicit human queue.
- **Report counts, not vibes:** "356/356 citations", "13/13 schema checks" — failed
  checks report real output, never "looks good".

## Injection note (lower-tier models)

Give smaller models the ladder as a **literal checklist to fill in**, not a description:
they must output `RUNG n: PASS/FAIL <evidence>` lines. Refuse (orchestrator-side) any
completion report missing a rung line.
