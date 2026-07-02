<!-- promptos-block: id=model-tier-adapter v=1.0 -->
# Model-tier adapter (inject frontier discipline into any model)

Use when: pointing a mid- or small-tier model (Sonnet-class, Haiku-class,
local) at work a frontier model (Fable/Opus-class) normally handles — or when
a frontier model is burning tokens on ceremony it doesn't need. Paste the
whole block; fill the brackets; delete the tiers that don't apply.

---

> MODEL TIER: [FRONTIER | MID | SMALL]. TASK: [1–3 sentences].
> REPO INDEX: [path to PROJECT_PROFILE.md / index file — REQUIRED, see
> token-budget-navigation block]. DONE MEANS: [observable outcome + how it
> will be verified].
>
> **All tiers (non-negotiable):**
> 1. Read the repo index FIRST. Do not walk the tree or open files the index
>    already answers.
> 2. Verify the VALUE, not consistency: arithmetic and derivations run as
>    code; a green test only proves code matches its source.
> 3. Verify the LIVE artifact: written/merged ≠ running/rendered. Re-read
>    the file, re-hit the endpoint, re-render the page after changing it.
> 4. Bound every loop: max attempts [N=3], then STOP and report the dead end
>    instead of retrying variations.
> 5. Never fabricate a value to fill a gap. Absence requires proof; report
>    "not found, here is what I searched" as a result.
>
> **If FRONTIER:** Skip ceremony. No restating the plan back to me, no
> per-step commentary. Plan internally, act, then report: what changed,
> proof it works, what you could not verify. Escalate judgment calls only
> when two constraints genuinely conflict.
>
> **If MID:** Before acting, list the files you will touch and the ONE test
> or command that proves success — three lines maximum, then proceed without
> waiting. Work in slices of [≤3 files / ≤150 lines] and run the proof
> command after each slice. If the proof fails twice on the same slice,
> stop and report rather than widening the change.
>
> **If SMALL:** Mechanical execution only. Follow this exact loop, no
> deviations, no redesign: (a) restate the target file and expected diff in
> one line; (b) apply the change; (c) run [exact command]; (d) paste its
> real output. If the command errors, revert and report — do not attempt a
> fix beyond [one] retry.
>
> Output contract for every tier: STATUS: complete|partial|blocked ·
> PROOF: [command + real output] · UNVERIFIED: [anything asserted without
> proof, or "none"].
