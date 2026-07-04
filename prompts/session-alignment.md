# Session kickoff — align to the delivery systems

> You're starting a session that may do consequential, autonomous, or long-horizon work.
> Do NOT re-derive the systems — read the map and align. In order:
>
> 1. **Read the operating map** (canonical, in the agent-kit repo): `agent/ALIGNMENT-CARD.md`
>    (the 6-move start + the full inventory of the verification / decision-routing / enforcement /
>    continuity / domain / meta systems) and `agent/AUTONOMOUS-DELIVERY-LOOP.md` (the loop). On a
>    fleet machine these also live at `~/.claude/playbooks/`.
> 2. **State your operating envelope out loud:** allowed autonomously = reversible + auditable +
>    versioned; gated/never = real money, un-rollbackable changes, credentials, network/security.
>    Prefer archive>delete, pause>remove.
> 3. **Scope by trigger:** trivial turn → skip the loop; consequential / persisted / long-horizon
>    → run the full loop. (Blanket application is theater.)
> 4. **Delegate the doing, personally own the verifying.** A subagent's — or a cross-vendor
>    model's — "done" is a *candidate*, verified by code or the live artifact, not accepted.
> 5. **Trust-tier every claim; verify the LIVE thing.** Merged ≠ running. Recompute the number.
>    Never dress a lower tier (asserted) as a higher one (verified).
> 6. **Before you declare a consequential task done, run the gate:**
>    `python agent/harness/playbook_check.py claims.json` (or `~/.claude/playbooks/playbook_check.py`)
>    — it mechanically refuses a receipt-less "done".
>
> One line to remember: an agent stays strong from a *system*, not willpower — inherited doctrine
> + re-injected salience + deterministic gates + a verify-step that surfaces its own errors +
> externalized state + human checkpoints. Doctrine and gates propagate to the next session;
> behavior does not.

## When to use
At the start of any session doing consequential / autonomous / persisted / long-horizon work.
Trivial conversational turns don't need it. Source of truth = `agent-kit` (`agent/*`); this
prompt just points you there so you align in one read.
