# DCC AI asset pipeline workflow

Purpose: convert AI-generated 3D assets into engine-ready production assets through a controlled DCC pipeline.

This workflow is for Blender, Unity, Unreal, WebGL, AR/GLB, and similar 3D production targets. It is especially useful when generated models look visually promising but have excessive triangles, bad topology, warped UVs, holes, inconsistent scale, or texture-bake problems.

## Operating doctrine

AI-generated assets are raw material, not deliverables. The deliverable is the validated, optimized, re-imported engine asset plus the report proving what changed.

The correct pattern is:

```text
concept/reference → raw high-poly generation → defect inspection → optimized mesh → UV repair → high-to-low bake → LOD/collider/lightmap prep → engine export → re-import validation → batch automation
```

## When to use this workflow

Use it when the project involves any of the following:

- AI-generated high-poly meshes from image-to-3D or text-to-3D tools.
- Blender MCP / Claude Code / Codex / Cursor agents operating Blender or another DCC tool.
- Unity, Unreal, WebGL, AR, GLB, FBX, USD, or game-ready asset preparation.
- Repeated mesh cleanup where a one-off manual fix should become a script.
- Client-facing 3D visualization, signage/AEC visualization, virtual environments, product configurators, or app/world-building assets.

Do not use it as a shortcut for final hero art without human review. Use it to accelerate technical cleanup and generate auditable asset-conditioning passes.

## Asset-class decision matrix

| Asset class | Recommended source mode | Target triangle range | Required hardening |
| --- | --- | ---: | --- |
| Complex building / architecture | High-quality high-poly first, optimize after | 20K-40K LOD0 unless engine budget says lower | UV repair, bake, LODs, collider, lightmap UV |
| Hero prop | High-quality high-poly first, optimize after | 10K-30K LOD0 | close-view bake review, material cleanup, LODs |
| Small prop | Smart-low-poly acceptable if validated | 2K-10K | scale/origin, material cleanup, optional LOD |
| Background filler | Smart-low-poly or simplified generation | 500-5K | aggressive compression, batching, LOD/culling |
| Animated/skinned asset | Avoid blind decimation | budget-specific | topology review, rig/deform validation |

## Folder contract

```text
raw/          original generated files; immutable
working/      duplicated editable scene files
optimized/    cleaned meshes before engine packaging
textures/     baked and compressed texture outputs
exports/      GLB/FBX/USD/prefab exports
reports/      JSON/Markdown asset reports
screenshots/  before/after validation images
```

## Phase 1 - Ingest and manifest

1. Inventory every file in `raw/`.
2. Record file name, source tool, prompt or reference if available, format, size, mesh count, material count, texture count, triangle count, dimensions, origin, and orientation.
3. Classify each asset by asset class.
4. Flag obvious risks: extreme triangle count, holes, bad normals, broken UVs, missing texture references, too many materials, weird scale, bad pivot, disconnected fragments, or transparency artifacts.
5. Create `reports/manifest.json` before editing anything.

Gate: no processing starts until the source inventory exists.

## Phase 2 - First visual inspection

For each asset:

1. Load source into Blender or the active DCC tool.
2. Capture close, medium, and far screenshots.
3. Inspect shaded, material preview, UV, and wireframe views.
4. Write visible defects into the asset report.

Gate: no asset can be marked clean without screenshot evidence.

## Phase 3 - Optimization strategy

Choose the least destructive method that meets the asset target.

Preferred order:

1. Remove hidden/internal junk geometry.
2. Repair holes, normals, disconnected fragments, and material slot drift.
3. Use controlled decimation/remesh/retopo only after defect repair.
4. Preserve silhouette and major visual read before reducing micro detail.
5. Rebuild or repair UVs when the original UVs cannot survive reduction.
6. Bake high-poly visual detail into the optimized mesh.

Hard rule: naive decimate is a test, not a production method. If it warps textures, breaks silhouettes, or creates visible artifacts, discard that pass.

## Phase 4 - Bake and texture outputs

Required outputs:

- base color / albedo
- normal map when high-poly detail matters
- ambient occlusion when useful for static assets
- roughness/metallic only when the material model requires it

Texture policy:

| Use case | Default max texture |
| --- | ---: |
| hero/close inspection | 4K |
| normal scene asset | 2K |
| filler/background | 1K or lower |
| source/review variant only | 8K |

Gate: 8K textures are not default shippable output. They must be justified by target platform and viewing distance.

## Phase 5 - Engine readiness

Add or verify:

- LOD0 / LOD1 / LOD2 where useful.
- Simplified collision mesh.
- Lightmap UVs for static lighting workflows.
- Correct scale.
- Correct orientation.
- Correct origin/pivot.
- Stable naming.
- Material consolidation.
- Texture compression plan.
- Occlusion/culling assumptions for scene-scale use.

Naming convention:

```text
asset_slug_source
asset_slug_working
asset_slug_lod0
asset_slug_lod1
asset_slug_lod2
asset_slug_collider
asset_slug_mat
asset_slug_basecolor_2k
asset_slug_normal_2k
asset_slug_ao_2k
```

## Phase 6 - Export and re-import validation

1. Export to the required format: GLB, FBX, USD, Unity prefab, Unreal asset, or project-specific package.
2. Re-import into the target engine or a neutral viewer.
3. Validate from close, medium, and far views.
4. Confirm triangle count, material assignment, texture link integrity, scale, origin, and collision/lightmap status.
5. Capture final screenshots.

Gate: if it has not been re-imported and inspected, it is not done.

## Phase 7 - Batch automation

After one asset passes:

1. Convert the successful steps into a Python or tool-native script.
2. Parameterize triangle targets, texture sizes, asset-class rules, export format, and output folder.
3. Run the script on a small mixed batch first.
4. Fail loudly when defects exceed automatic repair confidence.
5. Emit a per-asset report and summary table.

Do not trust automation until it succeeds across multiple asset shapes, not just the original test asset.

## Required final report

Return a table with:

| Field | Required |
| --- | --- |
| Asset name | yes |
| Asset class | yes |
| Source format | yes |
| Source triangles | yes |
| Final triangles | yes |
| Reduction ratio | yes |
| Texture outputs | yes |
| LOD status | yes |
| Collision status | yes |
| Lightmap UV status | yes |
| Re-import validation | yes |
| Screenshots | yes |
| Warnings/manual fixes | yes |

## Failure modes and controls

| Failure mode | Control |
| --- | --- |
| Texture looks acceptable only from far away | Review close, medium, and far screenshots. |
| Topology is acceptable for static mesh but not animation | Classify animated/skinned assets separately. |
| 8K textures hide bad geometry | Test 4K and 2K variants before approving. |
| Unity/Unreal import works but runtime performance fails | Require LODs, compression, material consolidation, and culling assumptions. |
| Script works on one model only | Validate on a mixed batch before generalizing. |
| Asset loses source traceability | Preserve raw source, manifest, screenshots, and reports. |

## Copy-paste execution prompt

Use `prompts/dcc-asset-pipeline.md` when handing this workflow to an agent.