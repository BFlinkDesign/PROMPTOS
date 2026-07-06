# Prompt Library Audit - 2026-07-06

## Scope

This audit ranks the current PromptOS prompt surfaces by quality and likely
effectiveness. It covers:

- `origin/main`
- open draft PR branches `feat/unified-agent-os`, `feat/telemetry-loop`, and
  `design/hardness-ladder`
- the un-PR'd `codex/ai-dcc-pipeline-prompt` branch
- the Desktop PromptOS console at
  `C:\Users\Brady.EAGLE\Desktop\promptos-console\promptos-console.html`

The audit does not claim measured model performance. It ranks structural
readiness: clear inputs, enforceable rules, output contracts, verification
language, risk handling, and fit for regression tests.

## Source Of Truth

- GitHub repository: `BFlinkDesign/PROMPTOS`
- Default branch at audit time: `origin/main` at `b9b51fe`
- Desktop console SHA256: `99DC8240A645181667DB55B1E0E654FD703B91FAAE9E46F634CB08DE64588ABC`
- Repo console SHA256: `99DC8240A645181667DB55B1E0E654FD703B91FAAE9E46F634CB08DE64588ABC`

Desktop and repo console files were byte-identical at audit time.

## Ranking

| Rank | Surface | Verdict | Rationale |
| --- | --- | --- | --- |
| 1 | PR #5, `feat/telemetry-loop` | Best effectiveness potential, but stacked | Adds receipts, eval cases, and harvest tooling. This is the strongest feedback loop, but it depends on PR #4 and should not merge first. |
| 2 | PR #4, `feat/unified-agent-os` | Best core operating system | Strongest reusable blocks: `locked/01-VERIFY-LOOP.md`, `behaviors/elite-engineering.md`, and `prompts/model-router.md`. Current GitHub state is conflicting, so it needs revision before merge. |
| 3 | `codex/ai-dcc-pipeline-prompt` | Strong domain workflow | `workflows/dcc-ai-asset-pipeline.md` is specific and useful. Needs eval fixtures, an artifact-type-aware console schema, and a rebase after PR #4 is resolved. |
| 4 | PR #3, `design/hardness-ladder` | Strong design proposal, weak merge shape | Good architecture thinking, but it is not an operational prompt. Extract into playbooks or locked behaviors before merging. |
| 5 | Console v2/v3/v4 plus Craft prompts | Strong catalog material | Most newer console prompt families have inputs, rules, summaries, and enforceable contracts. They are structurally ready for regression tests. |
| 6 | `origin/main` standalone prompts | Mixed | `adversarial-safety-red-team.md` and `session-alignment.md` are useful; older short prompts remain thin and need stronger output/gate contracts. |
| 7 | Console v1 prompts | Legacy quality | Many entries lack inputs, rules, enforceability, and usable summaries. Treat as backlog, not an elite-quality baseline. |
| 8 | PR #1 and PR #2 | Superseded unless selectively mined | PR #4 states it consolidates the direction. Do not merge #1 or #2 independently without deliberately recovering a specific file. |

## Console Findings

The console still has a prompt-only data model:

- hardcoded `DATA.prompts`
- loader requires `payload.prompts`
- state loops over `S.prompts`

That means PromptOS cannot cleanly represent workflows, playbooks, and runbooks
until the schema moves from `prompts[]` to a typed artifact collection such as
`items[]`.

Structural scan of the embedded console catalog:

- total prompt entries: 159
- missing `inputs`: 47
- missing `rules`: 50
- bad or empty `summary`: 50

Strongest domain families by structural readiness:

- Craft & Product Design
- Data & Analytics
- DevOps & Infrastructure
- Cybersecurity & IT
- Product Management
- Project Management
- Finance & Accounting
- Customer Success & Support
- Operations & Process
- Design & UX
- Engineering & Technical
- AI & Prompt Engineering
- Education & Training
- Verified Delivery
- Agentic Loops

Weakest domain families:

- Marketing
- Productivity
- Writing
- Business
- Sales
- Hiring
- Legal & Compliance
- Research & Analysis
- Personal Development
- Coding

Most weak families are legacy v1 entries. The common failure mode is not the
idea; it is that the prompt entry is a title plus a role replacement claim, not
a testable operating block.

## Open Source Evaluation Frameworks

| Use | Framework | Recommendation |
| --- | --- | --- |
| Frontier-style agent, coding, sandbox, tool, and multimodal evals | Inspect AI + Inspect Evals | Best north-star framework. It supports composable datasets, agents, tools, scorers, external agents, and sandboxed tool use. Inspect Evals includes serious benchmarks such as SWE-bench Verified, SWE-Lancer, PaperBench, SciCode, and CTF-style tasks. |
| Immediate PromptOS CI regression tests | promptfoo | Best practical first harness. It is declarative, local, CI-friendly, supports prompt/model comparisons, and includes red-team/security workflows. |
| Python unit-test style LLM app and agent evals | DeepEval | Good for pytest-like evaluation suites and trace-level scoring. |
| Model benchmark comparability | lm-evaluation-harness | Good for academic/model benchmark comparability; not the best primary harness for a prompt library. |

Recommended path: start PromptOS with `promptfoo` for low-friction regression
tests, then add Inspect AI for higher-end agentic workflow evals.

Source links checked during the audit:

- Inspect AI: <https://inspect.aisi.org.uk/>
- Inspect Evals: <https://github.com/UKGovernmentBEIS/inspect_evals>
- promptfoo: <https://github.com/promptfoo/promptfoo>
- DeepEval: <https://deepeval.com/docs/introduction>
- lm-evaluation-harness: <https://github.com/EleutherAI/lm-evaluation-harness>

## GitHub Follow-Up

Create or update issues for these tracks:

1. Resolve PR #4 conflicts and make it the canonical base for PromptOS expansion.
2. Keep PR #5 stacked behind #4 and merge only after #4 lands.
3. Upgrade the console data model from `prompts[]` to typed `items[]`.
4. Backfill created/updated timestamps from git history without inventing dates.
5. Add a prompt regression harness, starting with promptfoo and reserving Inspect
   AI for agent/workflow evals.
6. Rebase the DCC branch after PR #4, add eval fixtures, then open a draft PR.
7. Convert or quarantine weak legacy v1 console entries.

## Trust Tier

VERIFIED:

- GitHub branch and PR metadata were read live.
- The Desktop and repo console SHA256 values matched.
- The console embedded catalog was parsed and structurally counted.
- Open source framework facts were checked against primary project docs or
  GitHub repository pages.

ASSERTED:

- Quality and effectiveness rankings are expert judgment from structure and
  content, not measured prompt benchmark performance.

GAPS:

- No model-run evals were executed.
- PR #4 conflicts were not resolved in this audit branch.
- No GitHub issue labels or milestones existed at audit time.
