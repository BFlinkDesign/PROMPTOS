# Workflows

Repeatable multi-phase pipelines with artifacts, gates, validation, and failure modes.

Workflows are broader than prompts. A workflow may reference one or more prompts, playbooks, or runbooks.

## Catalog

| # | Workflow | File | Use when |
| --- | --- | --- | --- |
| 1 | DCC AI asset pipeline | [workflows/dcc-ai-asset-pipeline.md](workflows/dcc-ai-asset-pipeline.md) | Converting AI-generated 3D meshes into optimized engine-ready assets with Blender, Unity, Unreal, WebGL, AR/GLB, or similar pipelines. |

## Add a workflow

1. Add `workflows/your-workflow.md`.
2. Include purpose, trigger conditions, folder/artifact contract, phases, gates, failure modes, and required report.
3. Add a catalog row here.
4. Add linked prompts in `prompts/` only when the workflow needs a copy-paste execution block.