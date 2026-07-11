# PromptOS Skills

A PromptOS **skill** is an executable package, not a fifth catalog artifact type.

A skill may bundle prompts, workflows, playbooks, runbooks, schemas, templates, deterministic tools, and tests behind one `SKILL.md` entrypoint. This keeps the existing catalog taxonomy intact while giving capable agent hosts a deployable operating package.

## Required package shape

```text
skills/<skill-id>/
  SKILL.md
  manifest.json
  agents/
  playbooks/
  runbooks/
  schema/
  templates/
  tests/
  tools/
```

The manifest declares all required files. `npm run skills:verify` rejects missing references, malformed timestamps, invalid metadata, or failing deterministic tests.

## Design rule

Prefer a deterministic single-agent skill when:

- the work operates on shared mutable state;
- ordered phases and hard gates matter;
- one agent can own execution end to end;
- independent review is needed only at a certification boundary.

Use a standing agent team only when work can be cleanly partitioned into independent artifacts with explicit merge contracts. Do not create a team merely to simulate roles inside one mutable tool session.
