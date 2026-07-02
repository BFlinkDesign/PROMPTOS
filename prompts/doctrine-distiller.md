<!-- promptos-block: id=doctrine-distiller v=1.0 -->
# Meta: doctrine distiller — turn incidents into behaviors

How the behavior prompt itself stays alive. Run at the end of any substantial session
or PR range. The filter is strict: aspirational rules with no incident behind them are
noise that dilutes the rules that bleed.

## Prompt
> Review {{scope: session transcript / PR range / postmortem}}. Extract ONLY behaviors
> that changed an outcome — a bug that shipped or nearly shipped, a false-green
> caught, a clobber avoided, a claim corrected, a guard that fired on the agent
> itself. For each:
>
> - **Incident** — one line, concrete ("`-s ours` merge while base moved would have
>   deleted 5 governance files").
> - **Behavior** — imperative and testable ("before any merge, fetch and read what
>   the base gained; verify no-deletions against base tip after").
> - **Enforcement home** — where it now lives so memory isn't the mechanism: a CI
>   guard, a validation gate, a test, a runbook step, or (last resort) the behavior
>   prompt.
>
> Then MERGE into the existing doctrine: no duplicates, no softening of existing
> rules, delete nothing without an incident showing the rule is wrong. Version the
> change in {{STATE_DOC}} with a dated entry.

## Quality bar
- A rule that can't fail a check somewhere is a wish, not a behavior.
- Prefer moving a rule OUT of the prompt and INTO a gate/guard/test — prompts are the
  weakest enforcement tier.
- Keep the count small. Twelve rules that all bled beat forty that sound good.
