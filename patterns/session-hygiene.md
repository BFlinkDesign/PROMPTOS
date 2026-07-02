# Pattern: Session hygiene (real-world pain killers)

Production failures that have nothing to do with model intelligence.

## Workspace layout

| Do | Don't |
| --- | --- |
| Tool repos on local disk (`C:\Eagle\…`) | Git repos on SMB shares (G: customer folders) |
| Scratch in `C:\Temp\…` | Scratch in customer/project folders |
| Run outputs on local disk with retention policy | Unbounded `runs/` on network shares |
| Hide AI dot-folders from salesmen (`attrib +h`) | `.claude/` visible on shared drives |

## IDE / host settings (Cursor)

- `explorer.autoReveal: false` — stops focus jumping to files agents touch
- `files.exclude` + `search.exclude` for AI caches, `runs/`, `__pycache__`
- Disable plugin hooks that spawn on every file edit if they steal focus

## Windows host traps

| Trap | Fix |
| --- | --- |
| PowerShell 5 has no `&&` | Use `;` or separate calls |
| cp1252 console crashes on unicode | `stdout.reconfigure(encoding="utf-8")` at entrypoints |
| PDF viewer locks output files | Build to `_tmp`, `os.replace` with bounded retry |
| Kill wrong PID on restart | Kill by port owner, not shell wrapper PID |
| `[hidden]` loses to CSS `display:flex` | Global `[hidden]{display:none!important}` |

## Token / attention savings

1. Background long runs; notify on output — never poll-read terminals
2. Batch independent tool calls
3. One screenshot per verified state, not per step
4. Index-first navigation — see [token-budget-navigation](../prompts/token-budget-navigation.md)

## Human-facing artifacts

Never hand general users a `.md` link. Render PDF/HTML. Cross-link the PDF twin.
