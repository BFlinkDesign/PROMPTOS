# Blender High-to-Low Conversion Runbook

## Preconditions

- Source file is present under `raw/`.
- Working copy and SHA-256 are recorded.
- Asset class and target budgets are set.
- Blender version and required add-ons are known.
- Blender MCP or Blender Python access is working.

## Procedure

1. Open the duplicated working scene, never the raw file.
2. Normalize units, orientation, transforms, and object naming.
3. Record source triangles, materials, dimensions, origin, and bounding box.
4. Capture close, medium, far, and wireframe screenshots.
5. Remove hidden/internal junk geometry and disconnected debris that is not intentional.
6. Repair normals, holes, non-manifold edges, and material slot drift where automatic repair is safe.
7. Duplicate the repaired high-poly source before creating the optimized candidate.
8. Select the optimization method from the triage playbook:
   - complex/hero: retopo or controlled remesh/decimate, then high-to-low bake;
   - small/filler: smart-low-poly may be retained after inspection;
   - animated/skinned: topology and deformation validation take precedence over raw reduction.
9. Preserve the silhouette and major forms before reducing micro-detail.
10. Create or repair UVs on the optimized mesh.
11. Bake base color and required normal/AO maps from the preserved high-poly source.
12. Validate texture dimensions and visible seams at close range.
13. Create required LODs, collision mesh, and lightmap UVs.
14. Apply stable names and consolidate material slots where safe.
15. Export using the job format and target-engine conventions.
16. Re-import into the target engine or neutral viewer.
17. Re-measure triangle count and confirm materials, scale, origin, LODs, collision, and lightmap behavior.
18. Capture close, medium, and far re-import screenshots.
19. Write the phase patch and advance through the state machine.

## Expected outputs

- optimized mesh;
- base color and required normal/AO textures;
- export file;
- LOD files or engine LOD configuration;
- collision mesh where required;
- target-engine asset;
- before/after/re-import screenshots;
- deterministic state and final report.

## Recovery

- If a destructive operation damages the working file, restore from the preserved working-source copy.
- If bake quality regresses, return to the repaired high-poly and optimized pre-bake copies.
- If engine re-import changes geometry or materials, do not patch over the engine result; correct the export settings or package and re-import again.
- After two unsuccessful targeted repairs, quarantine the asset.
