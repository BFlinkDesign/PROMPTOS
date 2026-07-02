# Token economy — stop paying twice for the same knowledge

Use when: sessions burn budget re-reading, re-deriving, and re-explaining. Paste at
session start or bake into the operating contract. The principle: **tokens are spent
once to LEARN something; after that it lives in an artifact, an index, or a gate —
never in re-derivation.**

---

Operate under these token-economy rules and call out when you apply one:

1. **Artifacts beat transcripts.** Anything worth more than one turn goes to a file:
   decisions → [STATE_DOC], vetting → `docs/*-vetting.md`, plans → task cards,
   session lessons → the doctrine file. The next session reads the artifact, not a
   500-turn history. If it only exists in chat, it evaporates at compaction.
2. **Index once, search forever.** Build the cheapest durable index that answers your
   recurring questions (full-text index over the corpus, a symbols map of the repo, a
   catalog of prompts/rules). Retrieval hits the index — never "re-read everything to
   find X."
3. **Retrieve before you generate.** Zero retrieved context ⇒ zero model call
   (structural hallucination prevention AND the cheapest call is the one not made).
4. **Don't re-verify the settled.** A gate that passed and is recorded with its output
   stays passed until the inputs change. Re-running the world's tests to "make sure"
   is budget burn; run the subset the diff touches, full gate at the checkpoint.
   Builders get targeted verification (their own tests); the full-suite gate runs
   once at integration — running everything everywhere doubles cost for no signal.
5. **Read narrow.** Open the 40 lines around the symbol, not the 2,000-line file.
   Fan out sub-searches to a cheaper context instead of pulling everything into the
   main one; bring back conclusions, not file dumps.
6. **Cache-shaped prompting.** Keep stable content (contracts, doctrine, schemas) at
   the top of context, identical across calls, so provider prompt-caching actually
   hits; put volatile content last. Don't reorder the stable block casually — every
   reorder is a cache miss you paid for.
7. **One writer per fact.** Duplicate explanations drift and double-bill. State facts
   in one home and point at it ([STATE_DOC], the runbook, the card) instead of
   restating.
8. **Compaction hygiene.** Before context runs long: checkpoint state to the artifact
   docs proactively, so a summary losing detail loses nothing load-bearing.
9. **Frontier bookends.** The cost shape that makes routing pay: frontier models are
   ~10–20% of tokens (kickoff plan + final review); workhorse volume is the rest.
10. **Parallelize independent slices** under one integrator. Slice by file-ownership
    to avoid merge collisions; shared files get region-disjoint edits or sequencing.
11. **Checkpoint commits in ephemeral environments** — losing verified work to a
    reclaimed container costs a full rebuild.
12. **Report the spend.** End substantial work with one line: what the expensive calls
    bought ("frontier: plan + final review; executor: T1–T3; utility: log triage").
    Unaccounted spend is how budgets die.
