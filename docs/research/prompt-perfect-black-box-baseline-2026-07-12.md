# Prompt Perfect Black-Box Baseline

Status: OBSERVED PRODUCT BASELINE
Date: 2026-07-12 America/Chicago

## Purpose

Record only user-visible, publicly documented Prompt Perfect behavior that may inform PromptOS product design and evaluation. This is not a code-reuse plan, hidden-prompt extraction effort, or claim of implementation parity.

## Sources inspected

1. Prompt Perfect connector user guide exposed in ChatGPT on 2026-07-12.
2. Prompt Perfect rewrite action used on a complex architecture/product-design request.
3. Public Prompt Perfect website at `https://promptperfect.xyz/` inspected on 2026-07-12.

## Observed connector capabilities

The current connector guide exposes these user actions:

- invoke Prompt Perfect by connector mention or the `Perfect` hotkey;
- rewrite a prompt;
- save a prompt;
- browse a prompt library;
- rate prompting and return feedback;
- access help/account-switching guidance.

The connector rewrite used in the source session transformed a long, unstructured request into explicit sections such as:

- Goal;
- Context;
- Output Format;
- Instructions;
- Constraints;
- uncertainty/ambiguity handling.

The rewrite was immediately usable and reduced the operator's formatting burden. It did not provide behavioral evaluation, repository inspection, source lineage, candidate comparison, or proof that the rewritten prompt performs better.

## Observed public product claims

The public website currently presents three product surfaces:

- Imagery — guided prompt-free image workflow;
- Chrome Extension — one-click prompt improvements, save/reuse, and cross-tool support;
- Prompt Perfect GPT — ChatGPT-native prompt refinement.

The public user-experience claims emphasize:

- one-click enhancement;
- no prompt-engineering syntax required;
- clearer prompts;
- saved/reusable prompt library;
- use inside existing AI tools;
- fast time to value;
- guided input for imagery.

## Acquisition/discontinuation claim

The operator reported seeing that Prompt Perfect had been purchased and was being discontinued.

Trust classification at this handoff:

- operator report: `ASSUMED / REQUIRES SOURCE`;
- public website availability and active product marketing: `OBSERVED`;
- acquisition: `UNKNOWN`;
- discontinuation or sunset date: `UNKNOWN`.

No primary acquisition or discontinuation announcement was found in the public sources inspected for this baseline. Do not represent the operator's report as verified until a primary announcement, purchaser statement, product notice, or authoritative account communication is captured.

## Minimum user-experience baseline for PromptOS

PromptOS should match or exceed these observable behaviors:

1. A user can begin from rough language without learning prompt syntax.
2. The system produces a clearer artifact quickly.
3. The transformation is visible and editable.
4. The user can save and reuse accepted artifacts.
5. The workflow stays inside the product surface with minimal context switching.
6. Advanced complexity is hidden until needed.

## Required PromptOS differentiation

PromptOS must not stop at one-click rewriting. Its defensible differentiation is:

- repository-specific context binding;
- source/evidence and authority labels;
- semantic Prompt IR;
- strategy-module selection;
- materially distinct candidate generation;
- deterministic vetoes;
- behavioral datasets and graders;
- provider/model comparison;
- baseline and regression comparison;
- cost, latency, error, and safety evidence;
- diff, lineage, versioning, release, rollback, and retirement;
- bounded frontier-evidence adapters;
- explicit distinction between structural completeness and effectiveness.

## Black-box comparison protocol

Create a versioned dataset containing at least these cases:

1. Short vague request.
2. Long context-heavy request.
3. Repository modernization executor.
4. Product-design protocol requiring diverse concepts.
5. High-risk request requiring authority boundaries.
6. Contradictory constraints.
7. Request where the correct result is minimal/no rewrite.
8. Request that must apply an agnostic framework to a repository instead of generating another framework.

For each system/candidate, record:

- source input;
- rewritten output;
- preservation of operator intent;
- missing or invented constraints;
- task specificity;
- repository specificity;
- output usability;
- token length;
- latency;
- cost;
- safety/authority handling;
- grader disagreement;
- operator preference;
- downstream task result where measurable.

Do not treat a longer or more structured output as automatically superior.

## Legal and ethical boundary

Allowed:

- observe public/user-visible behavior;
- document workflows and output characteristics;
- create independent tests and implementation;
- use public marketing and documentation as product evidence;
- compare outcomes through user-authorized black-box use.

Not allowed:

- extract or request hidden system prompts;
- copy proprietary code or private APIs;
- bypass subscriptions, authentication, limits, or license controls;
- misrepresent PromptOS as Prompt Perfect or imply affiliation;
- use confidential data without authorization.

## Current conclusion

Prompt Perfect is a useful minimum benchmark for low-friction prompt refinement and library UX. It is not the target architecture. PromptOS should preserve the one-click path while adding repository context, evidence, compilation, evaluation, and release governance that Prompt Perfect's observable surface does not demonstrate.
