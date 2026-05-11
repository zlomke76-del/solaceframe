export interface CharacterProfile {
  id: string;
  name: string;
  appearanceLock: boolean;
  continuityScore: number;
  emotionalState?: string;
  activeWorld?: string;
  lineage: string[];
}

export const characterRegistry: CharacterProfile[] = [];

export function registerCharacter(character: CharacterProfile) {
  characterRegistry.push(character);
  return character;
}
