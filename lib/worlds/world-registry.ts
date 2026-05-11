export interface WorldState {
  id: string;
  name: string;
  environment: string;
  weather: string;
  lighting: string;
  timelineState: string;
  damagedLocations: string[];
  persistentObjects: string[];
}

export const worlds: WorldState[] = [
  {
    id: "world-neon-district-7",
    name: "Neon District 7",
    environment: "dense vertical city district with rain-soaked transit layers",
    weather: "cold rain beginning after electrical failure",
    lighting: "gold signage, teal utility light, intermittent outage flicker",
    timelineState: "after-market evacuation",
    damagedLocations: ["eastern transit bridge", "lower market elevator"],
    persistentObjects: ["yellow courier case", "fractured street shrine", "disabled security drone"]
  }
];

export function getWorldById(id: string) {
  return worlds.find((world) => world.id === id) ?? null;
}

export function createWorld(world: WorldState) {
  worlds.push(world);
  return world;
}
