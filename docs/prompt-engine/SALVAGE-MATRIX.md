# Prompt Engine Salvage Matrix

Status: normative import boundary

This matrix governs all use of the superseded Prompt Engine branch. It permits
selective reimplementation of useful behavior. It does not authorize rebasing,
merging, cherry-picking, or copying the branch wholesale.

## Audited Revisions

| Role | Revision |
| --- | --- |
| Current `main` used for the audit | `4de058b9d3bb7e62b944b994c59f745b5937c32d` |
| Hardened acceptance-contract head | `cfe96ae` |
| Superseded engine head | `e37f097bb079ea0b3c2d18d0937c365065c30d3b` |
| Superseded branch merge base | `189c496698594ff5f0920a4a94c910ed98674f16` |

The superseded branch contains 13 unique commits and 33 changed files. Against
the hardened acceptance head it is 13 commits ahead and 8 commits behind. No
file qualifies for unchanged `ACCEPT`.

Reproduce the inventory with:

```powershell
git diff --name-status 189c496698594ff5f0920a4a94c910ed98674f16..e37f097bb079ea0b3c2d18d0937c365065c30d3b
git rev-list --left-right --count cfe96ae...e37f097bb079ea0b3c2d18d0937c365065c30d3b
```

## Disposition Meanings

| Disposition | Authority |
| --- | --- |
| `ACCEPT` | Import unchanged after its original tests and current gates pass. None qualify. |
| `PORT_WITH_REPAIR` | Reimplement the useful behavior behind current contracts and new regression tests. Do not copy the file wholesale. |
| `REWRITE` | Preserve the requirement, not the implementation. Build from current schemas and authority boundaries. |
| `DEFER` | Keep out of executable scope until its named prerequisite is accepted. |
| `DROP` | Do not import. Current PromptOS already owns the capability or the artifact encodes rejected architecture. |

## Verified Defects In The Superseded Design

1. `prompt-engine/src/orchestrator.mjs` evaluates multiple finalists on the
   holdout and selects from the holdout ranking. That turns concealed evidence
   into a training/selection signal instead of a final test of one frozen
   candidate.
2. `prompt-engine/src/providers.mjs` assumes provider capabilities, does not
   accept caller cancellation, and does not provide a safe error boundary.
3. Provider, benchmark, and campaign paths convert missing cost into zero. This
   can fabricate budget parity and superiority.
4. Campaign reports retain holdout responses, labels, rankings, and judge
   details. Key-name redaction does not make those reports safe.
5. Provenance omits required dataset, split, model-configuration, Git,
   environment, and artifact identities. The Anthropic example accepts a weak
   caller-supplied source hash instead of verifying an artifact.
6. The HTTP service is synchronous and becomes an accidental application
   boundary. It has no accepted authentication, cancellation, concurrency, or
   safe-error contract.
7. The branch-specific browser UI renders unsafe full reports and duplicates
   the canonical PromptOS console and planned shared React workbench.
8. The branch has no associated pull request or recorded GitHub check runs.
   Its tests do not cover the defects above.

## File-Level Decisions

| Superseded file at `e37f097` | Disposition | Target owner | Required repair or reason |
| --- | --- | --- | --- |
| `README.md` | `DROP` | Root docs | Recreate current integration text narrowly; the old root edit conflicts with current main. |
| `package.json` | `DROP` | Root tooling | Do not restore stale root scripts or workspace wiring. Add only scripts required by accepted packages. |
| `prompt-engine/README.md` | `REWRITE` | `docs/prompt-engine/` | It claims isolation, provenance, redaction, and bounds the implementation does not enforce. |
| `prompt-engine/agents/team.json` | `DROP` | Core policy | It duplicates code-owned role policy and asserts unenforced access boundaries. |
| `prompt-engine/docs/ARCHITECTURE.md` | `REWRITE` | `docs/TARGET-ARCHITECTURE.md` | Reconcile documentation only after accepted Core package boundaries exist. |
| `prompt-engine/docs/BENCHMARK-CONTRACT.md` | `PORT_WITH_REPAIR` | `packages/evaluator` docs | Preserve paired evaluation, equal budgets, hard failures, and scoped claims; align them to acceptance receipts. |
| `prompt-engine/fixtures/anthropic-baseline.example.json` | `REWRITE` | `tests/fixtures/engine/` | Replace self-asserted provenance with hash-bound, schema-valid receipts. |
| `prompt-engine/fixtures/campaign-policy.json` | `REWRITE` | `packages/release-policy` fixtures | Rebuild after campaign certification has accepted receipt and parity contracts. |
| `prompt-engine/fixtures/request.json` | `REWRITE` | `packages/contracts` fixtures | Remove embedded holdout content; use public context plus concealed loader contracts. |
| `prompt-engine/package.json` | `DROP` | Package manifests | Recreate package metadata from current root lockfile and target package graph. |
| `prompt-engine/public/app.js` | `DROP` | Shared workbench | Duplicates the canonical UI and exposes unsafe reports. |
| `prompt-engine/public/index.html` | `DROP` | Shared workbench | Do not preserve the synchronous HTTP/static-UI boundary. |
| `prompt-engine/public/styles.css` | `DROP` | Shared workbench | No unique behavior warrants carrying the branch-specific presentation layer. |
| `prompt-engine/src/benchmark.mjs` | `PORT_WITH_REPAIR` | `packages/evaluator` | Keep deterministic rendering and aggregation; remove holdout detail persistence, unknown-as-zero usage, and unbounded calls. |
| `prompt-engine/src/campaign.mjs` | `REWRITE` | `packages/release-policy` | Rebuild over validated receipts, immutable manifests, cost parity, and independent evidence. |
| `prompt-engine/src/cli.mjs` | `PORT_WITH_REPAIR` | Future CLI adapter | Keep a headless runner after Core stabilizes; add strict parsing, cancellation, safe receipts, and exact exit states. |
| `prompt-engine/src/contracts.mjs` | `REWRITE` | `packages/contracts` | Replace informal objects and startup holdout loading with versioned schemas and immutable manifests. |
| `prompt-engine/src/metrics.mjs` | `PORT_WITH_REPAIR` | `packages/evaluator` | Keep deterministic graders and perturbations; separate metric output from claim authority. |
| `prompt-engine/src/orchestrator.mjs` | `PORT_WITH_REPAIR` | `packages/core` | Keep bounded validation-only generate/critic/revise search and hash deduplication; freeze exactly one candidate before holdout access. |
| `prompt-engine/src/pareto.mjs` | `PORT_WITH_REPAIR` | `packages/core` | Preserve Pareto front/ranking behavior with finite-value validation, stable ordering, and cost-basis tests. |
| `prompt-engine/src/providers.mjs` | `REWRITE` | `packages/providers` | Build capability-aware adapters with caller cancellation, normalized usage, safe errors, and reported/estimated/unknown cost. |
| `prompt-engine/src/roles.mjs` | `PORT_WITH_REPAIR` | `packages/core` | Keep role separation only where executable interfaces enforce information access. |
| `prompt-engine/src/server.mjs` | `DEFER` | Optional API adapter | Resume only after Core acceptance and explicit auth, concurrency, cancellation, async-job, and safe-error contracts. |
| `prompt-engine/src/stats.mjs` | `PORT_WITH_REPAIR` | `packages/evaluator` | Preserve paired and hierarchical bootstrap behavior with finite-value, sample-size, deterministic-seed, and claim-boundary tests. |
| `prompt-engine/src/util.mjs` | `PORT_WITH_REPAIR` | `packages/core` | Preserve canonical sorting, hashing helpers, and seeded sampling only when they match accepted canonical identities. |
| `prompt-engine/test/campaign.test.mjs` | `REWRITE` | `packages/release-policy` tests | Replace self-declared report tests with receipt, parity, redaction, and independent-evidence negatives. |
| `prompt-engine/test/contracts.test.mjs` | `REWRITE` | `packages/contracts` tests | Test current schemas, safe paths, immutable hashes, and concealed-loader structure. |
| `prompt-engine/test/orchestrator.test.mjs` | `PORT_WITH_REPAIR` | `packages/core` tests | Preserve validation-search cases; add one-frozen-candidate, no-holdout-selection, cancellation, and budget tests. |
| `prompt-engine/test/pareto.test.mjs` | `PORT_WITH_REPAIR` | `packages/core` tests | Preserve useful ranking vectors and add NaN, infinity, tie, stable-order, and unequal-cost negatives. |
| `prompt-engine/test/provider.test.mjs` | `REWRITE` | `packages/providers` tests | Add capability negotiation, cancellation, safe errors, provenance, and unknown-cost controls. |
| `prompt-engine/test/server.test.mjs` | `DEFER` | Optional API tests | No service tests until the HTTP adapter itself is authorized. |
| `prompt-engine/test/stats.test.mjs` | `PORT_WITH_REPAIR` | `packages/evaluator` tests | Preserve deterministic bootstrap vectors and add invalid-sample and claim-authority boundaries. |
| `skills/prompt-engine/SKILL.md` | `DEFER` | Future CLI skill | Do not expose optimization or superiority commands until repaired CLI and behavioral gates are accepted. |

## Authorized Port Sequence

Each step is a separate pull request. A later step may not begin merely because
an earlier branch exists; its prerequisite must be accepted and green.

1. **Deterministic kernel:** reimplement canonical utilities, Pareto behavior,
   and statistics in framework-neutral TypeScript with old vectors plus new
   finite-value and stable-order negatives.
2. **Public evaluator:** reimplement deterministic graders, perturbations, and
   bounded public evaluation over the v1 acceptance manifest and receipt gate.
3. **Validation search:** reimplement role-separated generate/critic/revise
   search using public cases only. Freeze one candidate before any holdout call.
4. **Provider boundary:** implement capability-aware adapters with external
   cancellation, safe errors, and explicit usage/cost provenance. Default CI
   remains offline.
5. **Headless CLI:** add strict commands over accepted Core contracts. It may
   write only explicit, schema-valid, redaction-approved receipts.
6. **Release policy:** implement baseline, holdout, and independent claim
   schemas as new versions before campaign certification can exist.
7. **Deferred adapters:** consider HTTP, skills, React workbench, and Electron
   only after the framework-neutral Core and browser contracts are accepted.

## Per-Port Gate

Every port must:

1. start from the current accepted base, not `e37f097`;
2. name the old function or behavior being reimplemented;
3. add a failing regression before production code;
4. use current schemas and canonical hashes;
5. keep hidden evidence unavailable during generation, revision, and selection;
6. keep unknown cost as unknown and enforce cumulative bounds;
7. pass `npm run verify` and focused adversarial probes;
8. receive independent diff review before its pull request leaves draft;
9. update provenance and capability state without overstating effectiveness;
10. remain independently revertible.

## Explicit Non-Authority

This matrix does not establish prompt effectiveness, statistical correctness,
provider compatibility, benchmark superiority, desktop readiness, or release
readiness. Those claims require their own versioned evidence and target-host
gates.
