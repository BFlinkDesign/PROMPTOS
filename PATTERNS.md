# PATTERNS.md — Architecture & behavior catalog

Domain-agnostic patterns for production agent systems. Pair with
[prompts/](prompts/) (paste-in blocks) and [agent-kit](https://github.com/BFlinkDesign/agent-kit) (operating law).

**Canonical home:** https://github.com/BFlinkDesign/PROMPTOS

---

## Architecture patterns

| Pattern | File | Use when |
| --- | --- | --- |
| Deterministic gated pipeline | [patterns/deterministic-pipeline.md](patterns/deterministic-pipeline.md) | Corpus → scoped deliverable |
| Verify gate (hard block) | [locked/01-VERIFY-LOOP.md](locked/01-VERIFY-LOOP.md) | Before any emit — now a locked module |
| Schema contracts | [patterns/schema-contracts.md](patterns/schema-contracts.md) | Multi-layer pipelines |
| Agent memory (ledgers) | [patterns/agent-memory.md](patterns/agent-memory.md) | Cross-session continuity |
| Cross-agent unification | [patterns/cross-agent-unification.md](patterns/cross-agent-unification.md) | Cursor + Claude + Codex + Gemini |
| Session hygiene | [patterns/session-hygiene.md](patterns/session-hygiene.md) | Windows, shares, IDE, tokens |
| Pain points catalog | [patterns/pain-points-catalog.md](patterns/pain-points-catalog.md) | "Why does this keep breaking?" |

## Playbooks (multi-step workflows)

| Playbook | File |
| --- | --- |
| Elite architecture pass | [playbooks/elite-architecture-pass.md](playbooks/elite-architecture-pass.md) |
| New project bootstrap | [playbooks/new-project-bootstrap.md](playbooks/new-project-bootstrap.md) |
| Field hardening pass | [playbooks/field-hardening-pass.md](playbooks/field-hardening-pass.md) |
| Agent OS (the one-page operating system) | [playbooks/agent-os.md](playbooks/agent-os.md) |

## Locked modules & behaviors

| Layer | File |
| --- | --- |
| Behavioral invariants (agents obey, never edit) | [locked/](locked/) — index: [locked/README.md](locked/README.md) |
| Parameterized operating contract | [behaviors/elite-engineering.md](behaviors/elite-engineering.md) |

## Efficiency

| Topic | File |
| --- | --- |
| Model-tier table + self-improvement loop | [efficiency/MODEL-TIERS.md](efficiency/MODEL-TIERS.md) |

## Glossary

| Topic | File |
| --- | --- |
| Plain language → industry terms | [glossary/TERMINOLOGY.md](glossary/TERMINOLOGY.md) |
