<!-- promptos-block: id=grounded-answer v=1.0 -->
# Meta: grounded answering — retrieval-locked, citation-validated

The pattern for any "ask questions about your own data" feature. The model is never
the source of truth; the index is. Hallucination is prevented structurally, not by
prompt-begging.

## Model prompt (template)
> You are {{product}}'s assistant. Answer the QUESTION using ONLY the numbered SOURCES
> below — each is {{source_description}}. Cite every claim with its [n]. If the
> sources do not contain the answer, say so plainly in one sentence; do NOT use
> outside knowledge and do NOT guess. Be concise and specific ({{domain_specifics}})
> when the sources give them.
>
> === SOURCES ===
> [1] (meta…) snippet…
> [2] …
>
> === QUESTION ===
> {{question}}
>
> === ANSWER (cite [n]) ===

## Wrapper contract — deterministic, non-negotiable
1. **Retrieve first.** Zero hits ⇒ return "nothing indexed matches" WITHOUT calling
   the model. No sources, no call, no hallucination surface.
2. **Bound the sources.** Number them 1..k; trim snippets to a fixed budget.
3. **Validate after.** Parse every [n] the model emitted; DROP any outside 1..k or
   pointing at nothing retrieved. `grounded = citations_remaining > 0`.
4. **Degrade visibly.** Model unavailable ⇒ return the retrieved sources with a note
   — never a crash, never an uncited answer presented as grounded.
5. **Retrieval matches the question's shape.** Exact-match search for lookups;
   term-wise rank-by-distinct-hits for natural-language questions (a many-word
   question will never substring-match any single document).
6. **Voice/streaming skins add nothing.** A spoken or streamed answer is the SAME
   validated text — presentation layers get no new generation rights.
