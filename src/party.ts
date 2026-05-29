export type StartEvent = { type: 'start'; at: number };
export type StopEvent = { type: 'stop'; at: number };
export type ConsumeEvent = { type: 'consume'; at: number; value: string; id: string };
export type FeelingEvent = { type: 'feeling'; at: number; value: string; id: string };
export type LoggedEvent = ConsumeEvent | FeelingEvent;

export type PartyEvent = StartEvent | StopEvent | LoggedEvent;

export interface Party {
  id: string;
  events: PartyEvent[];
}

// Backfill ids on pre-`id` logged events (older blobs keyed by timestamp).
export function ensurePartyEventIds(p: Party): Party {
  const events = p.events.map((e) => {
    if (
      (e.type === 'consume' || e.type === 'feeling') &&
      !(e as { id?: string }).id
    ) {
      return { ...e, id: crypto.randomUUID() };
    }
    return e;
  });
  return { ...p, events };
}

export function partyStartedAt(p: Party): number {
  return p.events[0].at;
}

export function partyStoppedAt(p: Party): number | null {
  const last = p.events[p.events.length - 1];
  return last.type === 'stop' ? last.at : null;
}

export function partyLoggedEvents(p: Party): LoggedEvent[] {
  return p.events.filter(
    (e): e is LoggedEvent => e.type === 'consume' || e.type === 'feeling',
  );
}
