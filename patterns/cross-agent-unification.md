# Pattern: Cross-agent unification

One canonical contract, thin pointers per tool — never per-tool forks of the
rules. Fork drift is itself a documented failure mode.

## The stack

```
┌─────────────────────────────────────────────────┐
│  agent-kit/AGENTS.md  ← canonical law          │
├─────────────────────────────────────────────────┤
│  PROMPTOS/prompts/    ← reusable playbooks     │
├─────────────────────────────────────────────────┤
│  your-repo/agent/     ← project memory only    │
│    PROJECT_PROFILE.md (generated)              │
│    ERRORS.md · GAPS.md (append-only)           │
│    PROMPTS.md (pointer, not a copy)            │
└─────────────────────────────────────────────────┘
```

## Pointer files per host

| Host | Entry | Mechanism |
| --- | --- | --- |
| Codex CLI | `AGENTS.md` | Native read at repo root |
| Cursor | `.cursor/rules/*.mdc` + `AGENTS.md` | Always-applied rule → canonical |
| Claude Code | `CLAUDE.md` | `@AGENTS.md` import |
| Gemini CLI | `GEMINI.md` | Pointer text |
| Anything else | `AGENTS.md` | Paste or symlink |

## Install once per repo

```powershell
C:\Eagle\agent-kit\install.ps1 -Target "C:\path\to\repo"
C:\Eagle\PROMPTOS\install.ps1 -Target "C:\path\to\repo"
python agent\bootstrap.py
```

## Anti-pattern: copying prompts into every repo

Edit PROMPTOS once; all projects benefit. Per-repo copies rot within a week.
