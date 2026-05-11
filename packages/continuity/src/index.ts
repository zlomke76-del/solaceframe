export interface CharacterState {
  id: string;
  name: string;
  appearanceLock: boolean;
  environmentLock: boolean;
  continuityScore: number;
}

export function reconcileState(
  previous: CharacterState,
  next: Partial<CharacterState>
): CharacterState {
  return {
    ...previous,
    ...next
  };
}
