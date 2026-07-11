# AI Mesh Optimization Triage Playbook

Use this before the `optimized` phase.

## Decision tree

### Is the asset animated or skinned?

- **Yes:** do not blind-decimate. Preserve deformation loops, test the rig, and route to manual retopology when deformation breaks.
- **No:** continue.

### Is the asset complex architecture or a hero prop?

- **Yes:** use high-quality/high-poly source, repair defects, create a low-poly candidate, and bake detail high-to-low.
- **No:** continue.

### Is it a small prop or background filler?

- **Yes:** smart-low-poly generation may be acceptable, but inspect holes, UVs, silhouette, and material count before approval.
- **No:** use the complex-asset path.

### Did naive decimation preserve silhouette and texture integrity?

- **Yes:** it may remain part of the pipeline, subject to re-import verification.
- **No:** discard that pass. Repair geometry first, then use controlled remesh, retopo, or selective decimation and rebake.

### Is the target budget impossible without material damage?

- **Yes:** obtain a named authority waiver or quarantine for manual review.
- **No:** continue until the measured budget is met.

## Escalation triggers

Escalate to manual review when any of these persist after two targeted attempts:

- non-manifold geometry;
- large missing surfaces;
- unrecoverable UV seams;
- bake projection corruption;
- skinned deformation collapse;
- target-engine material mismatch;
- triangle or texture budget conflict without authority.
