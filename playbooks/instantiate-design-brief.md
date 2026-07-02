# Instantiate a project DESIGN-BRIEF

Use when: a repo gains human-facing UI and needs **layer B** (identity + persona)
on top of PROMPTOS [experience-standard](../patterns/experience-standard.md)
(layer A).

Do **not** copy dsm-jobs or EagleScope briefs wholesale — instantiate from the
template below. Link to [experience-resources](../patterns/experience-resources.md)
for libraries and proof tools.

---

> Create `docs/DESIGN-BRIEF.md` for **[PRODUCT NAME]**.
>
> **Audience:** [ONE PERSON + emotional state + context]
> **Single job:** [THE ONE JOB — one sentence]
> **Surface:** [PWA / internal dashboard / installer / report PDF]
>
> **Design direction first** (before code):
> - Palette: 4–6 named hex + roles; prove AA contrast with WebAIM or code
> - Type: display + body pairing; self-host WOFF2 or document system stack
> - Signature element: one thing this product is remembered by
> - Motion: one easing family, 2–3 durations (150–250 ms default)
>
> **Interaction:** inherit all 11 criteria from PROMPTOS experience-standard.
> Add project-specific acceptance items only if needed (max 3).
>
> **Banned for this product:** [list beyond global slop ban]
>
> **Quality floor:**
> - WCAG 2.2 AA, 44px targets, 390px width
> - Domain invariants from CLAUDE.md / AGENTS.md win on conflict
> - Static guards or pytest where strings/IDs must not drift
> - `verify/camera.py` — screenshot + DOM checks; exit 1 on failure
>
> **Before finishing any UI task:**
> 1. Run camera (or Playwright equivalent)
> 2. Walk 11 criteria against screenshots — pass/fail each
> 3. Remove one decorative element (Chanel rule)
>
> Output: complete `docs/DESIGN-BRIEF.md` ready to paste in repo root `docs/`.
> Do not write application code in this pass.
