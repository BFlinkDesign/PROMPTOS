<!-- promptos-block: id=scope-pipeline v=1.0 -->
# Scope pipeline (corpus → trust-tiered deliverable)

> Run a deterministic scope pass on [CORPUS PATH] for [TRADE/DOMAIN].
> Method, in order, no skipping:
> 1. **Ingest & hash** every file (streamed SHA-256, collapse exact
>    duplicates, classify: spec / drawing / addendum / quote / other).
>    Ledger anything skipped by type.
> 2. **Sweep** every page for the anchor terms: [TERM LIST]. Include
>    negative controls for known false positives: [FP LIST]. Disposition
>    every hit — relevant, false positive, or RFI.
> 3. **Order addenda chronologically** and extract every mutation sentence
>    (REVISE/REPLACE/ADD/DELETE) touching the anchors. Latest supersedes.
> 4. **Reconcile** into scope items. Authority order: latest addendum >
>    drawings (for qty/location) > base spec > vendor quote.
> 5. **Verify gate:** re-resolve every citation on a fresh read; recompute
>    every number by code; hard-block emit on any failure.
> 6. **Emit** with trust tiers: quoted prices verbatim; drawing-derived
>    dimensions UNTRUSTED until shop-verified; conflicts become explicit
>    qualifications or RFIs, never silent choices.
