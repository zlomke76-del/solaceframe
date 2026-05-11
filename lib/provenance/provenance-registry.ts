export interface ProvenanceEvent {
  id: string;
  assetId: string;
  sceneId: string;
  branchId: string;
  action:
    | "scene-created"
    | "state-evolved"
    | "render-prepared"
    | "continuity-repaired"
    | "operator-approved";
  createdAt: string;
  governanceDecision: "allow" | "conditional" | "blocked";
}

export const provenanceEvents: ProvenanceEvent[] = [
  {
    id: "prov-001",
    assetId: "asset-scene-001-keyframe",
    sceneId: "scene-001",
    branchId: "branch-prime",
    action: "scene-created",
    createdAt: new Date("2026-05-11T16:00:00Z").toISOString(),
    governanceDecision: "allow"
  },
  {
    id: "prov-002",
    assetId: "asset-scene-002-keyframe",
    sceneId: "scene-002",
    branchId: "branch-prime",
    action: "state-evolved",
    createdAt: new Date("2026-05-11T16:12:00Z").toISOString(),
    governanceDecision: "conditional"
  }
];
