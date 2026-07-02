# Pain points catalog (real-world agent failures)

Generalized from production agent sessions. When you hit one, append to
`agent/ERRORS.md` and check if a pattern already exists here.

| Symptom | Root cause class | Pattern / fix |
| --- | --- | --- |
| Agent re-walks entire repo every session | No mandatory index | [token-budget-navigation](../prompts/token-budget-navigation.md) |
| Qualification/cross-ref numbers drift | No FK validation at emit | [schema-contracts](schema-contracts.md) |
| Pipeline hangs silently on one file | Unbounded subprocess | Killable worker + wall-clock timeout + timeout ledger |
| "Green tests" but wrong business number | Verified consistency not value | Recompute by code; gate checks value |
| Merged code ≠ running server | Verified source not live artifact | Hit served page / endpoint after deploy |
| Agent fabricates missing data | No absence proof requirement | "Not found" must cite search performed |
| Same bug returns next session | No ledger / no promotion | [agent-memory](agent-memory.md) |
| Token burn on ceremony | Wrong scaffolding for tier | [MODEL-TIERS](../efficiency/MODEL-TIERS.md) |
| Focus jumps to hook.sh mid-typing | IDE autoReveal + plugin hooks | [session-hygiene](session-hygiene.md) |
| Salesmen see `.claude/` on share | Scratch in customer folder | Local tool repo + hidden attributes |
| Raw `.md` links in user UI | Wrong artifact format for audience | Render PDF/HTML for humans |
| Naive folder filter ranks wrong | Substring match without ranking | Prefix → word-boundary → substring |
| Git on network share is slow | Repo on SMB | `C:\Eagle\` local canonical clone |
| Unbounded `runs/` fills disk | No retention policy | Purge after N days; hash makes re-extract cheap |
| Drawing dims treated as verified | Same channel re-read | UNTRUSTED tier; promote only via shop measure |
| Agent copies prompts into repo | No pointer install | [cross-agent-unification](cross-agent-unification.md) |

## Add new entries

When a failure is not listed: one table row here (via PR to PROMPTOS) + one
line in the project's `ERRORS.md` (immediate, no waiting for PR).
