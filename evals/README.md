# PromptOS evals

Two layers, matching PromptOS's own doctrine -- *"deterministic systems do the
volume; models run only on survivors and are validated deterministically."*

## Layer 1 -- deterministic structure gate (free, in CI)

`lint_prompt_structure.py` runs on every PR that touches `prompts/`. Zero model
calls, zero tokens. It **hard-fails** only on genuinely broken prompts (empty,
or no `# ` title) and emits informational **warnings** for missing
reusability/gate signals.

It deliberately does **not** enforce a rigid `Inputs / Rules / Gates` section
schema. The repo's prompts embed those inline in a method blockquote (see
`prompts/scope-pipeline.md`), so a rigid-schema linter would false-fail good
prompts. Start conservative; tighten only against real, verified structure.

Run locally:

    python evals/lint_prompt_structure.py

## Layer 2 -- behavioral regression (opt-in, costs tokens)

`promptfooconfig.yaml` is a [promptfoo](https://www.promptfoo.dev) scaffold for
pinning a prompt's *behavior* (not just structure) when you edit it. It is
**not** wired into CI-on-every-push -- running a prompt through a model on every
PR would burn tokens. Run it manually when you change a prompt's intent:

    export ANTHROPIC_API_KEY=...
    npx promptfoo@latest eval -c evals/promptfooconfig.yaml

Extend by adding one `tests:` block per prompt you want behaviorally pinned.

## Framework choice (why promptfoo here)

- **promptfoo** -- pragmatic, YAML-driven, CI-friendly prompt regression +
  red-team. The right tool for "does this prompt still behave after I edit it."
- **Inspect AI** (UK AISI) -- north-star for heavier agent/workflow/tool evals
  later; more setup than a prompt library needs today.
- **lm-evaluation-harness** (EleutherAI) -- measures *model capability* on
  academic benchmarks (MMLU, GSM8K). Not a prompt-regression tool; use only for
  model-vs-model comparability, not as the PromptOS test harness.
