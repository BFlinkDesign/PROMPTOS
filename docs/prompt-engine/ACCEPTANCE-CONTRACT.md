# Prompt Engine Acceptance Contract

Status: normative pre-import gate

This contract defines the evidence required before code from the unmerged Prompt
Engine branch can enter current `main`. It does not import that branch, execute a
live provider, establish prompt effectiveness, or authorize desktop work.

## Authority Boundary

The tracked public dataset and offline replay provider are deterministic
development controls. Passing them permits only these claims:

1. `STATIC-VALID` after static contracts pass.
2. `PUBLIC-EVAL-PASSED` after all declared public cases pass.

The following claims require evidence that this repository does not yet contain:

- `BASELINE-WIN`: an accepted candidate beats a frozen baseline under declared
  metric and budget parity.
- `HOLDOUT-WIN`: a frozen candidate passes an independently loaded concealed
  holdout without exposing cases, labels, rationales, or case-level hints.
- `INDEPENDENTLY-BENCHMARKED`: an authorized independent evaluator reproduces
  the holdout result.

No lower claim may be represented as a higher one.
Receipt schema version 1 therefore permits only `STATIC-VALID` and
`PUBLIC-EVAL-PASSED`. Higher states require a new versioned evidence schema;
they are not dormant enum values that callers may set early.

## Immutable Inputs

`tests/fixtures/engine/acceptance-manifest.v1.json` binds canonical UTF-8 text
by SHA-256. A UTF-8 BOM is removed and CRLF/CR line endings are normalized to LF
before hashing so Git checkouts retain one identity across operating systems:

- the public development dataset;
- the offline replay provider;
- the concealed holdout contract;
- the accepted source prompts used as initial baselines.

Changing any bound file invalidates the manifest. Create a new version rather
than silently updating an accepted hash.

## Holdout Isolation

Generation and revision receive only the public generation context. The tracked
holdout contract contains no hidden cases. A holdout loader may run only after a
candidate is frozen, and the evaluator may emit only aggregate counts and the
dataset and split hashes.

Credential-gated CI or an independent reviewer owns the real holdout material.
The default CI gate remains offline and has no credentials.

## Provenance And Cost

Behavioral receipts must conform to
`schema/engine-evaluation-receipt.schema.json` and record source, dataset, split,
candidate, provider, model, model configuration, seed, tool, environment,
commit, artifact, timestamps, attempts, duration, and usage provenance.
Schema validation establishes structure only. `assertReceiptConsistency` must
also bind public totals and dataset/split hashes to the loaded evaluation
context before a receipt is persisted or used for a claim.

Provider-reported usage and table-estimated usage are distinct. Missing cost is
`null` with source `unknown`; it is never converted to zero. Certification must
reject unknown costs or unequal pricing bases when budget parity is required.

## Failure Controls

Engine operations are bounded by:

- total timeout;
- cancellation;
- maximum attempts;
- cumulative token budget;
- cumulative cost budget;
- known-cost policy.

Retries consume the same cumulative budget. Cancellation and timeout must stop
the caller even when an adapter ignores its abort signal.

## Report Safety

Persisted or displayed reports must reject:

- holdout cases and labels;
- judge-only rationales;
- request authorization and provider secrets;
- repository secrets;
- protected source material supplied to the redaction gate.

The schema and redaction guard are necessary controls, not proof that a future
provider adapter is safe.

## Gate

Run:

```powershell
npm run engine:acceptance
```

The gate validates schemas and fixture hashes, exercises deterministic graders,
proves holdout loader ordering and aggregate-only output, tests report
redaction, enforces claim ordering, and tests retry, timeout, cancellation,
token, cost, and attempt bounds.

After this contract is accepted, the next artifact is a file-by-file salvage
matrix for `origin/codex/prompt-engine-agent-team` with dispositions:
`ACCEPT`, `PORT_WITH_REPAIR`, `REWRITE`, `DEFER`, or `DROP`.
