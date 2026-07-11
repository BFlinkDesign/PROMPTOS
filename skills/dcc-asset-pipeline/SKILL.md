---
name: dcc-asset-pipeline
description: Convert AI-generated 3D meshes into validated engine-ready assets through a deterministic single-agent pipeline with explicit budgets, evidence gates, quarantine, and independent verification. Use for Blender MCP/Blender Python workflows targeting Unity, Unreal, WebGL, AR, GLB, FBX, or USD.
---

# DCC Asset Pipeline

## Architecture

Use **one operator agent** to own the mutable DCC scene and a **fresh independent verifier execution** after engine re-import. Do not use a standing agent team: multiple agents editing the same Blender scene create state conflicts, duplicated work, and unverifiable handoffs. Parallelize only across fully isolated source copies after this skill has passed on a representative mixed batch.

This skill is deterministic where determinism matters:

- phase order is fixed;
- source files are immutable;
- budgets are explicit;
- every phase requires machine-readable evidence;
- transitions are enforced by `tools/state-machine.mjs`;
- unresolved failures quarantine the asset;
- completion requires an independent verification identity.

The operator may use judgment inside a phase, but cannot skip or self-certify a gate.

## Inputs

Create a job file from `templates/job.example.json` with:

- target engine and platform;
- export format;
- triangle and texture budgets;
- LOD, collision, and lightmap requirements;
- commercial-use status;
- one or more source assets;
- generator, model, license, and reference provenance for each asset;
- a unique operator execution ID.

Do not start a commercial job when commercial-use rights are not explicitly cleared.

## Required workspace

```text
raw/            immutable generated source files
references/     concept/reference images and provenance
working/        duplicated editable scene files
optimized/      cleaned low-poly working meshes
textures/       baked and compressed texture outputs
exports/        GLB/FBX/USD/engine export packages
reports/        state, findings, waivers, and final reports
screenshots/    close/medium/far and wireframe evidence
manual-review/  quarantined assets and unresolved defects
```

## Start

From the skill directory:

```powershell
node tools/state-machine.mjs init templates/job.example.json reports/state.json
node tools/state-machine.mjs check reports/state.json
```

Copy the example first; do not edit the canonical template in place. Phase patch examples are under `templates/patches/`.

## Deterministic phase sequence

```text
intake
→ preserved
→ inspected
→ optimized
→ baked
→ packaged
→ reimported
→ verified
→ complete
```

`quarantined` is a terminal exception state for assets that require manual intervention.

### 1. Preserved

Before any destructive operation:

- copy the original into `working/`;
- compute the original SHA-256 with `node tools/hash-file.mjs RAW_FILE`;
- record both in a patch JSON;
- advance only after the source copy and hash exist.

```powershell
node tools/state-machine.mjs advance reports/state.json ASSET_ID preserved PATCH.json OPERATOR_ID
```

### 2. Inspected

Run the read-only Blender probe when Blender is available:

```powershell
blender --background working/ASSET.blend --python tools/blender-inventory.py -- reports/ASSET-inventory.json
```

Record:

- source triangle count;
- material count;
- close, medium, far, and wireframe screenshots;
- visible defects and likely manual-risk areas.

Use `playbooks/asset-triage.md` to select the optimization strategy.

### 3. Optimized

Use the least destructive method that meets the target:

1. remove hidden/internal junk geometry;
2. repair holes, normals, fragments, and material drift;
3. retopologize, remesh, or decimate under controlled conditions;
4. preserve silhouette before micro-detail;
5. emit the optimized mesh and measured triangle count.

A triangle count above budget is blocked unless the patch contains an approved waiver with both authority and reason.

### 4. Baked

Bake high-poly detail to the optimized mesh:

- base color is required;
- normal map is required for complex architecture, hero props, and animated/skinned assets unless the job overrides it;
- AO is optional but recommended for static assets;
- texture maximum dimension must remain within budget unless an approved waiver exists.

Do not ship 8K textures by default. Treat them as source/review variants unless the target budget explicitly supports them.

### 5. Packaged

Produce the engine-facing package:

- export file;
- LODs when required;
- simplified collision mesh when required;
- lightmap UV confirmation when required;
- stable naming and material assignments.

Follow `runbooks/blender-high-to-low.md` for the Blender execution sequence.

### 6. Reimported

Re-import into the target engine or a neutral viewer. Record:

- engine asset path;
- re-imported triangle count;
- close, medium, and far screenshots.

The re-imported triangle count must match the exported final count. A successful export without re-import evidence is not complete.

### 7. Verified

Start a fresh verifier execution using `agents/verifier.md`. The verifier must:

- use a different execution ID from the operator;
- read the state and evidence without modifying the asset;
- verify mesh budget, texture budget, required outputs, re-import integrity, and visible quality;
- write a verification patch with every check marked pass or fail.

The operator cannot verify its own work.

### 8. Complete

Advance to `complete` only when:

- verification result is `pass`;
- no blockers remain;
- all target-dependent outputs are present.

Generate the final report:

```powershell
node tools/state-machine.mjs report reports/state.json reports/final-report.md
node tools/state-machine.mjs check reports/state.json
```

## Bounded repair loop

For any failed phase:

1. diagnose the specific failed gate;
2. make one targeted repair;
3. re-measure and re-capture evidence;
4. retry once more if the second result materially improves;
5. after two failed automated repair attempts, quarantine the asset with a concrete blocker.

Do not loop indefinitely or hide repeated failure behind additional decimation, texture resolution, or camera distance.

## Quarantine

Use `quarantined` when:

- source rights are unresolved;
- source geometry cannot be repaired automatically;
- required texture bake remains visibly corrupted;
- target budget cannot be met without unacceptable damage;
- engine re-import changes geometry or materials;
- independent verification fails twice.

A quarantine patch must include at least one blocker. Move supporting material into `manual-review/` and preserve the state file.

## Batch mode

Do not automate the whole folder until one representative complex asset and one representative simple prop have completed successfully.

After that:

- process separate source copies;
- keep one state entry per asset;
- never share a mutable Blender scene between concurrent workers;
- fail one asset independently without corrupting the rest of the batch;
- emit one final job report plus per-asset evidence.

## Hard prohibitions

- Never overwrite `raw/`.
- Never skip a phase.
- Never claim visual quality without captured evidence.
- Never use naive decimation as the only production method for a complex asset.
- Never treat export success as engine validation.
- Never approve a commercial asset with unresolved license status.
- Never let the operator self-verify.
- Never continue after a deterministic gate fails without a repair, waiver, or quarantine record.
