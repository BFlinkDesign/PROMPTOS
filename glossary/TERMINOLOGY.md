# Terminology map (plain language → industry terms)

You do not need jargon to build elite agent systems. This map connects what
you are trying to say to what papers, vendors, and repos usually call it.

| What you mean | Industry terms | Where it lives here |
| --- | --- | --- |
| Rules every agent follows, any tool | **Agent harness**, **operating contract**, **system prompt layer** | [agent-kit](https://github.com/BFlinkDesign/agent-kit) `AGENTS.md` |
| Reusable "ask the agent this" blocks | **Prompt library**, **prompt patterns**, **meta-prompts** | `prompts/` in this repo |
| How to not burn tokens re-discovering repos | **Context engineering**, **mandatory indexing**, **repo profile** | [token-budget-navigation](../prompts/token-budget-navigation.md) |
| Opus vs Sonnet vs Haiku routing | **Model routing**, **capability tiering**, **scaffolding density** | [MODEL-TIERS](../efficiency/MODEL-TIERS.md) |
| "Prove it before you ship" | **Eval harness**, **verification gate**, **deterministic checks** | [verify loop](../locked/01-VERIFY-LOOP.md) |
| "Rules the agent can never break" | **Behavioral invariants**, **policy layer** | [locked modules](../locked/README.md) |
| "One prompt that sets how the agent works" | **System prompt template**, **operating doctrine** | [elite-engineering](../behaviors/elite-engineering.md) |
| VERIFIED / ASSERTED / DRAFT / UNTRUSTED | **Provenance**, **trust tiers**, **confidence labeling** | agent-kit `TRUST_TIERS.md` |
| ERRORS.md + GAPS.md across sessions | **Agent memory**, **episodic memory**, **failure ledger** | [agent-memory](../patterns/agent-memory.md) |
| Ingest → sweep → reconcile → gate → emit | **Deterministic pipeline**, **gated workflow**, **DAG with hard block** | [deterministic-pipeline](../patterns/deterministic-pipeline.md) |
| Typed dataclasses between steps | **Schema contracts**, **data contracts**, **interface boundaries** | [schema-contracts](../patterns/schema-contracts.md) |
| Same rules in Cursor + Claude + Codex | **Tool-agnostic unification**, **pointer files**, **single canonical source** | [cross-agent-unification](../patterns/cross-agent-unification.md) |
| Real messy files break the tool | **Field hardening**, **adversarial corpus testing**, **chaos testing** | [field-hardening](../playbooks/field-hardening-pass.md) |
| Session keeps forgetting and re-breaking | **Anti-decay**, **rule salience**, **hook re-injection** | agent-kit + Cursor rules |
| Agent writes scratch in customer folders | **Workspace hygiene**, **artifact isolation** | [session-hygiene](../patterns/session-hygiene.md) |
| "Make it production grade" architecture pass | **Architecture review**, **production readiness**, **elite architecture** | [elite-architecture-pass](../playbooks/elite-architecture-pass.md) |

## The stack in one sentence

**agent-kit** = the law. **PROMPTOS** = the playbook library. **Your repo** =
project memory + code. Every agent reads the law, pulls playbooks as needed,
and appends to project memory — regardless of vendor.
