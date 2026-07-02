<!-- promptos-block: id=miss-promotion v=1.0 -->
# Meta: miss → rule promotion — the kill chain

Turns observed misses (things your deterministic layer failed to catch, surfaced by a
no-silent-miss net) into permanent, tested, versioned rules. Discovery is radar;
deterministic rules are weapons lock.

## Prompt
> A miss was observed: context={{context}}, candidate signal(s)={{candidates}},
> evidence span "{{span}}". Propose a promotion:
>
> - **pattern** — the deterministic rule (regex with exactly ONE capture group, or an
>   equivalent single-obligation rule).
> - **field/class** — which typed slot it feeds (from the closed set: {{fields}}).
> - **positive proof** — the rule extracts **{{expected_value}}** from the evidence
>   span verbatim.
> - **negative proof** — 3 nearby/realistic strings it must NOT match.
> - **blast radius** — what over-matching would corrupt downstream.
>
> If you cannot write the negative proof, the rule is not ready — return to
> observation.

## Gate contract (deterministic, runs on every proposal)
Reject on ANY of: unknown field/class · empty expected value · pattern fails to
compile · no capture group · captured value ≠ expected value · (v2) pattern matches a
registered negative example.

## Lifecycle
DISCOVER → CLASSIFY → CANONICALIZE → FORMALIZE → VALIDATE (the gate) → TEST (case
joins the golden corpus; the eval gate now fails forever if coverage regresses) →
PROMOTE (versioned registry entry: pattern, field, method, version, date) → MONITOR →
RETIRE (rules are removed by decision, never by rot).

## Standing rules
- The owner's declared judgments ("never my task", "out of scope") promote straight
  to permanent suppression rules — the system does not re-litigate them.
- Every extraction carries evidence (source span + method + rule version): an
  answer you can't trace is a miss you can't debug.
