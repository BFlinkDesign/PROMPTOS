# Legacy Console Catalog Intake

This directory preserves the complete embedded catalog from Git commit
`787f021c3` without promoting it into the active source-backed catalog.

Verified inventory:

- 159 records
- 31 domains
- 38 records with empty summaries
- 47 records with no declared inputs
- 50 records with empty rules
- 50 records marked `enforceable: false`

`catalog.json` is an intake artifact. Its records are not approved prompts and
must not appear as active or hardened solely because they existed in a previous
console. Promotion requires a tracked source artifact, current schema metadata,
versioned behavioral cases, declared graders, and comparison with an accepted
baseline.

Run `npm run capabilities:validate` to verify the record and domain counts.
