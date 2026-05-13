# SolaceFrame V26 Delta — Spatial Reality Runtime

## What V26 adds

V26 moves SolaceFrame from continuity adjudication alone into **spatial reality adjudication**.

The runtime now resolves:

- scene-local spatial frame
- active/dormant/suppressed spatial anchors
- object permanence anchors
- anatomical persistence anchors
- spatial pressure
- bounded spatial admissibility
- compact V26 prompt payloads

## Why this matters

V25 correctly separated global canonical truth from scene-local render truth. V26 applies that same boundary to locations, rooms, objects, environmental residue, and body-location continuity.

The result: the runtime can preserve canonical truth without forcing unrelated bridge damage, rain pressure, or another character's injury into a bedroom, bathroom, lobby, or mirror scene.

## Files changed

- `apps/studio/lib/runtime/spatial-runtime.ts`
  - New V26 spatial/object/body anchor resolver.
  - Produces `v26.spatialRealityRuntime` packets.
  - Writes next `worlds.spatial_state` and `worlds.object_state` payloads.

- `apps/studio/app/api/runtime/route.ts`
  - Calls V26 after V25 continuity resolution.
  - Persists spatial/object state into existing Supabase JSON columns.
  - Includes V26 state in lineage payloads and render packet construction.
  - Keeps provider prompt compact by summarizing V26 instead of dumping all dormant anchors.

- `apps/studio/lib/runtime/engine.ts`
  - Removes hardwired Elena-only injury behavior.
  - Resolves the primary scene character dynamically.
  - Adds anatomical event types for wounds, bandages, scars, and tattoos.
  - Persists anatomical state back to `characters.anatomical_state`.
  - Resolves location damage against the current scene location instead of always using the eastern bridge.

- `supabase/v26_spatial_runtime_indexes.sql`
  - Optional hot-path indexes for existing JSON columns.
  - No new tables required.

## Supabase impact

No table creation is required. V26 uses existing columns already present in the supplied schema:

- `worlds.spatial_state`
- `worlds.object_state`
- `worlds.memory_state`
- `characters.anatomical_state`
- `render_jobs.packet`
- `lineage_events.payload`

The optional SQL file only adds indexes for better query behavior as these JSON states grow.

## Build verification

Validated with:

```bash
cd apps/studio
npm run build
```

Result: build completed successfully.
