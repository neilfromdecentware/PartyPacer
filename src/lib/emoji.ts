// Emoji sets, amount options, grapheme splitting. Expanded set = "more".

export const DEFAULT_CONSUME_EMOJI = ['💧', '🍺', '🍷', '🥃', '🍸', '🍹', '🚬', '☕'];
export const MORE_CONSUME_EMOJI = ['🌿', '💊', '⛷️', '🍄', '🧪', '💎', '💉', '🪨'];
export const CONSUME_EMOJI = [...DEFAULT_CONSUME_EMOJI, ...MORE_CONSUME_EMOJI];
export const AMOUNT_OPTIONS = ['🤏', '¼', '½', '¾', '1', 'L', 'XL', '2', '3', '4', '5'];
export const DEFAULT_AMOUNT = '1';


export const FEELING_EMOJI = [
  '🙂',
  '😁',
  '🤣',
  '🥰',
  '🤩',
  '🤪',
  '😐',
  '🥳',
  '💃',
  '😒',
  '😣',
  '🥱',
  '😭',
  '🫨',
  '🥴',
  '🤢',
  '🥵',
  '🥶',
  '😵‍💫',
  '🤯',
  '😡',
  '😈',
  '💀',
  '💩',
  '🤡',
];

export function splitEmojis(str: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(str), (s) => s.segment);
  }
  return Array.from(str);
}
