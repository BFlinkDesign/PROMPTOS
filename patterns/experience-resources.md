# Experience resources (pointers, not dependencies)

Curated references for **layer B (visual craft)** and **layer C (proof)**.
Nothing here is vendored into PROMPTOS — agents and humans follow links to
primary sources. Run new libraries through dev-setup `frontier-ai-radar`
(`adopt` / `pilot` / `watch` / `reject`) before making them defaults.

---

## Authority (read first)

| Resource | Use for |
| --- | --- |
| [WCAG 2.2 Quick Ref](https://www.w3.org/WAI/WCAG22/quickref/) | Contrast, focus, target size — pass/fail numbers |
| [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) | ARIA, keyboard, semantic HTML |
| [web.dev Learn Accessibility](https://web.dev/learn/accessibility/) | Practical audits, mobile |
| [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) | Dialog, listbox, tabs patterns (folder picker, modals) |
| [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | Motion law |

---

## Proof & forensic UX (layer C)

| Resource | Use for |
| --- | --- |
| [Playwright](https://playwright.dev/python/) | Camera gate — real Chromium, 390×844 shots |
| [dsm-jobs `verify/camera.py`](https://github.com/BFlinkDesign/dsm-jobs/blob/main/verify/camera.py) | Reference implementation (PWA, DOM invariants) |
| [EagleScope `verify/camera.py`](https://github.com/BFlinkDesign/EagleScope/blob/main/verify/camera.py) | Dashboard variant (FastAPI + static UI) |
| [axe-core](https://github.com/dequelabs/axe-core) | Automated a11y rules — supplement, not substitute for looking |
| [Pa11y](https://github.com/pa11y/pa11y) | CI a11y CLI |

**Rule:** automated a11y caps at **ASSERTED**. Camera + human walk of 11 criteria
required for ship.

---

## Component & layout libraries (pilot before adopt)

Use for **speed and a11y primitives**, not identity. Project DESIGN-BRIEF picks
palette, type, signature element — libraries fill mechanics.

| Resource | Use for | Radar default |
| --- | --- | --- |
| [Radix Primitives](https://www.radix-ui.com/primitives) | Accessible dialog, select, focus trap | `pilot` |
| [shadcn/ui](https://ui.shadcn.com/) | Copy-in Tailwind components (you own the code) | `pilot` |
| [Base UI](https://base-ui.com/) | Headless MUI primitives | `watch` |
| [Open Props](https://open-props.style/) | CSS custom properties baseline | `watch` |
| [Utopia fluid type](https://utopia.fyi/type/calculator/) | Responsive type scale math | `watch` |
| [IBM Carbon](https://carbondesignsystem.com/) | Enterprise dashboard density reference | `watch` |

**Not a library:** your **one accent + one signature element** come from
DESIGN-BRIEF, not from a component kit defaults.

---

## Typography & color (verify contrast in code)

| Resource | Use for |
| --- | --- |
| [Contrast checker (WebAIM)](https://webaim.org/resources/contrastchecker/) | AA proof for palette picks |
| [Leonardo Color](https://leonardocolor.io/) | Accessible palette generation |
| [Fontsource](https://fontsource.org/) | Self-hosted WOFF2 (no Google CDN dependency) |
| [Modern Font Stacks](https://modernfontstacks.com/) | System stack pairings when self-host isn't worth it |

---

## Motion

| Resource | Use for |
| --- | --- |
| [cubic-bezier.com](https://cubic-bezier.com/) | Tune easing — default family: `(0.16, 1, 0.3, 1)` |
| [easing.net](https://easing.net/) | Pick durations 150–250 ms for UI feedback |

---

## Internal reference implementations (your repos)

| Repo | What to steal |
| --- | --- |
| [dsm-jobs](https://github.com/BFlinkDesign/dsm-jobs) | Full DESIGN-BRIEF + camera + static guards |
| [EagleScope](https://github.com/BFlinkDesign/EagleScope) | Internal-tool brief, drafting-table tokens, Evidence Rail |
| [dev-setup](https://github.com/BFlinkDesign/dev-setup) | Install golden path, repo-control-loop, autonomy evals |
| [PROMPTOS](https://github.com/BFlinkDesign/PROMPTOS) | Agnostic patterns + playbooks |

---

## Hugging Face & ML (usually **not** UX)

HF is for **models and datasets**, not layout. Relevant crossovers:

| Resource | Use for |
| --- | --- |
| [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | Local semantic pre-filter (triage gate) — not UI |
| [Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard) | Model **routing** research — not visual craft |
| [MBPP / HumanEval](https://huggingface.co/datasets) | Code capability benchmarks — pair with dev-setup autonomy |

Do **not** pick UI patterns from HF. Pick interaction law here; pick models from
radar + benchmarks.

---

## GitHub discovery (beyond star counts)

| Pattern | Use for |
| --- | --- |
| [awesome-accessibility](https://github.com/brunopulis/awesome-a11y) | Curated a11y tools |
| [awesome-design-systems](https://github.com/alexpate/awesome-design-systems) | DS comparison — reference only |
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | Connectors layer — not UX |
| Your `dev-setup/frontier-ai-radar/okf/` | **Canonical** adopt/pilot/watch/reject ledger |

---

## When to add a new resource row

1. Used in production on your machine with evidence (gate or camera pass).
2. Primary docs URL is stable.
3. Classified in frontier-ai-radar.
4. PR to this file — one row, one sentence, radar status.
