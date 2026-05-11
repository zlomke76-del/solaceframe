export interface TimelineEvent {
  id: string;
  sceneId: string;
  branchId: string;
  title: string;
  consequence: string;
  timestamp: number;
  affectedCharacters: string[];
  affectedWorlds: string[];
}

export const timeline: TimelineEvent[] = [
  {
    id: "event-001",
    sceneId: "scene-001",
    branchId: "branch-prime",
    title: "Eastern bridge collapse",
    consequence: "district transit is rerouted and Elena's left arm is injured",
    timestamp: 1,
    affectedCharacters: ["char-elena-voss"],
    affectedWorlds: ["world-neon-district-7"]
  },
  {
    id: "event-002",
    sceneId: "scene-002",
    branchId: "branch-prime",
    title: "Ren withholds source file",
    consequence: "trust state between Elena and Ren degrades",
    timestamp: 2,
    affectedCharacters: ["char-elena-voss", "char-ren-kaito"],
    affectedWorlds: ["world-neon-district-7"]
  }
];

export function addEvent(event: TimelineEvent) {
  timeline.push(event);
  return event;
}

export function getTimelineByBranch(branchId: string) {
  return timeline
    .filter((event) => event.branchId === branchId)
    .sort((a, b) => a.timestamp - b.timestamp);
}
