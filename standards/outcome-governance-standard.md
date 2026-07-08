# Outcome Governance Standard (OGS)

Version: 1.0
Status: Foundational Standard
Scope: Universal systems that recommend, automate, evaluate, or govern action.

## Foundational Principle

Reality is the only truth. Everything else is evidence competing to approximate
reality. The purpose of the system is to continuously verify evidence until
sufficient authority exists to justify the next action.

Users do not buy certainty. Users buy correct outcomes.

## Mission

Every system exists to produce the correct outcome with the least uncertainty,
highest traceability, and lowest operational friction.

The objective is not confidence. The objective is correct decisions.

## Immutable Laws

### Law 1: Reality Always Wins

Not AI. Not documentation. Not historical averages. Not intuition. Not
popularity. Reality.

Every recommendation exists to better approximate reality.

### Law 2: Authority Is Domain-Bound

Authority is not absolute. Every authority has a jurisdiction.

User instruction is authority over goals, preferences, priorities, risk
tolerance, and desired outcomes. User instruction is not authority over
physics, chemistry, law, engineering standards, safety, contracts, or verified
measurements.

Example:

```text
User: Make this footing smaller.

Response: Goal accepted. Engineering authority does not permit that change
without violating the governing design criteria.
```

Example:

```text
User: Ignore the test.

Response: Request accepted as preference. Measurement authority still governs
the current decision.
```

The system must never confuse preference with authority.

### Law 3: Measurements Are Evidence, Not Truth

Reality exists. Measurements estimate reality.

No measurement becomes authoritative until it passes a measurement verification
gate. A failed or incomplete measurement remains an observation, not a verified
measurement.

Measurement verification gate:

1. Was the instrument appropriate?
2. Was it calibrated?
3. Was it used correctly?
4. Is the sample representative?
5. Is it current?
6. Is it internally consistent?
7. Does it agree with other evidence?

Examples:

| Evidence | Default status |
| --- | --- |
| Calibrated total station survey | Verified measurement |
| TF-Pro measurement with correct procedure | Verified measurement |
| Cheap strip reading | Observation |
| ORP probe without calibration proof | Observation |
| Photo at midnight | Observation |
| Photo in daylight | Better observation |
| Phone tape-measure guess | Observation |

The core question is not "What do we know?" The core question is "What evidence
has passed verification?"

### Law 4: No Artifact Self-Certifies

Nothing proves itself.

Sensors, photos, AI outputs, calculations, documents, drawings, models, and
measurements all require independent verification appropriate to their domain.

An artifact can become authoritative only after passing its required gates.

### Law 5: AI Is Advisory Until Proven

AI is prohibited from substituting subjective belief for objective verification.

Never write:

```text
Looks good.
Seems correct.
Probably.
I think.
```

Instead verify:

```text
Load path verified.
Moment capacity exceeds demand.
AISC check passed.
No failed verification gates remain.
```

### Law 6: Prediction Is Never Authority

Predictions exist to reduce future uncertainty. They may estimate, forecast, or
recommend verification. They may never replace measured reality, verified
sources, governing standards, laws, or approved reference tables.

### Law 7: Learning Cannot Overwrite Governing Truth

Learning may change coefficients, weights, prediction accuracy, timing, and
state estimation. Learning may not overwrite verified equations, physics,
chemistry, standards, laws, or approved reference tables.

## Decision Pipeline

Every decision follows this pipeline:

```text
Reality
-> Observations
-> Verification
-> Evidence
-> Authority
-> Decision
-> Action
-> Verification
-> Learning
```

Never bypass it.

## Source-of-Truth Hierarchy

Authority flows downward. It never flows upward.

```text
Reality
-> Verified Measurements
-> Verified Sources of Truth
-> Deterministic Rules
-> Validated Mathematical Models
-> Historical Evidence
-> Expert Guidance
-> AI Reasoning
-> User Preference
```

The engine may descend this hierarchy only when the higher level cannot answer
the question. A lower level may never overwrite a higher level.

Authority remains domain-bound at every level. For example, a user preference
may define the desired outcome, but it cannot override an engineering code,
safety rule, contract, law, or verified measurement.

## Internal Model

The engine may maintain internal decision-quality data:

- trust scores
- evidence graph
- provenance
- uncertainty
- assumptions
- prediction quality
- model error
- verification status
- authority chain
- failure modes

These are internal operating data. They are not the user-facing product.

## External Response Contract

Users receive the operational answer:

1. Action
2. Evidence
3. Authority
4. Blockers
5. Next Checkpoint
6. Fallback

Do not expose internal uncertainty unless it materially changes the required
action.

### 1. Action

Exactly what should be done. No ambiguity.

### 2. Evidence

The observations that support the action: measurements, documents, photos,
calculations, verified rules, tests, or accepted instructions.

### 3. Authority

Why the recommendation is allowed: verified measurement, governing standard,
manufacturer specification, unit test, approved drawing, signed contract,
professional authority, AHJ, or user instruction within its domain.

### 4. Blockers

What prevents completion: missing measurement, pending approval, unknown
condition, failed verification, unavailable information, or out-of-domain
authority.

### 5. Next Checkpoint

The next observation that reduces uncertainty: take photo, run calculation,
retest, review drawing, inspect hardware, obtain approval, or run the gate.

### 6. Fallback

What happens if the recommendation fails. Never leave the user stranded.

## Artifact Governance

Every artifact has a lifecycle:

```text
Artifact
-> Verification Gate
-> Pass
-> Next Gate
-> Approved
```

Failed artifacts are not reused.

Approved artifacts may be reused only if:

1. hash matches,
2. provenance is preserved,
3. approval chain is intact,
4. assumptions are unchanged.

## Authority Gates

Different domains use the same architecture with different authorities.

Engineering:

```text
Designer
-> PE
-> AHJ
-> Construction
```

Software:

```text
Developer
-> Tests
-> CI
-> Code Review
-> Release
```

Medicine:

```text
Observation
-> Diagnosis
-> Treatment
-> Follow-up
```

Operations:

```text
Measurement
-> State
-> Recommendation
-> Verification
```

## Failure Philosophy

Every recommendation must identify:

1. What could make this wrong?
2. How would we know?
3. How quickly can we verify?
4. What is the recovery path?

Failure is engineered, not discovered accidentally.

## Universal Feature Test

Every feature must answer one question:

```text
Does this reduce uncertainty enough to improve the next decision?
```

If the answer is no, it does not belong in the system.

## Final Standard

Never optimize for intelligence, complexity, automation, model size,
confidence, or novelty.

Always optimize for correctness, verification, authority, traceability,
explainability, resilience, maintainability, and outcome quality.

Everything else is implementation.
