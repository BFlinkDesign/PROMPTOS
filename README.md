# PROMPTOS

Portable, tool-agnostic operating library for AI coding agents. One canonical
home for reusable prompts, workflows, playbooks, and runbooks — not copied into every repo.

Born from the EagleScope build day: scope pipeline, decision matrix,
design-first UI, adversarial review, and retrospective patterns extracted
from production work.

## Quick start

```powershell
# Browse locally
start C:\Eagle\PROMPTOS\console\promptos-console.html

# Or read the catalogs
notepad C:\Eagle\PROMPTOS\PROMPTS.md
notepad C:\Eagle\PROMPTOS\WORKFLOWS.md
notepad C:\Eagle\PROMPTOS\PLAYBOOKS.md
notepad C:\Eagle\PROMPTOS\RUNBOOKS.md
```

## Install pointer into a repo

```powershell
C:\Eagle\PROMPTOS\install.ps1 -Target "C:\path\to\your\repo"
```

This writes `agent/PROMPTS.md` as a **pointer** to this repo — it does not
copy prompt content. Edit prompts here once; every repo sees the update.

## Relationship to agent-kit

| Repo | Role |
| --- | --- |
| **agent-kit** | Operating contract (`AGENTS.md`), verify gates, trust tiers, bootstrap, per-project ledgers |
| **PROMPTOS** (this repo) | Reusable prompts, workflows, playbooks, and runbooks — the *what to ask / how to operate* library |
| **Your project repo** | Thin pointers + project-specific `agent/ERRORS.md` and `agent/GAPS.md` |

Install both:

```powershell
C:\Eagle\agent-kit\install.ps1 -Target "C:\path\to\repo"
C:\Eagle\PROMPTOS\install.ps1 -Target "C:\path\to\repo"
```

## Library types

| Type | Catalog | Use when |
| --- | --- | --- |
| Prompt | [PROMPTS.md](PROMPTS.md) | A reusable copy-paste instruction block is enough. |
| Workflow | [WORKFLOWS.md](WORKFLOWS.md) | The job has phases, gates, artifacts, and failure modes. |
| Playbook | [PLAYBOOKS.md](PLAYBOOKS.md) | The situation requires judgment, triage, or branching decisions. |
| Runbook | [RUNBOOKS.md](RUNBOOKS.md) | The operation is known and should be executed step by step. |

Catalogs are timestamped and sorted oldest to newest by `created_at`. Legacy entries with unknown timestamps remain marked `legacy-unknown` until backfilled.

## The prompts

| Block | Use when |
| --- | --- |
| Scope pipeline | Corpus extraction, bid scoping, spec/plan reconciliation |
| Decision matrix | Architecture or vendor choice with real tradeoffs |
| Design direction first | UI/UX before any code |
| Adversarial self-review | Pre-ship quality gate |
| Retrospective | Project pause, errors/gaps ledger update |
| DCC asset pipeline | AI-generated mesh cleanup to engine-ready asset pipeline |

## Adding a library artifact

1. Choose the correct type: prompt, workflow, playbook, or runbook.
2. Add YAML metadata with `created_at`, `updated_at`, `timezone`, `maturity`, `domain`, and `tags`.
3. Add the file under the correct folder.
4. Add a catalog row in oldest-to-newest order.
5. Commit. No per-repo copies to update.