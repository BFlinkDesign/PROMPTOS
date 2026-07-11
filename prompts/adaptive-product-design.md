# Adaptive Product Design — Repository Execution Prompt

Use this prompt when a repository contains or is intended to contain a user-facing product.

## Assignment

Inspect the repository and produce a repository-specific product-design direction that is evidence-led, implementation-aware, and resistant to visual templating.

Do not imitate Clay Global, Apple, Linear, Stripe, Notion, Google, or any other named product. Learn from strategic rigor, not surface aesthetics.

Do not generate another generic prompt, framework, or blank template. Apply this protocol directly to the repository in scope.

## Evidence gate

Before proposing visual design, identify and cite repository evidence for:

- actual product purpose;
- current users and likely operators;
- highest-value and highest-risk workflows;
- existing UI routes and components;
- technical stack and constraints;
- security and privacy boundaries;
- accessibility and device requirements;
- product claims that conflict with implementation;
- missing evidence that blocks responsible design.

Classify every important conclusion as:

- OBSERVED;
- INFERRED;
- ASSUMED;
- RECOMMENDED.

Every OBSERVED claim must reference a file, route, test, issue, commit, or runtime result.

## Stop conditions

Stop before visual concepting when any of these applies:

- the product boundary is materially unclear;
- the primary workflow is unverified;
- sensitive-data exposure is unresolved;
- the repository contains multiple competing frontends without a canonical trunk;
- implementation claims conflict with tests or runtime evidence;
- critical user or operational assumptions exceed the assumption budget.

When stopped, produce a bounded evidence-acquisition plan rather than invented design certainty.

## Assumption budget

No selected direction may depend on more than three load-bearing unvalidated assumptions.

A load-bearing assumption is one that could change the navigation, workflow model, data architecture, trust model, or primary interface composition.

## Experience thesis

Create one repository-specific thesis using this structure:

> The product should behave like [specific operating quality] because users must [real task], while the system absorbs [underlying complexity] and makes [critical state or decision] unmistakable.

Reject adjectives that do not change behavior, such as modern, clean, premium, intuitive, elegant, or futuristic.

## Structural divergence

Create three directions that differ in product structure, not just styling.

For every pair of directions, at least five of these must materially differ:

- navigation model;
- workflow progression;
- dominant composition;
- information density;
- evidence placement;
- user-guidance level;
- expert shortcut model;
- comparison model;
- responsive behavior;
- primary action structure;
- failure-state handling;
- signature interaction.

Complete a pairwise diversity matrix before scoring.

## Innovation rule

Preserve conventions where familiarity protects speed, accessibility, trust, or safety.

Challenge conventions only when repository or user evidence shows measurable friction.

For every unconventional decision, specify:

1. convention challenged;
2. observed deficiency;
3. proposed alternative;
4. expected benefit;
5. adoption risk;
6. validation method;
7. kill condition.

## Signature idea

Propose one product-native signature idea. It must improve a real workflow and pass:

- utility;
- specificity;
- memorability;
- repeatability;
- technical feasibility;
- testability.

Reject decorative novelty.

## Pre-registered evaluation

Before generating concepts, declare:

- scoring criteria;
- weights;
- veto conditions;
- success metrics;
- decision authority.

Do not change weights after seeing concepts unless the change is explicitly recorded and justified.

## Required output

1. Executive decision
2. Repository evidence ledger
3. Contradictions and blockers
4. User and workflow model
5. Experience thesis
6. Three structurally distinct directions
7. Pairwise diversity matrix
8. Weighted scorecard
9. Selected direction and rejected alternatives
10. Signature product idea
11. Information architecture
12. Primary flows
13. State and recovery model
14. Accessibility and responsive requirements
15. Technical component implications
16. Validation plan
17. Failure-mode register
18. Production acceptance criteria
19. Final anti-template audit

## Anti-template audit

Answer directly:

- Could this be reused for an unrelated product by changing labels and colors?
- Were any layout, palette, typography, navigation, or motion choices selected from habit?
- Did the process create three architectures or one architecture with three skins?
- Is the signature idea operational or decorative?
- Has complexity been removed, or merely hidden from the user?
- Are assumptions visibly separated from evidence?
- Can engineering preserve the design without inventing missing behavior?
- Are failure, stale-data, permission, offline, and partial states defined?

If the answer exposes generic output, return to divergence rather than polishing.
