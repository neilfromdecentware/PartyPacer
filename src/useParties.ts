import type { Party, PartyEvent } from './party';
import { useAppState } from './useAppState';

function findLastValue(
  current: Party | null,
  history: Party[],
  type: 'consume' | 'feeling',
): string | null {
  if (current) {
    for (let i = current.events.length - 1; i >= 0; i--) {
      const e = current.events[i];
      if (e.type === type) return e.value;
    }
  }
  for (const party of history) {
    for (let i = party.events.length - 1; i >= 0; i--) {
      const e = party.events[i];
      if (e.type === type) return e.value;
    }
  }
  return null;
}

export function useParties() {
  const { state, update } = useAppState();
  const { current, history } = state;

  function startParty() {
    const newParty: Party = {
      id: crypto.randomUUID(),
      events: [{ type: 'start', at: Date.now() }],
    };

    update((s) => (s.current ? s : { ...s, current: newParty }));
  }

  function stopParty() {
    const stopAt = Date.now();
    update((s) => {
      if (!s.current) return s;
      const stopped: Party = {
        ...s.current,
        events: [...s.current.events, { type: 'stop', at: stopAt }],
      };
      return {
        ...s,
        current: null,
        history: [stopped, ...s.history],
      };
    });
  }

  function addConsumeEvent(value: string) {
    const event: PartyEvent = {
      type: 'consume',
      at: Date.now(),
      value,
      id: crypto.randomUUID(),
    };
    update((s) => {
      if (!s.current) return s;
      return {
        ...s,
        current: {
          ...s.current,
          events: [...s.current.events, event],
        },
      };
    });
  }

  function addFeelingEvent(value: string) {
    const event: PartyEvent = {
      type: 'feeling',
      at: Date.now(),
      value,
      id: crypto.randomUUID(),
    };
    update((s) => {
      if (!s.current) return s;
      return {
        ...s,
        current: {
          ...s.current,
          events: [...s.current.events, event],
        },
      };
    });
  }

  // deletes rotate the data key → removed data is crypto-erased, not just dropped.
  // { rotate: true } flows to saveAppState (storage.ts). same for deleteParty below.
  function deleteLoggedEvent(id: string) {
    update(
      (s) => {
        if (!s.current) return s;
        return {
          ...s,
          current: {
            ...s.current,
            events: s.current.events.filter((e) => {
              if (e.type !== 'consume' && e.type !== 'feeling') return true;
              return e.id !== id;
            }),
          },
        };
      },
      { rotate: true },
    );
  }

  function deleteParty(id: string) {
    update(
      (s) => ({
        ...s,
        history: s.history.filter((p) => p.id !== id),
      }),
      { rotate: true },
    );
  }

  function resumeParty(id: string) {
    update((s) => {
      if (s.current) return s;
      const party = s.history.find((p) => p.id === id);
      if (!party) return s;
      const events = party.events.filter((e) => e.type !== 'stop');
      return {
        ...s,
        current: { ...party, events },
        history: s.history.filter((p) => p.id !== id),
      };
    });
  }

  return {
    current,
    history,
    isPartying: current !== null,
    lastConsume: findLastValue(current, history, 'consume'),
    lastFeeling: findLastValue(current, history, 'feeling'),
    startParty,
    stopParty,
    addConsumeEvent,
    addFeelingEvent,
    deleteLoggedEvent,
    deleteParty,
    resumeParty,
  };
}
