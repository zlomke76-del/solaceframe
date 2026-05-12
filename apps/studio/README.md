# SolaceFrame — Governed Synthetic Reality Runtime

## Current State: V14 Runtime Governance Delta

SolaceFrame is no longer positioned as a static prompt-to-image shell. The current build is a governed synthetic continuity runtime backed by Next.js, Vercel, Supabase, branch-aware state, persistent causal lineage, and runtime admissibility evaluation.

The working schema is isolated under:

```text
solaceframe
```

Current runtime tables include:

```text
projects
worlds
branches
characters
scenes
render_jobs
lineage_events
continuity_diffs
artifacts
causal_events
contradictions
```

## V14 Adds

### 1. Runtime Admissibility Engine

The studio now computes a runtime admissibility report from actual persisted state rather than only displaying heuristic UI language.

Inputs:

- unresolved contradictions
- unrepaired irreversible causal events
- active branch divergence
- world pressure
- computed continuity survivability

Outputs:

- `allow`
- `conditional`
- `blocked`

The report is returned inside `/api/runtime` as:

```ts
state.admissibilityReport
```

### 2. True Branch Forking

V14 adds an executable branch fork action:

```json
{
  "action": "fork_branch",
  "name": "Continuity Repair Fork",
  "reason": "Operator forked branch from active runtime state."
}
```

This creates a new branch with:

- `parent_branch_id`
- inherited runtime snapshot
- divergence tracking
- fork reason
- lineage event
- active project branch update

This is not cosmetic UI branching. The fork persists an inherited state snapshot and changes the active runtime branch.

### 3. Contradiction Resolution

V14 adds an executable contradiction repair action:

```json
{
  "action": "resolve_contradiction",
  "contradictionId": "<uuid>",
  "repairNote": "Resolved through governed repair lineage."
}
```

This creates:

- a repair causal event
- contradiction resolution state
- `resolved_at`
- repair causal event linkage
- repair note
- world pressure reduction
- lineage event

Contradictions are now repairable runtime objects instead of static warnings.

### 4. Causal Graph Infrastructure

Causal events now support:

- `parent_event_id`
- `repair_event_id`
- `reversibility`
- `repaired`

Supported reversibility values:

```text
reversible
repairable
irreversible
```

This establishes the foundation for causal replay, rollback analysis, repair lineage, and admissibility-aware consequence traversal.

### 5. Studio UI Upgrade

The studio now surfaces:

- runtime admissibility decision
- survivability score
- active branch status
- world pressure
- branch divergence
- open contradiction count
- irreversible event count
- branch fork control
- contradiction repair controls
- causal graph metadata
- latest render packet
- latest continuity diff

## Required Migration

Apply this migration before deploying the V14 code:

```text
supabase/migrations/20260511_v14_runtime_governance_delta.sql
```

Without this migration, V14 code will fail when inserting branch snapshots, causal reversibility fields, or contradiction repair linkage.

## Runtime Mental Model

SolaceFrame is being built as governed synthetic continuity infrastructure.

The objective is not simply image or video generation. The objective is:

- persistent continuity
- admissible runtime evolution
- causal consequence propagation
- governed branch divergence
- contradiction repair
- traceable synthetic lineage
- render packets constrained by prior state

The core operating principle remains:

```text
No continuity basis → no clean execution path → no admissible render action.
```

## Development

From the repo root:

```bash
npm install
npm run build
```

For the studio app directly:

```bash
cd apps/studio
npm install
npm run build
npm run dev
```


## V15 Execution Layer

V15 adds governed render execution on top of the V14 continuity runtime. Render jobs can now move through an execution lifecycle, produce persisted artifacts, and hand governed packets to an external image/video renderer through `SOLACEFRAME_RENDER_WEBHOOK_URL`. If no renderer is configured, image jobs produce a local SVG placeholder artifact and video/storyboard jobs persist the execution packet for downstream workers.
