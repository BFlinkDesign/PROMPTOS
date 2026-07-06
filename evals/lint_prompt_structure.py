#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Deterministic PromptOS prompt-structure linter (zero-token CI gate).

Doctrine (PromptOS README): "Deterministic systems do the volume; models run
only on survivors and are validated deterministically." This linter is the
free volume gate -- it never calls a model. Behavioral checks live in the
promptfoo layer (evals/promptfooconfig.yaml), which is opt-in.

Scope (deliberately minimal, to NOT false-fail the repo's real prompt style):
prompts here are a `# Title` + an inline method (often a blockquote) with
[UPPERCASE PLACEHOLDER] parameters and gate language embedded in the steps --
NOT a rigid Inputs/Rules/Gates section schema. So this linter checks only
universally-safe signals and HARD-FAILS on just two things:
  1. empty file
  2. no top-level `# ` title in the first 3 non-blank lines
Everything else is an informational WARN, never a failure.

Exit 0 = all prompts pass the hard checks (warnings allowed).
Exit 1 = at least one prompt hard-failed.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

PLACEHOLDER_RE = re.compile(r"\[[A-Z][A-Z0-9 /_-]{1,40}\]")
GATE_RE = re.compile(
    r"\b(verify|gate|trust|untrusted|hard-?block|proof|cite|citation)\b", re.I
)


def lint_one(path: Path):
    text = path.read_text(encoding="utf-8", errors="replace")
    hard_fails: list[str] = []
    warns: list[str] = []

    if not text.strip():
        hard_fails.append("empty file")
        return hard_fails, warns

    non_blank = [ln for ln in text.splitlines() if ln.strip()][:3]
    if not any(ln.lstrip().startswith("# ") for ln in non_blank):
        hard_fails.append("no top-level `# ` title in first 3 non-blank lines")

    if not PLACEHOLDER_RE.search(text):
        warns.append(
            "no [PLACEHOLDER] parameter found (is this prompt reusable/parameterized?)"
        )
    if not GATE_RE.search(text):
        warns.append(
            "no verify/gate/trust keyword (PromptOS prompts usually carry a "
            "verification step)"
        )
    return hard_fails, warns


def main() -> int:
    if not PROMPTS_DIR.is_dir():
        print(f"ERROR: prompts dir not found at {PROMPTS_DIR}")
        return 1
    files = sorted(PROMPTS_DIR.glob("*.md"))
    if not files:
        print(f"ERROR: no prompt .md files under {PROMPTS_DIR}")
        return 1

    any_fail = False
    print(f"Linting {len(files)} prompt(s) in {PROMPTS_DIR.name}/\n")
    for f in files:
        hard, warns = lint_one(f)
        if hard:
            any_fail = True
            print(f"FAIL  {f.name}")
            for h in hard:
                print(f"        - {h}")
        else:
            print(f"{'PASS ' if not warns else 'PASS*'} {f.name}")
        for w in warns:
            print(f"        ~ warn: {w}")
    print()
    print(
        "RESULT:",
        "FAIL (one or more prompts hard-failed)"
        if any_fail
        else "OK (all prompts pass hard checks; * = has warnings)",
    )
    return 1 if any_fail else 0


if __name__ == "__main__":
    sys.exit(main())
