# PromptOS library types

PromptOS is not only a prompt pile. It is a portable operating library for AI-assisted work.

Use four artifact types with different jobs:

| Type | Folder | Purpose | When to use |
| --- | --- | --- | --- |
| Prompt | `prompts/` | Reusable copy-paste instruction block | The agent needs a precise role, inputs, rules, and acceptance criteria for one task. |
| Workflow | `workflows/` | Multi-phase pipeline with artifacts, gates, and failure modes | The job repeats across projects and has ordered phases, outputs, and validation gates. |
| Playbook | `playbooks/` | Strategic response pattern for a class of scenarios | The situation requires judgment, branching, triage, or decision logic. |
| Runbook | `runbooks/` | Step-by-step operational procedure | The task is known, repeatable, and should be executed consistently under pressure. |

## Boundary rules

### Prompt

A prompt tells an agent what to do in one reusable invocation.

Examples:

- Design direction first.
- Adversarial self-review.
- DCC asset-pipeline execution prompt.

A prompt should include fill-in inputs, rules, and acceptance criteria.

### Workflow

A workflow defines the whole operating pipeline.

Examples:

- AI mesh to engine-ready asset.
- Bid corpus to trust-tiered scope deliverable.
- Design concept to production UI system.

A workflow should include phases, artifacts, gates, validation, failure modes, and final report requirements.

### Playbook

A playbook defines how to think and respond when the situation varies.

Examples:

- Repo rescue playbook.
- UI slop correction playbook.
- Vendor/tool selection playbook.
- Incident triage playbook.

A playbook should include trigger conditions, decision branches, recommended actions, escalation criteria, and tradeoff logic.

### Runbook

A runbook is a deterministic procedure for a known operation.

Examples:

- Run local validation.
- Cut a release.
- Rebuild the PromptOS console.
- Process one AI-generated model through Blender.

A runbook should include prerequisites, commands, exact steps, expected outputs, rollback, and verification.

## Console target

The PromptOS console should eventually expose all four types, with filtering by:

- type: prompt / workflow / playbook / runbook
- domain
- task
- toolchain
- enforcement level
- maturity: draft / tested / hardened / deprecated

Until the console data model is expanded, catalogs remain the source of truth.