# 02 — DESIGN DIRECTION FIRST · LOCKED

> **STATUS: LOCKED.** Agents may quote and obey this module and flag conflicts with it.
> Agents may never edit it in place. Amendments ship as human-reviewed PRs only.
> **Changelog:** v1 (2026-07) — distilled from the Eagle ERP "Receipt" design system
> (studio-lead brief → tokens → 10 surfaces, vision-gated).

## Placeholders

| Placeholder | Meaning |
|---|---|
| `{{BRAND_TOKENS}}` | The project's color/typography tokens file (single source; no ad-hoc hex) |
| `{{TYPEFACE}}` | The one licensed/variable typeface the product speaks in |
| `{{SIGNATURE_AFFORDANCE}}` | The one interaction the product is remembered by (Eagle's: "The Receipt" — tap any number, see its provenance) |
| `{{USER_VERB}}` | What the primary user is actually doing (deciding, triaging, estimating) |

## The invariant

**Direction before pixels.** No UI work starts until a written design direction exists:
who the user is, what `{{USER_VERB}}` they perform, the emotional register, the
`{{SIGNATURE_AFFORDANCE}}`, and the quality floor below. Building first and styling later
produces template output that no amount of polish rescues.

## Acceptance criteria (all 8, every surface)

1. **Tokens only.** Every color/space/type value resolves to `{{BRAND_TOKENS}}`. Ad-hoc hex
   or one-off font weights are defects.
2. **Surfaces, not borders.** Depth via background layers and shadow, not 1px gray boxes.
3. **One voice.** `{{TYPEFACE}}` with a deliberate display/strong/body scale; no accidental
   weight soup.
4. **Honest numbers.** Figures carry the `{{SIGNATURE_AFFORDANCE}}` only where they reconcile
   to source; unreconciled figures say so in-surface (see module 00).
5. **Touch-real.** Interactive targets ≥ 44px; the smallest viewport in scope renders with
   zero horizontal scroll.
6. **Motion with restraint.** One easing curve project-wide; every animation honors
   `prefers-reduced-motion`; motion communicates state change, never decoration.
7. **Data-ink discipline.** Charts: single hue for nominal series, an ordinal ramp for ordered
   ones, thin rounded marks, at most one axis; validate ramps with the project's palette
   validator when present.
8. **Keyboard/focus parity.** Visible focus ring everywhere; nothing reachable only by pointer.

## Banned slop

Emoji as icons · gradient-on-everything · gray-border card grids · centered-hero + three-cards
template pages · fake data presented as real · placeholder lorem in shipped surfaces ·
"AI sparkle" badges on non-model output.

## The quality floor & the Chanel rule

Ship nothing you wouldn't put in a portfolio. Before calling a surface done, **remove one
thing** — the element the layout survives without. If nothing can be removed, the surface
was actually finished; that is rare.

## Injection note (lower-tier models)

Smaller models drift toward template output under open prompts. Mount this module as their
**system prompt suffix** and additionally hand each one a *file-scoped* brief: the tokens
file path, the 8 criteria verbatim, and 2–3 concrete before/after examples from the repo.
Never ask a small model to "match the design system" by inference — point at the artifact.
