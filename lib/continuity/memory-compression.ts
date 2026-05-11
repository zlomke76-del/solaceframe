import { sceneStates } from "../scenes/scene-state-engine";
import { timeline } from "../timeline/timeline-engine";

export interface ContinuityMemorySummary {
  branchId: string;
  summary: string;
  unresolvedConsequences: string[];
  nextGenerationConstraints: string[];
}

export function compressContinuityMemory(branchId: string): ContinuityMemorySummary {
  const scenes = sceneStates.filter((scene) => scene.branchId === branchId);
  const events = timeline.filter((event) => event.branchId === branchId);

  const unresolvedConsequences = scenes.flatMap((scene) => scene.unresolvedTensions);

  return {
    branchId,
    summary: `${events.length} events and ${scenes.length} scenes are active in this branch. The world state must preserve prior physical damage, character injury, and degraded trust.`,
    unresolvedConsequences,
    nextGenerationConstraints: [
      "Elena must retain left-arm injury until explicitly healed.",
      "Eastern bridge damage must remain visible or be narratively repaired.",
      "Ren and Elena should not reset to neutral trust.",
      "The yellow courier case remains a persistent object."
    ]
  };
}

export const activeMemorySummary = compressContinuityMemory("branch-prime");
