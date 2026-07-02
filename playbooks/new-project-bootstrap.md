# New project bootstrap (agent-ready repo)

Use when: creating any new repo that agents will work in. Run once at init.

---

> Bootstrap [REPO NAME] at [PATH] for agent-assisted development.
>
> 1. Install the standard stack (no domain logic yet):
>    - agent-kit → operating contract, bootstrap, verify/trust docs, empty ledgers
>    - PROMPTOS → pointer only, not copied prompts
>    - Run `python agent/bootstrap.py` to generate PROJECT_PROFILE.md
> 2. Add pre-commit gate: compile/typecheck + repo selftest (even if selftest
>    is one trivial check on day one — the hook must exist).
> 3. Configure host hygiene:
>    - Scratch outside repo (`C:\Temp\…`)
>    - IDE excludes for AI caches and run outputs
>    - If Windows: UTF-8 at Python entrypoints; no `&&` in shell scripts
> 4. Create `.gitignore` for: runs/, uploads/, secrets, local scratch.
> 5. Write a 10-line README: what the repo does, how to run, how to test.
> 6. Append to agent/GAPS.md: top 3 risks you can already see.
>
> Do NOT add domain prompts to this repo — they live in PROMPTOS or a domain pack.
> Do NOT copy AGENTS.md content — install agent-kit pointer files only.
