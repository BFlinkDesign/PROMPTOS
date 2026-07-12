# PromptOS library types

| Type | Purpose | Required proof |
| --- | --- | --- |
| Prompt | One reusable instruction contract | Structure gate plus behavioral cases |
| Workflow | Ordered multi-phase delivery pipeline | Phase artifacts, gates, resumability, failure paths |
| Playbook | Branching response strategy | Decision cases, escalation cases, tradeoff evidence |
| Runbook | Deterministic operating procedure | Exact steps, expected results, rollback, live verification |

Every non-legacy artifact uses YAML front matter with `id`, `type`, `title`,
`summary`, `created_at`, `updated_at`, `maturity`, `domain`, `tags`, `stage`,
`compatibility`, and `enforcement`.

Compatibility describes packaging targets, not separate truth. `universal` is
the default. Create provider-specific adapters only when the host requires a
different instruction surface or behavioral evaluation proves a divergence.
