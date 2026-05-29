import { useAppState } from './useAppState';

export function useCustomConsumeEmoji() {
  const { state, update } = useAppState();
  return {
    customEmoji: state.customConsumeEmoji,
    add: (emoji: string) => {
      const trimmed = emoji.trim();
      if (!trimmed) return;
      update((s) =>
        s.customConsumeEmoji.includes(trimmed)
          ? s
          : { ...s, customConsumeEmoji: [...s.customConsumeEmoji, trimmed] },
      );
    },
  };
}
