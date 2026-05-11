export interface RealityBranch {
  id: string;
  name: string;
  parentBranchId?: string;
  divergencePoint?: string;
  continuityIntegrity: number;
  status: "active" | "archived" | "requires-review";
}

export const realityBranches: RealityBranch[] = [
  {
    id: "branch-prime",
    name: "Prime Continuity",
    continuityIntegrity: 0.94,
    status: "active"
  },
  {
    id: "branch-evacuation-fails",
    name: "Evacuation Failure Variant",
    parentBranchId: "branch-prime",
    divergencePoint: "scene-001",
    continuityIntegrity: 0.82,
    status: "requires-review"
  },
  {
    id: "branch-ren-discloses",
    name: "Ren Disclosure Variant",
    parentBranchId: "branch-prime",
    divergencePoint: "scene-002",
    continuityIntegrity: 0.89,
    status: "active"
  }
];

export function forkBranch(branch: RealityBranch) {
  realityBranches.push(branch);
  return branch;
}
