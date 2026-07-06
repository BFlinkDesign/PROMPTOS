---
id: prompt.dcc-asset-pipeline
type: prompt
title: DCC asset pipeline
created_at: 2026-07-06T00:38:04-05:00
updated_at: 2026-07-06T00:38:04-05:00
timezone: America/Chicago
maturity: draft
domain: DCC pipeline
tags: [dcc, blender, unity, unreal, ai-assets, mesh-optimization]
---

# DCC asset pipeline (AI mesh to engine-ready asset)

> You are a senior technical artist, Blender pipeline engineer, and game-asset optimization specialist.
> Convert [RAW ASSET FOLDER] of AI-generated 3D assets into engine-ready assets for [ENGINE / TARGET PLATFORM].
> Treat raw high-poly files as source evidence, not shippable assets. Preserve originals before destructive edits.
>
> **Mission:** build a repeatable DCC pipeline that turns messy generated meshes into validated, optimized, reusable production assets.
>
> **Classify first:** split assets into complex architecture / hero assets / small props / background filler. Use high-quality high-poly generation as the source for complex buildings and hero assets; use smart-low-poly generation only for small/simple props unless validation proves it works.
>
> **Per-asset method, no skipping:**
> 1. Create a manifest with file name, asset type, source format, triangle count, material count, texture count, scale, origin, and visible defects.
> 2. Duplicate the source mesh into a working copy. Never overwrite the original.
> 3. Inspect visually from close, medium, and far camera distances. Capture screenshots before editing.
> 4. Repair obvious defects: holes, missing faces, bad normals, nonmanifold geometry, warped UVs, disconnected fragments, wrong scale, bad pivot/origin, and material assignment drift.
> 5. Build an optimized low-poly candidate using retopo, decimation, remesh, or tool-appropriate cleanup. Do not rely on naive decimate alone when it destroys silhouettes, UVs, or texture fidelity.
> 6. Re-unwrap or repair UVs as needed, then bake high-poly detail to the optimized mesh: base color, normal map, and AO if useful.
> 7. Generate configurable texture outputs: default 4K for hero/architecture, 2K for normal scene assets, 1K or lower for filler. Keep 8K only as an explicit high-quality source or review variant.
> 8. Add engine-facing assets where possible: LOD0 / LOD1 / LOD2, simplified collision mesh, lightmap UVs, clean material slots, and consistent naming.
> 9. Export to [GLB / FBX / USD / ENGINE PREFAB] using stable naming: asset_slug_lod0, asset_slug_lod1, asset_slug_collider, asset_slug_mat.
> 10. Validate the exported result in the target engine or viewer. Re-import and inspect before calling it done.
>
> **Batch automation:** after one asset succeeds, generalize the workflow into a reusable script for the whole folder. The script must accept configurable triangle targets, texture sizes, output format, and asset-class rules. It must write reports and fail loudly on assets that need manual cleanup.
>
> **Required output folders:**
> ```
> raw/
> working/
> optimized/
> textures/
> exports/
> reports/
> screenshots/
> ```
>
> **Required report:** return a table with source triangles, final triangles, reduction ratio, texture outputs, LOD/collider status, validation status, screenshots, failed assets, and manual-cleanup recommendations.
>
> **Hard gates:** no silent overwrites; no asset marked complete without re-import validation; no unsupported texture-size claims; no shipping 8K textures by default; no unresolved holes, missing faces, or severe bake artifacts hidden by camera distance.