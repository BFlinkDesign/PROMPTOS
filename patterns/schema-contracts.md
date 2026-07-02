# Pattern: Schema contracts between pipeline layers

When a multi-step pipeline passes JSON/dicts between layers, **schema
contracts** prevent silent corruption — the class of bug where qualification
#2 in prose points at #3 in the data.

## Rules

1. Every inter-layer payload is a typed structure (dataclass, Pydantic model,
   TypeScript interface — match your stack).
2. Validation runs at **write time** and again at the **verify gate**.
3. Foreign keys are explicit lists validated against a known set.
4. Invalid data raises — never coerces to a default.

## Minimum fields per record type

| Record | Must carry |
| --- | --- |
| File | path, sha256, class, page_count |
| Hit | file_id, page (1-based), anchor, disposition |
| Evidence | file_id, page, verbatim_quote, tier |
| Scope item | id, tier, evidence_ids[] |
| Output line | line_id, action, qual_refs[] (validated FK) |

## Self-test pattern

Ship a `selftest.py` that constructs valid records AND provably invalid ones,
asserting each invalid case raises. Run before every commit. Cheap; catches
pointer drift and schema regressions.

## When to skip

Single-file scripts with no pipeline stages do not need this. The moment you
have Layer N → Layer N+1, you need contracts.
