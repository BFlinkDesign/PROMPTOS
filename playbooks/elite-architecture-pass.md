# Elite architecture pass (design a production agent system)

Use when: starting a new tool, pipeline, or agent workflow that must be
**production-grade** — not a demo script. Domain-agnostic.

---

> Design a production agent system for [DOMAIN / PROBLEM].
> CONSTRAINTS: [on-prem vs cloud, team size, non-technical users?, data sensitivity].
> OUTPUT: architecture doc + implementation sequence — no code yet.
>
> Cover these sections in order:
>
> 1. **Corpus & inputs** — what files/events enter, how they are hashed/classified,
>    what gets skip-ledgered, max size/depth bounds.
> 2. **Deterministic layers** — name each stage (ingest → … → emit), what schema
>    contract it consumes/produces, what can run without an LLM.
> 3. **LLM/VLM touchpoints** — exactly where neural models are allowed; what they
>    may NOT certify (drawings, scaled dims, OCR of degraded scans = UNTRUSTED).
> 4. **Verify gate** — what re-resolves on fresh read, what recomputes by code,
>    what hard-blocks emit. State pass/fail as counts.
> 5. **Trust tiers** — what earns VERIFIED vs ASSERTED vs DRAFT vs UNTRUSTED;
>    promotion rules; demotion triggers.
> 6. **Human surfaces** — what non-technical users see (no raw markdown, no
>    blank canvas, progressive disclosure, recoverability).
> 7. **Session hygiene** — where repos live, where scratch goes, retention policy,
>    Windows/host traps if applicable.
> 8. **Agent unification** — how Cursor + Claude + Codex + Gemini all read the
>    same contract (pointer files, not forks).
> 9. **Field hardening plan** — name 3 real messy corpora to test against before
>    calling v1 done.
> 10. **Build sequence** — ordered file list, each slice provable in ≤1 session,
>     with the proof command per slice.
>
> Decision matrix for any fork (local vs cloud, build vs buy, monolith vs layers):
> show arithmetic by code, not prose. End with one "proceed if…" sentence.
