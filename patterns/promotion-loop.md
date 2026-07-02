# Promotion loop (upstream learnings)

When the same failure or gap appears **twice** in a project repo — or a fix is
clearly **domain-agnostic** — promote upward instead of copying law into the
project.

## Home-lane rule (paste at session start)

> You are working in the project home lane only: code and project ledgers here.
> Read law from agent-kit and playbooks from PROMPTOS by pointer. At session end,
> append ERRORS/GAPS for failures; if a pattern appears twice or is clearly
> domain-agnostic, emit a PROMOTION_CANDIDATE block naming the target repo — do
> not copy upstream content into this repo.

## PROMOTION_CANDIDATE block (session end)

```markdown
## PROMOTION_CANDIDATE

- **Target repo:** PROMPTOS | agent-kit | dev-setup
- **Target path:** patterns/foo.md (proposed)
- **Evidence:** ERRORS.md lines / GAPS.md item / two session IDs
- **One-line fix:** what to add or change upstream
- **Domain leak check:** yes — no project names, paths, or trade YAML
```

Human opens PR on target repo. Project keeps a one-line pointer in GAPS until
merged — never a full copy of upstream text.

## Targets

| Content type | Promote to |
| --- | --- |
| Reusable prompt block | PROMPTOS `prompts/` |
| Architecture / UX pattern | PROMPTOS `patterns/` |
| Operating law change | agent-kit |
| Install / radar / autonomy | dev-setup |
