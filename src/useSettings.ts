import type { Settings } from './storage';
import { useAppState } from './useAppState';

export type { Settings };

export function useSettings() {
  const { state, update } = useAppState();
  return {
    settings: state.settings,
    update: (patch: Partial<Settings>) =>
      update((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
  };
}
