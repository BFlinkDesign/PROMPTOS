<!-- promptos-block: id=task-cards v=1.0 -->
# Meta: task-card generator — executor-proof work units

Use when handing work to a weaker/cheaper executor (a medium-effort model, a junior,
a future you). The card is the contract; if it needs judgment, it isn't finished.

## Prompt
> Generate a task card for: **{{goal}}**, to be executed by {{executor}} with ZERO
> judgment calls. Emit exactly these sections:
>
> - **Goal** — one sentence, observably true or false when done.
> - **Why** — the failure class this prevents, quantified where possible.
> - **Files** — every file touched, with what changes in each.
> - **Steps** — mechanical order; each step verifiable before the next.
> - **Acceptance** — the PROOF command (`{{GATE_COMMAND}}`) plus 2–3 assertions a
>   reviewer can check without reading the diff.
> - **Effort** — S / M (anything larger: split the card).
> - **Risk** — the ONE most likely way this goes wrong, and the guardrail.
>
> If any step requires a decision not derivable from the repo or this card, STOP and
> emit the open question for {{OWNER}} instead of a card.

## Plan-level wrapper
Order cards by dependency, not excitement. Put hard guardrails (never-touch list,
no-new-deps, schema-change protocol) ABOVE the cards. Fence host-only / owner-only
work into its own list the executor must not start. Mark spikes "report-only: the
deliverable is a number, not a feature."
