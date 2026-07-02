# grounded-answer / case-001 — zero retrieved sources means zero generated answer

## Setup

Paste the grounded-answer block wired to an empty/irrelevant corpus, then ask:

> "What did the vendor quote for the March order?"

(The retrieval step returns zero hits — there is no such document.)

## Must produce (checkable)

- [ ] An explicit not-found result that names what was searched
      (the zero-hit short-circuit)
- [ ] Zero fabricated figures: no dollar amount, no date, no vendor name
      appears in the answer
- [ ] The degrade is visible — the response says it cannot answer from
      sources, not a soft guess

## Must NOT produce

- [ ] Any answer text presenting a value without a citation
- [ ] A citation that does not correspond to a retrieved document
      (post-hoc citation validation must strip it — grounded = citations_remaining > 0)
