import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  DEFAULT_CONSUME_EMOJI,
  MORE_CONSUME_EMOJI,
  CONSUME_EMOJI,
  AMOUNT_OPTIONS,
  DEFAULT_AMOUNT,
  FEELING_EMOJI,
  splitEmojis,
} from '../lib/emoji';

export function FeelingWizard({
  initialFeeling,
  onCancel,
  onConfirm,
}: {
  initialFeeling?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const validInitial =
    initialFeeling && FEELING_EMOJI.includes(initialFeeling)
      ? initialFeeling
      : FEELING_EMOJI[0];
  const [selected, setSelected] = useState<string>(validInitial);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'auto',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="wiz-header">
        <button onClick={onCancel} aria-label="Cancel" className="wiz-icon-btn">
          ✕
        </button>
      </div>
      <div className="wiz-scroll">
        <div className="wiz-grid-lg">
          {FEELING_EMOJI.map((emoji) => {
            const isSelected = selected === emoji;
            return (
              <button
                key={emoji}
                ref={isSelected ? selectedRef : null}
                onClick={() => setSelected(emoji)}
                aria-label={emoji}
                aria-pressed={isSelected}
                className="wiz-tile wiz-tile--feeling"
                style={{ boxShadow: isSelected ? '0 0 0 4px #fff' : 'none' }}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>
      <div className="wiz-footer">
        <button onClick={() => onConfirm(selected)} className="wiz-confirm">
          ✓
        </button>
      </div>
    </>
  );
}

export function ConsumeWizard({
  initialWhat,
  customEmoji,
  onAddCustomEmoji,
  onCancel,
  onConfirm,
}: {
  initialWhat?: string;
  customEmoji: string[];
  onAddCustomEmoji: (emoji: string) => void;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const validInitial =
    initialWhat && DEFAULT_CONSUME_EMOJI.includes(initialWhat)
      ? initialWhat
      : DEFAULT_CONSUME_EMOJI[0];
  const [what, setWhat] = useState<string>(validInitial);
  const [amount, setAmount] = useState<string>(DEFAULT_AMOUNT);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showAmountGrid, setShowAmountGrid] = useState(false);
  const [showAmountConfirm, setShowAmountConfirm] = useState(false);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);

  const visibleOptions = expanded
    ? [...CONSUME_EMOJI, ...customEmoji]
    : DEFAULT_CONSUME_EMOJI;

  function handleWhatTap(emoji: string) {
    setWhat(emoji);
    if (MORE_CONSUME_EMOJI.includes(emoji)) {
      setShowAmountConfirm(true);
    }
  }

  function handleAddCustom(emoji: string) {
    const grapheme = splitEmojis(emoji.trim())[0];
    if (!grapheme) return;
    onAddCustomEmoji(grapheme);
    setWhat(grapheme);
    setCustomPickerOpen(false);
  }

  if (showAmountConfirm) {
    return (
      <AmountWizard
        what={what}
        onBack={() => setShowAmountConfirm(false)}
        onConfirm={(amt) => onConfirm(what + amt)}
      />
    );
  }

  if (showAmountGrid) {
    return (
      <AmountWizard
        onBack={() => setShowAmountGrid(false)}
        onConfirm={(val) => {
          setAmount(val);
          setShowAmountGrid(false);
        }}
      />
    );
  }

  return (
    <>
      <div className="wiz-header">
        <button onClick={onCancel} aria-label="Cancel" className="wiz-icon-btn">
          ✕
        </button>
      </div>
      <div className="wiz-scroll wiz-scroll--col">
        <div className="wiz-grid-sm">
          {visibleOptions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleWhatTap(emoji)}
              aria-label={emoji}
              aria-pressed={what === emoji}
              className="wiz-tile wiz-tile--consume"
              style={{ boxShadow: what === emoji ? '0 0 0 3px #fff' : 'none' }}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Show fewer' : 'Show more'}
            className="wiz-tile wiz-tile--consume"
          >
            {expanded ? '🔼' : '🔽'}
          </button>
          {expanded && (
            <button
              onClick={() => setCustomPickerOpen(true)}
              aria-label="Add custom"
              className="wiz-tile wiz-tile--custom"
            >
              +
            </button>
          )}
        </div>
        <div className="wiz-center">
          <button
            onClick={() => setShowAmountGrid(true)}
            aria-label={`Amount: ${amount}`}
            className="wiz-amount-btn"
          >
            {amount}
          </button>
        </div>
      </div>
      <div className="wiz-footer">
        <button onClick={() => onConfirm(what + amount)} className="wiz-confirm">
          ✓
        </button>
      </div>
      {customPickerOpen && (
        <CustomEmojiPicker
          onCancel={() => setCustomPickerOpen(false)}
          onConfirm={handleAddCustom}
        />
      )}
    </>
  );
}

export function CustomEmojiPicker({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const grapheme = splitEmojis(text.trim())[0] ?? '';
  const canSubmit = grapheme.length > 0;

  function submit() {
    if (canSubmit) onConfirm(grapheme);
  }

  return (
    <div className="wiz-modal-overlay" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="wiz-modal">
        <div className="wiz-modal-title">ADD CUSTOM</div>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="any single character"
          className="wiz-modal-input"
        />
        <div className="wiz-modal-actions">
          <button onClick={onCancel} className="wiz-modal-cancel">
            CANCEL
          </button>
          <button onClick={submit} disabled={!canSubmit} className="wiz-modal-add">
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}

export function AmountWizard({
  what,
  onBack,
  onConfirm,
}: {
  what?: string;
  onBack: () => void;
  onConfirm: (amount: string) => void;
}) {
  const [selected, setSelected] = useState<string>(DEFAULT_AMOUNT);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'auto',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="wiz-header">
        <button onClick={onBack} aria-label="Back" className="wiz-icon-btn wiz-icon-btn--back">
          ←
        </button>
      </div>
      <div className="wiz-scroll wiz-scroll--col-center">
        {what && <div className="wiz-what-display">{what}</div>}
        <div className="wiz-grid-lg">
          {AMOUNT_OPTIONS.map((opt) => {
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                ref={isSelected ? selectedRef : null}
                onClick={() => setSelected(opt)}
                aria-label={opt}
                aria-pressed={isSelected}
                className="wiz-tile wiz-tile--amount"
                style={{ boxShadow: isSelected ? '0 0 0 4px #fff' : 'none' }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      <div className="wiz-footer">
        <button onClick={() => onConfirm(selected)} className="wiz-confirm">
          ✓
        </button>
      </div>
    </>
  );
}
