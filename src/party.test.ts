import { describe, it, expect } from 'vitest';
import {
  partyStartedAt,
  partyStoppedAt,
  partyLoggedEvents,
  ensurePartyEventIds,
  type Party,
  type PartyEvent,
} from './party';

function party(events: PartyEvent[]): Party {
  return { id: 'p1', events };
}

describe('partyStartedAt', () => {
  it('returns the timestamp of the first (start) event', () => {
    expect(partyStartedAt(party([{ type: 'start', at: 1000 }]))).toBe(1000);
  });
});

describe('partyStoppedAt', () => {
  it('returns the stop timestamp when the last event is a stop', () => {
    const p = party([
      { type: 'start', at: 1 },
      { type: 'stop', at: 5 },
    ]);
    expect(partyStoppedAt(p)).toBe(5);
  });

  it('returns null for a party still in progress', () => {
    expect(partyStoppedAt(party([{ type: 'start', at: 1 }]))).toBeNull();
  });
});

describe('partyLoggedEvents', () => {
  it('keeps only consume and feeling events, in order', () => {
    const p = party([
      { type: 'start', at: 1 },
      { type: 'consume', at: 2, value: '🍺1', id: 'a' },
      { type: 'feeling', at: 3, value: '🥳', id: 'b' },
      { type: 'stop', at: 4 },
    ]);
    expect(partyLoggedEvents(p).map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('ensurePartyEventIds', () => {
  it('backfills ids on logged events that lack one', () => {
    const p = party([
      { type: 'start', at: 1 },
      // old blob: logged event w/o id
      { type: 'consume', at: 2, value: '🍺1' } as PartyEvent,
    ]);
    const out = ensurePartyEventIds(p);
    const consume = out.events[1] as { id?: string };
    expect(consume.id).toBeTruthy();
  });

  it('preserves existing ids', () => {
    const p = party([
      { type: 'feeling', at: 3, value: '🥳', id: 'keep-me' },
    ]);
    const out = ensurePartyEventIds(p);
    expect((out.events[0] as { id?: string }).id).toBe('keep-me');
  });

  it('does not add ids to start/stop events', () => {
    const p = party([
      { type: 'start', at: 1 },
      { type: 'stop', at: 9 },
    ]);
    const out = ensurePartyEventIds(p);
    expect(out.events[0]).toEqual({ type: 'start', at: 1 });
    expect(out.events[1]).toEqual({ type: 'stop', at: 9 });
  });

  it('assigns distinct ids to two events created in the same millisecond', () => {
    const p = party([
      { type: 'consume', at: 2, value: '🍺1' } as PartyEvent,
      { type: 'consume', at: 2, value: '💧1' } as PartyEvent,
    ]);
    const out = ensurePartyEventIds(p);
    const a = (out.events[0] as { id?: string }).id;
    const b = (out.events[1] as { id?: string }).id;
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });
});
