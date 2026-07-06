# PROMPTOS

Portable, tool-agnostic prompt library for AI coding agents. One canonical
home for reusable prompt blocks — not copied into every repo.

Born from the EagleScope build day: scope pipeline, decision matrix,
design-first UI, adversarial review, and retrospective patterns extracted
from production work.

## Quick start

```powershell
# Browse locally
start C:\Eagle\PROMPTOS\console\promptos-console.html

# Or read the catalog
notepad C:\Eagle\PROMPTOS\PROMPTS.md
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
| **PROMPTOS** (this repo) | Reusable prompt blocks — the *what to ask* library |
| **Your project repo** | Thin pointers + project-specific `agent/ERRORS.md` and `agent/GAPS.md` |

Install both:

```powershell
C:\Eagle\agent-kit\install.ps1 -Target "C:\path\to\repo"
C:\Eagle\PROMPTOS\install.ps1 -Target "C:\path\to\repo"
```

## The prompts

| Block | Use when |
| --- | --- |
| Scope pipeline | Corpus extraction, bid scoping, spec/plan reconciliation |
| Decision matrix | Architecture or vendor choice with real tradeoffs |
| Design direction first | UI/UX before any code |
| Adversarial self-review | Pre-ship quality gate |
| Retrospective | Project pause, errors/gaps ledger update |

## Audits

- [Prompt library audit - 2026-07-06](audits/prompt-library-audit-2026-07-06.md)

## Adding a prompt

1. Add `prompts/your-block.md` with the fill-in-the-bracket template.
2. Add a row to `PROMPTS.md` catalog.
3. Commit. No per-repo copies to update.
