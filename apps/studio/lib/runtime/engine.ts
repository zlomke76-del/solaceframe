import type { Admissibility, DriftRisk, RuntimeCharacter, RuntimeWorld } from "./types";

export type SceneAnalysis = {
  title: string;
  admissibility: Admissibility;
  driftRisk: DriftRisk;
  preserve: string[];
  mutated: string[];
  violations: string[];
  packet: Record<string, unknown>;
};

export function analyzeScene(sceneText: string, world: RuntimeWorld, characters: RuntimeCharacter[]): SceneAnalysis {
  const lower = sceneText.toLowerCase();

  const preserve = new Set<string>();
  const mutated = new Set<string>();
  const violations = new Set<string>();

  if (lower.includes("elena")) preserve.add("Elena identity anchor");
  if (lower.includes("ren")) preserve.add("Ren relationship state");
  if (lower.includes("courier") || lower.includes("case")) preserve.add("yellow courier case lineage");
  if (lower.includes("injury") || lower.includes("arm")) preserve.add("physical injury continuity");
  if (lower.includes("bridge")) preserve.add("bridge damage continuity");

  if (lower.includes("flood") || lower.includes("rain") || lower.includes("storm")) mutated.add("environment pressure");
  if (lower.includes("trust") || lower.includes("withhold") || lower.includes("hide")) mutated.add("relationship pressure");
  if (lower.includes("repair") || lower.includes("heal")) mutated.add("repair pathway requested");

  if (lower.includes("reset")) violations.add("state reset requested without branch repair");
  if (lower.includes("erase")) violations.add("lineage erasure requested");
  if (lower.includes("ignore continuity")) violations.add("continuity bypass requested");

  let driftRisk: DriftRisk = "low";
  if (mutated.size >= 2) driftRisk = "medium";
  if (violations.size > 0) driftRisk = "high";

  const admissibility: Admissibility =
    violations.size > 0 ? "blocked" : driftRisk === "medium" ? "conditional" : "allow";

  return {
    title: makeSceneTitle(sceneText),
    admissibility,
    driftRisk,
    preserve: Array.from(preserve),
    mutated: Array.from(mutated),
    violations: Array.from(violations),
    packet: {
      mode: "image_scene",
      sceneText,
      world: {
        id: world.id,
        name: world.name,
        pressure: world.pressure,
        state: world.state
      },
      characters: characters.map((character) => ({
        id: character.id,
        name: character.name,
        state: character.state,
        continuityScore: character.continuity_score,
        pressure: character.pressure
      })),
      preserve: Array.from(preserve),
      mutated: Array.from(mutated),
      violations: Array.from(violations),
      admissibility,
      driftRisk
    }
  };
}

export function mutateWorld(world: RuntimeWorld, analysis: SceneAnalysis): RuntimeWorld {
  const nextPressure = Math.min(
    100,
    world.pressure + (analysis.driftRisk === "high" ? 18 : analysis.driftRisk === "medium" ? 8 : 3)
  );

  const currentEvents = Array.isArray(world.state.events) ? world.state.events : [];
  const currentObjects = Array.isArray(world.state.persistentObjects) ? world.state.persistentObjects : [];

  const nextObjects = new Set<string>(currentObjects.map(String));

  if (analysis.preserve.some((item) => item.includes("courier"))) {
    nextObjects.add("yellow courier case");
  }

  return {
    ...world,
    pressure: nextPressure,
    state: {
      ...world.state,
      pressureTrend: nextPressure > world.pressure ? "increasing" : "stable",
      persistentObjects: Array.from(nextObjects),
      events: [
        ...currentEvents,
        {
          at: new Date().toISOString(),
          title: analysis.title,
          admissibility: analysis.admissibility,
          driftRisk: analysis.driftRisk,
          mutated: analysis.mutated
        }
      ]
    }
  };
}

export function mutateCharacters(characters: RuntimeCharacter[], sceneText: string, analysis: SceneAnalysis): RuntimeCharacter[] {
  const lower = sceneText.toLowerCase();

  return characters.map((character) => {
    const isReferenced = lower.includes(character.name.toLowerCase().split(" ")[0]);
    if (!isReferenced) return character;

    const currentHistory = Array.isArray(character.state.history) ? character.state.history : [];

    const pressureIncrease = analysis.driftRisk === "high" ? 12 : analysis.driftRisk === "medium" ? 6 : 2;
    const continuityDrop = analysis.driftRisk === "high" ? 8 : analysis.driftRisk === "medium" ? 3 : 1;

    return {
      ...character,
      pressure: Math.min(100, character.pressure + pressureIncrease),
      continuity_score: Math.max(0, character.continuity_score - continuityDrop),
      state: {
        ...character.state,
        emotionalState: lower.includes("trust") || lower.includes("hide") ? "strained" : character.state.emotionalState,
        history: [
          ...currentHistory,
          {
            at: new Date().toISOString(),
            sceneTitle: analysis.title,
            effect: analysis.mutated
          }
        ]
      }
    };
  });
}

function makeSceneTitle(sceneText: string) {
  const trimmed = sceneText.trim();
  if (!trimmed) return "Untitled scene";

  const first = trimmed.split(/[.!?]/)[0] ?? trimmed;
  return first.length > 52 ? `${first.slice(0, 52)}...` : first;
}
