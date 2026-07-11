# Adaptive Product Design Repository Execution Protocol

Use this protocol for repository-grounded product design. Apply it to the product in scope; do not produce another generic framework or imitate a named product's surface aesthetic.

Markdown is the canonical protocol. Code may validate the protocol and its records, but no language, vendor, tracker, or agent runtime is mandatory.

## Assignment

Inspect the repository and produce an evidence-led, implementation-aware product direction. The result must resist visual templating, fake certainty, portfolio cargo-culting, novelty bias, weak prioritization, and implementation hallucination.

## Risk router and decision rights

Select the least costly mode that covers the downside. Record the mode, rationale, decision owner, approver, and any challenger before design work begins. A portfolio tracker may record the decision, but it is not the source of truth.

Escalate one mode when the work affects safety, health, money movement, authentication, privacy, regulated data, irreversible migration, a foundational navigation model, or a high-cost operational workflow. The decision owner may escalate. Only the named approver may de-escalate, and must record evidence and residual risk.

### Express mode

Use for low-risk, local, reversible work whose primary workflow and implementation path are already verified. Produce one direction and a focused validation plan. Do not require concept alternatives, a diversity matrix, or a weighted scorecard. Stop if a high-risk dependency or load-bearing unknown appears.

### Standard mode

Use for material product work with reversible implementation and bounded trust impact. Produce two structurally distinct directions, compare them against pre-registered criteria, and document the selected direction and rejected alternative. Require a feasibility check for any unproven interaction or data dependency.

### Assurance mode

Use for high-impact, difficult-to-reverse, safety-, money-, privacy-, security-, or architecture-sensitive work. Produce at least three structurally distinct directions, a pairwise diversity matrix, weighted scoring, independent adversarial review, and a feasibility spike for the highest-risk implementation claim. The challenger may block only on pre-registered vetoes or newly observed critical evidence.

## Evidence model

Maintain two independent labels. Never collapse evidence basis and artifact trust into one confidence word.

**Claim basis**

- OBSERVED: directly supported by a cited repository file, route, test, issue, commit, user study, or runtime result.
- INFERRED: reasoned from observed evidence; state the inference path.
- ASSUMED: unvalidated and budgeted; state impact and validation owner.
- RECOMMENDED: proposed action derived from the preceding evidence.

**Artifact trust**

- VERIFIED: independently reproduced or accepted by the named authority.
- ASSERTED: supplied by a credible party but not independently reproduced.
- DRAFT: incomplete or awaiting validation.
- UNTRUSTED: contradictory, stale, synthetic, or from an unknown provenance.

Every material claim must include both labels and a citation or trace identifier. Prediction, preference, and design judgment must never be presented as observation.

## Evidence threshold

Before proposing a direction, cite evidence for:

- product purpose and system boundary;
- primary users, operators, and decision authority;
- highest-value and highest-risk workflows;
- current routes, components, data contracts, and runtime behavior;
- technical, security, privacy, accessibility, and device constraints;
- claims that conflict with implementation or tests;
- missing evidence that could materially reverse the decision.

The primary workflow needs at least one OBSERVED source and one independent corroborating source. High-impact trust or safety claims require VERIFIED artifact trust. If these thresholds are not met, stop and produce an evidence-acquisition plan.

## Stop conditions

Stop the current phase when any condition is true:

- product boundary or primary workflow is materially unclear;
- sensitive-data, permission, safety, or security exposure is unresolved;
- multiple competing implementations lack a canonical owner;
- repository claims conflict with tests or runtime evidence;
- the assumption budget is exceeded;
- a pre-registered veto is triggered;
- a feasibility spike disproves a load-bearing implementation claim;
- the selected success metric can be improved without improving the user outcome.

Stopping means preserve evidence, name the decision owner, and define the smallest acquisition or repair step. It does not mean inventing certainty or polishing around the blocker.

## Assumption budget

Classify assumptions by impact:

- Critical: can change safety, authority, trust, data exposure, or the viability of the primary workflow.
- Load-bearing: can change navigation, workflow, data architecture, or primary composition.
- Local: can be reversed without changing those structures.

Express permits no unvalidated Critical or Load-bearing assumptions. Standard permits at most two Load-bearing assumptions. Assurance permits at most three, each with an owner, expiry, validation method, and kill condition. Critical assumptions always block selection until validated.

## Experience thesis

Write one repository-specific thesis:

> The product should behave like [specific operating quality] because users must [observed task], while the system absorbs [underlying complexity] and makes [critical state or decision] unmistakable.

Reject adjectives that do not alter behavior, such as modern, clean, premium, intuitive, elegant, or futuristic.

## Structural diversity

Directions must differ in product structure rather than styling. Compare navigation, workflow progression, dominant composition, information density, evidence placement, guidance, expert shortcuts, comparison model, responsive behavior, primary actions, failure recovery, and signature interaction.

For Standard, at least four dimensions must materially differ. For Assurance, at least five dimensions must differ for every pair. Rebranding, palette changes, and rearranged cards do not count as new directions.

## Physics and conventions

Derive behavior from measured constraints, domain mechanics, mathematics, and verified implementation facts before using heuristics. Label any heuristic and state why a first-principles answer is unavailable.

Preserve conventions where familiarity protects speed, accessibility, trust, or safety. Challenge a convention only when evidence shows measurable friction. For each challenge, record the deficiency, alternative, expected benefit, adoption risk, validation method, and kill condition.

## Evaluation and vetoes

Before concept generation, register criteria, weights, vetoes, success metrics, decision owner, approver, challenger, and evaluation window. Vetoes are evaluated before weighted scoring. A vetoed direction cannot win through aggregate points.

Do not alter weights after seeing results unless the decision log records the change, reason, approver, and rescoring. Reject proxy metrics that can improve while user outcomes worsen.

## Traceability

Give each material requirement, claim, assumption, direction, veto, test, and acceptance criterion a stable ID. Link the chain:

`evidence -> requirement -> direction decision -> implementation item -> validation result -> acceptance decision`

Record unresolved links as gaps. Do not claim implementation feasibility without a repository path, responsible owner, dependency check, and test strategy.

## Validation gates

1. **Diagnosis gate:** evidence threshold met; contradictions and unknowns explicit.
2. **Diversity gate:** mode-required directions are structurally distinct.
3. **Selection gate:** vetoes pass before scoring; assumptions remain within budget.
4. **Feasibility gate:** high-risk claims have a spike or verified implementation path.
5. **Usability gate:** primary flow succeeds with target users or a justified representative test.
6. **Accessibility gate:** keyboard, screen-reader, contrast, text scaling, focus, motion, and responsive behavior meet the declared standard.
7. **Production gate:** failure, stale-data, permission, offline, partial, rollback, telemetry, and support states are specified and tested.

Failure at a gate returns work to the earliest invalidated decision. It never becomes a waived checklist item without named authority and an expiry.

## Mode-specific output

All modes produce: executive decision, mode rationale, evidence ledger, contradiction/gap list, users and workflow, experience thesis, selected direction, information architecture, primary flow, state/recovery model, accessibility and responsive requirements, implementation plan, validation plan, acceptance criteria, and traceability map.

Express additionally produces a reversal plan and focused test. Standard additionally produces two directions, comparison, rejected alternative, and assumption register. Assurance additionally produces three or more directions, diversity matrix, veto and weighted scorecards, independent adversarial review, feasibility-spike evidence, failure-mode register, and residual-risk acceptance.

## Anti-gaming audit

Answer directly:

- Could this output fit an unrelated product by changing labels and colors?
- Are the directions different architectures or one architecture with several skins?
- Did any uncited preference become a requirement?
- Can a metric improve while the actual user outcome worsens?
- Were vetoes weakened after a favored direction appeared?
- Is the signature interaction operational or decorative?
- Are uncertainty, failure, stale-data, permission, offline, and partial states explicit?
- Can engineering reproduce the decision without inventing missing behavior?
- Did the process remove complexity for the user, or merely conceal it?
- Is process cost proportional to risk?

If an answer exposes generic output, false confidence, superficial compliance, or unverifiable implementation, return to the earliest affected gate.

## Success criteria

The work succeeds only when the selected direction improves pre-registered user and operational outcomes, passes all mode-required gates, remains within the assumption budget, has no unresolved veto, and can be independently reproduced from the traceability record. Completion of documents, screens, workshops, or scorecards alone is not success.
