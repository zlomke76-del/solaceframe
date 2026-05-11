export interface CharacterProfile {
  id: string;
  name: string;
  appearanceLock: boolean;
  continuityScore: number;
  emotionalState: string;
  activeWorldId: string;
  lineage: string[];
  unresolvedConsequences: string[];
}

export const characterRegistry: CharacterProfile[] = [
  {
    id: "char-elena-voss",
    name: "Elena Voss",
    appearanceLock: true,
    continuityScore: 0.96,
    emotionalState: "guarded but focused",
    activeWorldId: "world-neon-district-7",
    lineage: ["origin-profile", "scene-001", "scene-002"],
    unresolvedConsequences: ["left-arm-injury", "trust-fracture-with-ren"]
  },
  {
    id: "char-ren-kaito",
    name: "Ren Kaito",
    appearanceLock: true,
    continuityScore: 0.91,
    emotionalState: "conflicted",
    activeWorldId: "world-neon-district-7",
    lineage: ["origin-profile", "scene-001"],
    unresolvedConsequences: ["withheld-information"]
  }
];

export function getCharacterById(id: string) {
  return characterRegistry.find((character) => character.id === id) ?? null;
}

export function registerCharacter(character: CharacterProfile) {
  characterRegistry.push(character);
  return character;
}
