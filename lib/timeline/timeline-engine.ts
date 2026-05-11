export interface TimelineEvent {
  id: string;
  characterId: string;
  event: string;
  consequence: string;
  timestamp: number;
}

export const timeline: TimelineEvent[] = [];

export function addEvent(event: TimelineEvent) {
  timeline.push(event);
  return event;
}
