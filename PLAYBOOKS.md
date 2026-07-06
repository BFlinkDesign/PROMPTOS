# Playbooks

Strategic scenario-response patterns for situations that require judgment, branching, and tradeoff control.

Playbooks are not step-by-step runbooks. They are decision systems for recurring classes of problems.

Sort order: oldest to newest by `created_at` ascending. Legacy entries with unknown timestamps sort before timestamped entries until backfilled.

## Catalog

| Created at | Updated at | Playbook | File | Use when |
| --- | --- | --- | --- | --- |
| _none yet_ | _none yet_ | _Add first playbook_ | _TBD_ | _TBD_ |

## Add a playbook

1. Add `playbooks/your-playbook.md`.
2. Include YAML metadata: `id`, `type`, `title`, `created_at`, `updated_at`, `timezone`, `maturity`, `domain`, and `tags`.
3. Define trigger conditions, starting facts to collect, decision branches, recommended actions, escalation criteria, and failure modes.
4. Add a catalog row here in oldest-to-newest order.
5. Link supporting prompts, workflows, or runbooks when relevant.

## Minimum playbook sections

- Purpose
- Trigger conditions
- Initial fact capture
- Decision tree
- Recommended actions
- Escalation criteria
- Failure modes
- Evidence/reporting requirements