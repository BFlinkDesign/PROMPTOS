# Locked modules — behavioral invariants

`00`–`04` are **LOCKED**: agents may quote them, obey them, and flag conflicts
with them — they may never edit them in place. Amendments ship as human-reviewed
PRs only; each module carries a changelog line per amendment.

| Module | Invariant it locks |
|---|---|
| [00-GROUND-TRUTH.md](00-GROUND-TRUTH.md) | No value without a receipt; dictionaries extracted verbatim; unknowns stay raw |
| [01-VERIFY-LOOP.md](01-VERIFY-LOOP.md) | The verification ladder; render-and-look; proof attached to every "done"; the trust ceiling |
| [02-DESIGN-DIRECTION-FIRST.md](02-DESIGN-DIRECTION-FIRST.md) | The studio design brief + acceptance criteria + quality floor |
| [03-ELITE-TEAM-ORCHESTRATION.md](03-ELITE-TEAM-ORCHESTRATION.md) | Multi-agent fan-out: strict file ownership, adversarial gates, orchestrator fix-pass |
| [04-LANE-AND-HYGIENE.md](04-LANE-AND-HYGIENE.md) | Repo lane discipline + the nothing-orphaned hygiene sweep |

All modules are **project-agnostic**: `{{PLACEHOLDERS}}` mark the only
project-specific inputs. They adapt to whatever repo they're mounted in because
they bind to *artifacts the repo itself provides* (its captured sources, its
validators, its gates) — never to a specific stack.

## Mounting matrix (works in any agent harness)

| Harness | Mount point |
|---|---|
| **Claude Code** | Reference from `CLAUDE.md` (or `AGENTS.md`): "Read and obey `locked/*.md` before acting." |
| **Codex** | Same line in `AGENTS.md` (Codex reads it natively). |
| **Cursor** | Copy each module to `.cursor/rules/<name>.mdc` with `alwaysApply: true` frontmatter. |
| **Gemini** | Reference from `GEMINI.md` / `.gemini/styleguide.md`. |
| **Any other LLM** | Prepend the `locked/*.md` contents to the system prompt, in numeric order. |

**Locked semantics:** an agent may quote these modules, obey them, and flag
conflicts — it may never edit them in place. If a rule seems wrong, the move is
a PR with the counter-incident, not a silent softening.

Relationship to [behaviors/elite-engineering.md](../behaviors/elite-engineering.md):
the behavior contract is the single binding "how I work" prompt; the locked
modules are the deep per-concern procedures it points into. Mount the contract
always; mount the modules the work touches.
