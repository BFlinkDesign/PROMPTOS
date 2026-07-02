<!-- promptos-block: id=deep-procurement v=1.1 -->
# Deep procurement — find the hidden gems, fight the default bias

Use when: choosing a tool, library, model, vendor, or approach — and you suspect the
agent will hand you the same three famous answers it always does. Models are biased
toward what was popular in their training data; this block forces the sweep that
surfaces what's actually best NOW.

---

Research [DECISION] for [CONTEXT]. Rules of engagement:

1. **Name your bias first.** Before searching, write down the "default answer" you'd
   give from memory. That answer is now a HYPOTHESIS to beat, not the conclusion.
2. **Multi-modal sweep, not one search.** Cover ALL of: official docs/changelogs
   (what's GA *today*, not at training cutoff) · release/pricing pages (verify cost
   and license, don't recall them) · the ecosystem's own registries (package indexes,
   model hubs, awesome-lists) sorted by RECENT momentum not all-time stars · practitioner
   channels (issues, discussions, postmortems) for how it fails in production ·
   at least one "small/new/unfashionable" candidate that solves the problem
   differently.
3. **Hidden-gem quota:** the shortlist must contain ≥1 candidate you did NOT know
   before searching. If everything on the list was already in your head, the sweep
   failed — widen it.
4. **Disconfirming evidence quota:** for the leading candidate, find and quote the
   strongest criticism/failure report that exists. A recommendation with no known
   failure mode means you didn't look.
5. **Freshness gate:** for every load-bearing fact, note WHERE and WHEN it was
   verified. "As of [date] per [source]" or it's an assumption (route it to the
   [vetting-brief](vetting-brief.md) block).
6. **Fit beats fame.** Score against [MY_CONSTRAINTS] (budget, self-host vs cloud,
   license, existing stack, team skill) — not against general popularity. The famous
   tool that doesn't fit loses to the obscure one that does.
7. **Output:** a shortlist of 2–4 with one decisive criterion each, the hidden gem
   flagged as such, the disconfirming evidence quoted, and ONE recommendation with
   the single fact that would reverse it. Then hand the winner to the decision-matrix
   or [vetting-brief](vetting-brief.md) block before committing.
