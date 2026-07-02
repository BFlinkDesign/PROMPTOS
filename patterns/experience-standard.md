# Pattern: Human experience standard (domain-agnostic)

**Applies to:** any UI humans touch — PWAs, dashboards, CLI wrappers with TUI,
PDF/HTML reports, installer wizards.

**Does not apply to:** headless pipelines, JSONL artifacts, agent-only markdown
(converts those to PDF/HTML before humans see them).

This is **layer A** (interaction law). **Layer B** (visual identity) lives in each
project's `docs/DESIGN-BRIEF.md`. **Layer C** (proof) requires camera/screenshot
gates — see [experience-resources.md](experience-resources.md).

Derived from production criteria; instantiated examples:
[dsm-jobs DESIGN-BRIEF](https://github.com/BFlinkDesign/dsm-jobs/blob/main/docs/DESIGN-BRIEF.md),
[EagleScope DESIGN-BRIEF](https://github.com/BFlinkDesign/EagleScope/blob/main/docs/DESIGN-BRIEF.md).

---

## Eleven acceptance criteria

Each item is pass/fail against a **live screenshot**, not a design doc.

1. **Progressive disclosure.** Summary first; detail on demand. Advanced options
   collapsed by default. No walls of controls on first paint.

2. **Direct manipulation with immediate feedback.** Acting on a thing shows
   the result instantly — live previews, not Apply-then-wait.

3. **Anticipatory design.** Every empty state, error, and zero-result offers a
   **specific tappable next step** from real state — never a dead end.

4. **Recoverability.** Destructive or customizing actions have undo or
   reset-to-default. Exploring must feel safe.

5. **Low cognitive load.** Hierarchy through type weight and spacing, not boxes
   on boxes. **One accent** carries emphasis; status badges have deliberate rank.

6. **Microinteractions.** Pressed states; transitions 150–250 ms; transform/opacity
   only; honor `prefers-reduced-motion`.

7. **Just-in-time guidance.** Teach inline at first relevance; dismissible;
   never a forced tour. Sensitive actions get plain-language trust microcopy.

8. **Kill the blank canvas.** Empty views offer 3–4 starting intents from **real
   state** — never canned "Welcome, user" or generic examples.

9. **Warm re-entry.** Return visits acknowledge what changed from real data
   ("3 new items since yesterday") — never generic greetings.

10. **Glanceable ambient status.** Sync, progress, freshness as quiet persistent
    indicators — not modal spam, not toast storms.

11. **Continuity over reloads.** Skeletons/streaming over spinners; transitions
    preserve orientation — things move where they're going, they don't blink out.

---

## Quality floor (all human UI)

- WCAG **2.2 AA** contrast including muted text ([quick ref](https://www.w3.org/WAI/WCAG22/quickref/))
- **44×44 px** minimum touch targets; visible `:focus-visible`
- Works at **390 px** width (phone-first or phone-safe)
- Human deliverables: **PDF/HTML**, not raw `.md` links
- Before ship: screenshot main views → walk all 11 criteria → **remove one decorative thing**

## Banned slop (default)

Generic dark-mode violet accent, decorative gradients, emoji as UI chrome,
"Welcome, user", spinners where skeletons fit, tooltips that repeat the label,
placeholder copy pretending to be data.

Projects may add bans in their DESIGN-BRIEF (identity-specific).

---

## Ecosystem wiring

| Layer | File |
| --- | --- |
| Agnostic law (this file) | PROMPTOS `patterns/experience-standard.md` |
| Resource pointers (libs, tools, repos) | PROMPTOS `patterns/experience-resources.md` |
| Instantiate for a product | PROMPTOS `playbooks/instantiate-design-brief.md` |
| Project identity + persona | `{repo}/docs/DESIGN-BRIEF.md` |
| Operating law | agent-kit `AGENTS.md` §4 |
| Camera gate | `{repo}/verify/camera.py` (pattern from dsm-jobs) |

## Prompt

For greenfield UI: [design-direction-first](../prompts/design-direction-first.md)
then this checklist. For existing products: instantiate DESIGN-BRIEF first.
