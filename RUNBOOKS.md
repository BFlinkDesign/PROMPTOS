# Runbooks

Deterministic procedures for known operations.

Runbooks are for execution under pressure. They should remove ambiguity, list exact prerequisites, and end with verification.

Sort order: oldest to newest by `created_at` ascending. Legacy entries with unknown timestamps sort before timestamped entries until backfilled.

## Catalog

| Created at | Updated at | Runbook | File | Use when |
| --- | --- | --- | --- | --- |
| _none yet_ | _none yet_ | _Add first runbook_ | _TBD_ | _TBD_ |

## Add a runbook

1. Add `runbooks/your-runbook.md`.
2. Include YAML metadata: `id`, `type`, `title`, `created_at`, `updated_at`, `timezone`, `maturity`, `domain`, and `tags`.
3. Include prerequisites, exact steps, commands if applicable, expected output, verification, rollback, and failure handling.
4. Add a catalog row here in oldest-to-newest order.
5. Link any supporting prompt or workflow.

## Minimum runbook sections

- Purpose
- Preconditions
- Inputs
- Procedure
- Expected outputs
- Verification
- Rollback/recovery
- Known failure modes
- Owner/maintenance notes