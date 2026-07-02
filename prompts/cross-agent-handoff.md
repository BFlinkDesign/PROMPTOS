# Cross-agent handoff (session continuity)

Use when: switching tools mid-project (Cursor → Claude Code → Codex) or
starting a fresh session that must not re-discover everything.

---

> Handoff into [REPO PATH]. I am continuing work started in another agent session.
>
> Read in order (do not skip):
> 1. `agent/PROJECT_PROFILE.md` — if stale, regenerate with `python agent/bootstrap.py`
> 2. `agent/GAPS.md`
> 3. Last [15] lines of `agent/ERRORS.md`
> 4. [PATH TO HANDOFF NOTE: PROGRESS.md / issue / PR description]
>
> Current state: [1–3 sentences — what works, what is blocked].
> Load-bearing unverified claims: [list anything ASSERTED but not re-checked].
> Next action: [exactly one slice with proof command].
>
> Rules: do not re-walk the repo tree. Do not re-debate architecture unless
> the handoff note says the design changed. Verify the LIVE artifact for
> anything you are about to build on top of.
