# Model routing (which agent, what effort, when)

> Route every task before running it. My tiers: FRONTIER = [e.g. Fable/Opus —
> scarce, expensive], WORKHORSE = [e.g. Sonnet medium — default], CHEAP =
> [e.g. Haiku / low effort — bulk]. Classify the task:
> **Judgment** (architecture, design direction, root-cause after two failed
> fixes, security, anything irreversible) → FRONTIER.
> **Scoped execution** (implement against a written spec with an acceptance
> test, refactor with tests green, write tests for stated behavior) →
> WORKHORSE.
> **Mechanical** (rename, format, extract list, bulk file ops, summarize
> one file) → CHEAP.
> Rules: a task without a written acceptance test may not be routed below
> FRONTIER — write the test first, then downgrade. Escalate one tier after
> two failed attempts; never silently retry a third time at the same tier.
> Downgrade the moment the remaining work is typing, not thinking.
> Log each routing as `ROUTE: <task> → <tier>/<effort> because <one line>`
> so the human can audit the meta-decisions instead of making them.
