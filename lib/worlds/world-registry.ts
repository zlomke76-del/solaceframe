export interface WorldState {
  id: string;
  name: string;
  environment: string;
  weather: string;
  timelineState: string;
}

export const worlds: WorldState[] = [];

export function createWorld(world: WorldState) {
  worlds.push(world);
  return world;
}
