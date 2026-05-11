import { timeline, type TimelineEvent } from "../timeline/timeline-engine";

export type SceneAdmissibility = "admissible" | "conditional" | "blocked";

export interface SceneState {
  id: string;
  branchId: string;
  title: string;
  summary: string;
  continuityInputs: string[];
  consequences: string[];
  unresolvedTensions: string[];
  admissibility: SceneAdmissibility;
}

export const sceneStates: SceneState[] = [
  {
    id: "scene-001",
    branchId: "branch-prime",
    title: "Market evacuation",
    summary: "Elena exits the lower market while the eastern bridge fails behind her.",
    continuityInputs: ["world-neon-district-7", "char-elena-voss"],
    consequences: ["left-arm-injury", "eastern-transit-bridge-damaged"],
    unresolvedTensions: ["unknown actor triggered bridge failure"],
    admissibility: "admissible"
  },
  {
    id: "scene-002",
    branchId: "branch-prime",
    title: "Source file withheld",
    summary: "Ren chooses not to disclose the origin of the courier case.",
    continuityInputs: ["char-elena-voss", "char-ren-kaito"],
    consequences: ["trust-fracture-with-ren", "withheld-information"],
    unresolvedTensions: ["source file authority not verified"],
    admissibility: "conditional"
  }
];

export function getSceneById(id: string) {
  return sceneStates.find((scene) => scene.id === id) ?? null;
}

export function evolveSceneState(scene: SceneState): TimelineEvent {
  const event: TimelineEvent = {
    id: `event-${scene.id}`,
    sceneId: scene.id,
    branchId: scene.branchId,
    title: scene.title,
    consequence: scene.consequences.join("; "),
    timestamp: timeline.length + 1,
    affectedCharacters: scene.continuityInputs.filter((input) => input.startsWith("char-")),
    affectedWorlds: scene.continuityInputs.filter((input) => input.startsWith("world-"))
  };

  timeline.push(event);
  return event;
}
