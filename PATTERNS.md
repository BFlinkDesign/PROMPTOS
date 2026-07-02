# PATTERNS.md — Architecture & behavior catalog

Domain-agnostic patterns for production agent systems. Pair with
[prompts/](prompts/) (paste-in blocks) and [agent-kit](https://github.com/BFlinkDesign/agent-kit) (operating law).

**Canonical home:** https://github.com/BFlinkDesign/PROMPTOS

---

## Architecture patterns

| Pattern | File | Use when |
| --- | --- | --- |
| Deterministic gated pipeline | [patterns/deterministic-pipeline.md](patterns/deterministic-pipeline.md) | Corpus → scoped deliverable |
| Verify gate (hard block) | [patterns/verify-gate.md](patterns/verify-gate.md) | Before any emit |
| Schema contracts | [patterns/schema-contracts.md](patterns/schema-contracts.md) | Multi-layer pipelines |
| Agent memory (ledgers) | [patterns/agent-memory.md](patterns/agent-memory.md) | Cross-session continuity |
| Cross-agent unification | [patterns/cross-agent-unification.md](patterns/cross-agent-unification.md) | Cursor + Claude + Codex + Gemini |
| Session hygiene | [patterns/session-hygiene.md](patterns/session-hygiene.md) | Windows, shares, IDE, tokens |
| Pain points catalog | [patterns/pain-points-catalog.md](patterns/pain-points-catalog.md) | "Why does this keep breaking?" |
| Human experience standard | [patterns/experience-standard.md](patterns/experience-standard.md) | Any UI humans touch (11 criteria) |
| Experience resources | [patterns/experience-resources.md](patterns/experience-resources.md) | WCAG, Playwright, libs, HF pointers |
| Promotion loop | [patterns/promotion-loop.md](patterns/promotion-loop.md) | Repeat failure → upstream PR |

## Playbooks (multi-step workflows)

| Playbook | File |
| --- | --- |
| Elite architecture pass | [playbooks/elite-architecture-pass.md](playbooks/elite-architecture-pass.md) |
| New project bootstrap | [playbooks/new-project-bootstrap.md](playbooks/new-project-bootstrap.md) |
| Field hardening pass | [playbooks/field-hardening-pass.md](playbooks/field-hardening-pass.md) |
| Instantiate DESIGN-BRIEF | [playbooks/instantiate-design-brief.md](playbooks/instantiate-design-brief.md) |

## Efficiency

| Topic | File |
| --- | --- |
| Model-tier table + self-improvement loop | [efficiency/MODEL-TIERS.md](efficiency/MODEL-TIERS.md) |

## Glossary

| Topic | File |
| --- | --- |
| Plain language → industry terms | [glossary/TERMINOLOGY.md](glossary/TERMINOLOGY.md) |
