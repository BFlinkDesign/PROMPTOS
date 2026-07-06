# Workflows

Repeatable multi-phase pipelines with artifacts, gates, validation, and failure modes.

Workflows are broader than prompts. A workflow may reference one or more prompts, playbooks, or runbooks.

Sort order: oldest to newest by `created_at` ascending. Legacy entries with unknown timestamps sort before timestamped entries until backfilled.

## Catalog

| Created at | Updated at | Workflow | File | Use when |
| --- | --- | --- | --- | --- |
| 2026-07-06T00:38:04-05:00 | 2026-07-06T00:38:04-05:00 | DCC AI asset pipeline | [workflows/dcc-ai-asset-pipeline.md](workflows/dcc-ai-asset-pipeline.md) | Converting AI-generated 3D meshes into optimized engine-ready assets with Blender, Unity, Unreal, WebGL, AR/GLB, or similar pipelines. |

## Add a workflow

1. Add `workflows/your-workflow.md`.
2. Include YAML metadata: `id`, `type`, `title`, `created_at`, `updated_at`, `timezone`, `maturity`, `domain`, and `tags`.
3. Include purpose, trigger conditions, folder/artifact contract, phases, gates, failure modes, and required report.
4. Add a catalog row here in oldest-to-newest order.
5. Add linked prompts in `prompts/` only when the workflow needs a copy-paste execution block.