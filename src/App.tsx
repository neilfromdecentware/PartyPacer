import { useEffect, useRef, useState } from 'react';
import IosInstallPrompt from './components/IosInstallPrompt';
import SettingsPage from './components/SettingsPage';
import SharePage from './components/SharePage';
import { AboutFlow } from './components/AboutFlow';
import { ProductTour } from './components/ProductTour';
import { StopThanks } from './components/StopThanks';
import { ConsumeWizard, FeelingWizard } from './components/wizards';
import { FEEDBACK_URL, openExternal } from './links';
import { splitEmojis } from './lib/emoji';
import { formatElapsed, formatPartyDuration, formatDateTime } from './lib/format';
import { useParties } from './useParties';
import { useNow } from './useNow';
import { useSettings } from './useSettings';
import { useCustomConsumeEmoji } from './useCustomConsumeEmoji';
import { assertForPrivacyLock } from './biometric';
import {
  partyLoggedEvents,
  partyStartedAt,
  partyStoppedAt,
  type LoggedEvent,
  type Party,
  type PartyEvent,
} from './party';

export default function App({
  initialTourOpen = false,
}: { initialTourOpen?: boolean } = {}) {
  const {
    current,
    history,
    isPartying,
    startParty,
    stopParty,
    addConsumeEvent,
    addFeelingEvent,
    deleteLoggedEvent,
    deleteParty,
    resumeParty,
    lastConsume,
    lastFeeling,
  } = useParties();
  const [selected, setSelected] = useState<Party | null>(null);

  const [viewingParty, setViewingParty] = useState<Party | null>(null);
  const [wizard, setWizard] = useState<'consume' | 'feeling' | null>(null);
  const [viewingSettings, setViewingSettings] = useState(false);
  const [viewingShare, setViewingShare] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(initialTourOpen);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
  const [showStopThanks, setShowStopThanks] = useState(false);
  const { settings, update: updateSettings } = useSettings();

  function handleStop() {
    stopParty();
    if (!settings.hideStopThanks) setShowStopThanks(true);
  }
  const { customEmoji, add: addCustomEmoji } = useCustomConsumeEmoji();

  function closeSheet() {
    setSelected(null);
  }

  function openSettings() {
    setViewingSettings(true);
  }

  const authBusyRef = useRef(false);

  async function tryAuth(): Promise<boolean> {
    if (authBusyRef.current) return false;
    authBusyRef.current = true;
    try {
      return await assertForPrivacyLock();
    } catch {
      return false;
    } finally {
      authBusyRef.current = false;
    }
  }

  async function handleSetLockEnabled(val: boolean) {
    if (val === settings.lockEnabled) return;
    if (!val && !(await tryAuth())) return;
    updateSettings({ lockEnabled: val });
  }

  function handleSetDiscreetMode(val: boolean) {
    if (!val && settings.discreetMode && settings.lockEnabled) return;
    updateSettings({ discreetMode: val });
  }

  const settingsItem: GearMenuItem = {
    emoji: '⚙️',
    label: 'SETTINGS',
    onClick: openSettings,
  };
  const tourItem: GearMenuItem = {
    emoji: '🧭',
    label: 'TOUR',
    onClick: () => setTourOpen(true),
  };
  const shareItem: GearMenuItem = {
    emoji: '📤',
    label: 'SHARE',
    onClick: () => setViewingShare(true),
  };
  const aboutItem: GearMenuItem = {
    emoji: 'ℹ️',
    label: 'ABOUT',
    onClick: () => setAboutOpen(true),
  };
  const feedbackItem: GearMenuItem = {
    emoji: '👍',
    label: 'FEEDBACK',
    onClick: () => openExternal(FEEDBACK_URL),
  };

  useEffect(() => {
    if (wizard && !isPartying) setWizard(null);
  }, [wizard, isPartying]);

  return (
    <>
      <div className="app-root">
        {viewingSettings ? (
          <SettingsPage
            discreetMode={settings.discreetMode}
            onSetDiscreetMode={handleSetDiscreetMode}
            lockEnabled={settings.lockEnabled}
            onSetLockEnabled={handleSetLockEnabled}
            lockTimeoutMinutes={settings.lockTimeoutMinutes}
            onSetLockTimeout={(mins) =>
              updateSettings({ lockTimeoutMinutes: mins })
            }
            onBack={() => setViewingSettings(false)}
          />
        ) : viewingShare ? (
          <SharePage onBack={() => setViewingShare(false)} />
        ) : viewingParty ? (
          <PartyDetailView
            party={viewingParty}
            onClose={() => setViewingParty(null)}
          />
        ) : wizard === 'consume' && current ? (
          <ConsumeWizard
            key="consume"
            initialWhat={
              lastConsume ? splitEmojis(lastConsume)[0] : undefined
            }
            customEmoji={customEmoji}
            onAddCustomEmoji={addCustomEmoji}
            onCancel={() => setWizard(null)}
            onConfirm={(value) => {
              addConsumeEvent(value);
              setWizard(null);
            }}
          />
        ) : wizard === 'feeling' && current ? (
          <FeelingWizard
            key="feeling"
            initialFeeling={lastFeeling ?? undefined}
            onCancel={() => setWizard(null)}
            onConfirm={(value) => {
              addFeelingEvent(value);
              setWizard(null);
            }}
          />
        ) : isPartying && current ? (
          <>
            <div className="app-bar-between">
              <div className="app-topbar-spacer" />
              <PartyTimer current={current} />
              <GearMenu
                items={[
                  { emoji: '🛑', label: 'STOP', onClick: handleStop },
                  settingsItem,
                  tourItem,
                  shareItem,
                  aboutItem,
                  feedbackItem,
                ]}
              />
            </div>
            <PartyView
              current={current}
              onConsume={() => setWizard('consume')}
              onFeel={() => setWizard('feeling')}
              onDeleteEvent={deleteLoggedEvent}
              discreetMode={settings.discreetMode}
              lockEnabled={settings.lockEnabled}
              lockTimeoutMs={settings.lockTimeoutMinutes * 60_000}
            />
          </>
        ) : (
          <>
            <div className="app-bar-end">
              <GearMenu
                items={[
                  settingsItem,
                  tourItem,
                  shareItem,
                  aboutItem,
                  feedbackItem,
                ]}
              />
            </div>
            <PartyHistory history={history} onSelect={setSelected} />
            <div className="app-footer">
              <StartPartyButton onClick={startParty} />
            </div>
          </>
        )}
      </div>
      {selected && (
        <PartyActionSheet
          party={selected}
          onClose={closeSheet}
          onView={async () => {
            if (settings.lockEnabled && !(await tryAuth())) return;
            setViewingParty(selected);
            closeSheet();
          }}
          onDelete={() => {
            setPartyToDelete(selected);
            closeSheet();
          }}
          onResume={async () => {
            if (settings.lockEnabled && !(await tryAuth())) return;
            resumeParty(selected.id);
            closeSheet();
          }}
        />
      )}
      {partyToDelete && (
        <DeleteConfirmDialog
          message="Delete this party? This can't be undone — no trace of the data will remain."
          onCancel={() => setPartyToDelete(null)}
          onConfirm={() => {
            deleteParty(partyToDelete.id);
            setPartyToDelete(null);
          }}
        />
      )}
      <IosInstallPrompt />
      {aboutOpen && (
        <AboutFlow
          onClose={() => setAboutOpen(false)}
          onStartTour={() => {
            setAboutOpen(false);
            setTourOpen(true);
          }}
        />
      )}
      {tourOpen && <ProductTour onDone={() => setTourOpen(false)} />}
      {showStopThanks && (
        <StopThanks
          onClose={(dontShowAgain) => {
            if (dontShowAgain) updateSettings({ hideStopThanks: true });
            setShowStopThanks(false);
          }}
        />
      )}
    </>
  );
}

function PartyDetailView({
  party,
  onClose,
}: {
  party: Party;
  onClose: () => void;
}) {
  return (
    <>
      <div className="app-bar-start">
        <button onClick={onClose} aria-label="Back" className="app-icon-btn">
          ←
        </button>
      </div>
      <div className="app-detail-scroll">
        {party.events.map((e, i) => (
          <EventRow key={i} event={e} />
        ))}
      </div>
    </>
  );
}

function EventRow({ event }: { event: PartyEvent }) {
  return (
    <div className="app-event-row">
      <span className="app-event-emoji">{eventEmoji(event)}</span>
      <span className="app-event-time">{formatDateTime(event.at)}</span>
    </div>
  );
}

function eventEmoji(event: PartyEvent): string {
  switch (event.type) {
    case 'start':
      return '▶️';
    case 'stop':
      return '🛑';
    case 'consume':
    case 'feeling':
      return event.value;
  }
}

function displayValue(event: LoggedEvent): string {
  if (event.type !== 'consume') return event.value;
  const graphemes = splitEmojis(event.value);
  if (graphemes.length === 0) return event.value;
  if (graphemes[graphemes.length - 1] === '1') {
    return graphemes.slice(0, -1).join('');
  }
  return event.value;
}

function PartyView({
  current,
  onConsume,
  onFeel,
  onDeleteEvent,
  discreetMode,
  lockEnabled,
  lockTimeoutMs,
}: {
  current: Party;
  onConsume: () => void;
  onFeel: () => void;
  onDeleteEvent: (id: string) => void;
  discreetMode: boolean;
  lockEnabled: boolean;
  lockTimeoutMs: number;
}) {
  const events = partyLoggedEvents(current);
  const count = events.length;
  const now = useNow();
  const listRef = useRef<HTMLDivElement>(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState<string | null>(null);
  const [openRowAt, setOpenRowAt] = useState<string | null>(null);

  useEffect(() => {
    if (openRowAt === null) return;
    const t = window.setTimeout(() => setOpenRowAt(null), 2000);
    return () => clearTimeout(t);
  }, [openRowAt]);

  const blurEnabled =
    discreetMode && openRowAt === null && confirmDeleteFor === null;
  const { blurred, handlers: blurHandlers } = useIdleBlur(
    500,
    blurEnabled,
    lockEnabled,
    lockTimeoutMs,
  );

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [count]);

  return (
    <>
      <div className="app-pv-wrap">
      <div
        ref={listRef}
        {...blurHandlers}
        className="app-pv-list"
        style={{
          filter: blurred && count > 0 ? 'blur(16px) saturate(0)' : 'none',
        }}
      >
        {count === 0 ? (
          <div className="app-empty">Tap to log</div>
        ) : (
          <div className="app-pv-events">
            {events.map((e, i) => (
              <LoggedRow
                key={e.id}
                event={e}
                now={now}
                highlighted={i === count - 1}
                open={openRowAt === e.id}
                onOpenChange={(open) => {
                  setOpenRowAt((prev) =>
                    open ? e.id : prev === e.id ? null : prev,
                  );
                }}
                onDeleteRequest={setConfirmDeleteFor}
              />
            ))}
          </div>
        )}
      </div>
        <div
          aria-hidden
          className="app-pv-eye"
          style={{ opacity: blurred && count > 0 ? 1 : 0 }}
        >
          👁️
        </div>
      </div>
      <div className="app-actions">
        <EmojiButton emoji="🍺" onClick={onConsume} />
        <EmojiButton emoji="😊" onClick={onFeel} />
      </div>
      {confirmDeleteFor !== null && (
        <DeleteConfirmDialog
          onCancel={() => setConfirmDeleteFor(null)}
          onConfirm={() => {
            onDeleteEvent(confirmDeleteFor);
            setConfirmDeleteFor(null);
          }}
        />
      )}
    </>
  );
}

const SWIPE_REVEAL_WIDTH = 80;
const SWIPE_DEAD_ZONE = 15;
const SWIPE_OPEN_THRESHOLD = 0.7;
const SWIPE_CLOSE_THRESHOLD = 0.5;

function LoggedRow({
  event,
  now,
  highlighted,
  open,
  onOpenChange,
  onDeleteRequest,
}: {
  event: LoggedEvent;
  now: number;
  highlighted: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteRequest: (id: string) => void;
}) {
  const [translateX, setTranslateX] = useState(
    open ? -SWIPE_REVEAL_WIDTH : 0,
  );
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startTxRef = useRef(0);
  const committedRef = useRef(false);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragging) {
      setTranslateX(open ? -SWIPE_REVEAL_WIDTH : 0);
    }
  }, [open, dragging]);

  function onPointerDown(e: React.PointerEvent) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    startXRef.current = e.clientX;
    startTxRef.current = translateX;
    committedRef.current = false;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    if (!committedRef.current) {
      if (Math.abs(dx) > SWIPE_DEAD_ZONE) {
        committedRef.current = true;
      } else {
        return;
      }
    }
    const effective = dx > 0 ? dx - SWIPE_DEAD_ZONE : dx + SWIPE_DEAD_ZONE;
    const next = Math.min(
      0,
      Math.max(-SWIPE_REVEAL_WIDTH, startTxRef.current + effective),
    );
    setTranslateX(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startXRef.current === null) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (committedRef.current) {
      const dx = e.clientX - startXRef.current;
      const effective = dx > 0 ? dx - SWIPE_DEAD_ZONE : dx + SWIPE_DEAD_ZONE;
      const finalTx = startTxRef.current + effective;
      if (startTxRef.current === 0) {
        if (finalTx < -SWIPE_REVEAL_WIDTH * SWIPE_OPEN_THRESHOLD) {
          setTranslateX(-SWIPE_REVEAL_WIDTH);
          onOpenChange(true);
        } else {
          setTranslateX(0);
        }
      } else {
        if (finalTx > -SWIPE_REVEAL_WIDTH * SWIPE_CLOSE_THRESHOLD) {
          setTranslateX(0);
          onOpenChange(false);
        } else {
          setTranslateX(-SWIPE_REVEAL_WIDTH);
        }
      }
    } else if (open) {
      setTranslateX(0);
      onOpenChange(false);
    }
    startXRef.current = null;
    setDragging(false);
  }

  function handleDeleteTap(e: React.MouseEvent) {
    e.stopPropagation();
    setTranslateX(0);
    onOpenChange(false);
    onDeleteRequest(event.id);
  }

  useEffect(() => {
    if (!open) return;
    function handle(e: PointerEvent) {
      if (outerRef.current && !outerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('pointerdown', handle);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('pointerdown', handle);
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={outerRef}
      className="app-row"
      style={{ boxShadow: highlighted ? '0 0 0 3px #fff' : 'none' }}
    >
      <button
        onClick={handleDeleteTap}
        aria-label="Delete"
        className="app-row-delete"
        style={{ width: `${SWIPE_REVEAL_WIDTH}px` }}
      >
        🗑️
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="app-row-content"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
          flexDirection: event.type === 'feeling' ? 'row-reverse' : 'row',
        }}
      >
        <span className="app-row-value">{displayValue(event)}</span>
        <span className="app-row-time">{formatElapsed(event.at, now)}</span>
      </div>
    </div>
  );
}

// Privacy-blur idle machine. Blur after idle, re-auth to clear.
// what happens at the party stays blurred.
// Re-auth gate is in tryClearBlur → assertForPrivacyLock (biometric.ts).
// TODO this whole thing really wants to be its own hook (hooks/useIdleBlur.ts), it's a lot
function useIdleBlur(
  durationMs: number,
  enabled: boolean,
  lockEnabled: boolean,
  lockTimeoutMs: number,
) {
  const [blurred, setBlurred] = useState(false);
  // ref shadows of the state below — tryClearBlur is async, plain state reads stale.
  const blurredRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const lastInteractoinRef = useRef(Date.now());
  const authingRef = useRef(false);
  // live pointer count, two writers: mouse/pen do +1/-1 in the handlers below;
  // touch sets it absolutely (= touches.length) in the doc-listener effect. never both.
  // TODO two writers on one ref is asking for trouble, unify the counting somehow
  const pointerDownCountRef = useRef(0);

  // always write both — keep the ref shadow in lockstep with state.
  function setBlurredBoth(v: boolean) {
    blurredRef.current = v;
    setBlurred(v);
  }

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleBlur() {
    clearTimer();
    if (pointerDownCountRef.current > 0) return;
    timerRef.current = window.setTimeout(() => {
      setBlurredBoth(true);
      timerRef.current = null;
    }, durationMs);
  }

  // every unblur attempt funnels here. past the lock timeout → biometric gate first.
  // TODO privacy lock only gates re-entry — the decrypted state + data key stay
  // in memory (useAppState). someone with the device + know-how could scrape
  // plaintext from the heap. should drop in-memory plaintext when the lock engages.
  // not a quick fix though:
  //  - dropping state means re-deriving the key via the PRF unwrap on unlock,
  //    not the gesture-only assertForPrivacyLock we use here.
  //  - JS won't guarantee the old plaintext is zeroed — GC timing is opaque and
  //    strings/objects can linger as copies long after we drop the refs.
  //  - CryptoKey material isn't manually wipeable; we can only drop the handle.
  //  - blur covers the casual "glance over the shoulder" threat; this is the
  //    stronger "attacker has the unlocked device" one — different bar.
  async function tryClearBlur() {
    if (!enabled) return;
    if (blurredRef.current && lockEnabled) {
      const elapsed = Date.now() - lastInteractoinRef.current;
      if (elapsed >= lockTimeoutMs) {
        // reentrnacy guard — a second prompt mid-await would double-fire.
        if (authingRef.current) return;
        authingRef.current = true;
        let ok = false;
        try {
          ok = await assertForPrivacyLock();
        } catch {
          ok = false;
        }
        authingRef.current = false;
        if (!ok) return;
      }
    }
    lastInteractoinRef.current = Date.now();
    setBlurredBoth(false);
    if (pointerDownCountRef.current === 0) {
      scheduleBlur();
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    // touch is counted by the doc listeners below — skip it here, don't double-count.
    if (e.pointerType !== 'touch') {
      pointerDownCountRef.current++;
    }
    clearTimer();
    tryClearBlur();
  }

  function onPointerMove() {
    if (!enabled) return;
    if (pointerDownCountRef.current > 0) return;
    tryClearBlur();
  }

  function onPointerEnd(e: React.PointerEvent) {
    // touch decrement happens in touchend/touchcancel below; bail to keep the count sane.
    if (e.pointerType === 'touch') return;
    if (pointerDownCountRef.current > 0) {
      pointerDownCountRef.current--;
    }
    if (pointerDownCountRef.current === 0) {
      scheduleBlur();
    }
  }

  function onScroll() {
    tryClearBlur();
  }

  // reset the machine on toggle / duration change. helpers are stable closures,
  // so deps stay [enabled, durationMs] on purpose (hence the disable).
  // TODO deps hand-managed + no tests = scary. cover it then kill the disable
  useEffect(() => {
    if (!enabled) {
      setBlurredBoth(false);
      clearTimer();
      pointerDownCountRef.current = 0;
      return;
    }
    setBlurredBoth(false);
    lastInteractoinRef.current = Date.now();
    scheduleBlur();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, durationMs]);

  // iOS Safari fires pointerup/cancel unreliably for touch, so count touches directly.
  // https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent/touches
  useEffect(() => {
    if (!enabled) return;
    function syncTouches(e: TouchEvent) {
      // absolute count — the touch half of the pointerDownCountRef invarinat.
      pointerDownCountRef.current = e.touches.length;
      if (pointerDownCountRef.current === 0) {
        scheduleBlur();
      } else {
        clearTimer();
      }
    }
    document.addEventListener('touchstart', syncTouches, { passive: true });
    document.addEventListener('touchend', syncTouches, { passive: true });
    document.addEventListener('touchcancel', syncTouches, { passive: true });
    return () => {
      document.removeEventListener('touchstart', syncTouches);
      document.removeEventListener('touchend', syncTouches);
      document.removeEventListener('touchcancel', syncTouches);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    blurred,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onPointerLeave: onPointerEnd,
      onScroll,
    },
  };
}

function DeleteConfirmDialog({
  message,
  onCancel,
  onConfirm,
}: {
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div onClick={onCancel} className="app-sheet-overlay">
      <div onClick={(e) => e.stopPropagation()} className="app-sheet">
        <div className="app-sheet-msg">
          {message ?? 'Delete this event?'}
        </div>
        <MenuItem emoji="🗑️" label="DELETE" onClick={onConfirm} />
        <MenuItem emoji="✕" label="CANCEL" onClick={onCancel} />
      </div>
    </div>
  );
}

function EmojiButton({
  emoji,
  onClick,
  disabled,
}: {
  emoji: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={emoji}
      className="app-emoji-btn"
    >
      {emoji}
    </button>
  );
}

function PartyTimer({ current }: { current: Party }) {
  const now = useNow(1000);
  const start = partyStartedAt(current);
  return (
    <div className="app-timer">{formatPartyDuration(now - start)}</div>
  );
}

function PartyHistory({
  history,
  onSelect,
}: {
  history: Party[];
  onSelect: (p: Party) => void;
}) {
  if (history.length === 0) {
    return <div className="app-empty">No parties yet</div>;
  }
  return (
    <div className="app-history-list">
      {history.map((p) => (
        <PartyRow key={p.id} party={p} onClick={() => onSelect(p)} />
      ))}
    </div>
  );
}

function PartyRow({ party, onClick }: { party: Party; onClick: () => void }) {
  const start = partyStartedAt(party);
  const stop = partyStoppedAt(party);
  return (
    <button onClick={onClick} className="app-party-row">
      <div className="app-party-row-date">{formatDateTime(start)}</div>
      <div className="app-party-row-sub">
        → {stop === null ? 'in progress' : formatDateTime(stop)}
      </div>
    </button>
  );
}

function PartyActionSheet({
  party,
  onClose,
  onView,
  onDelete,
  onResume,
}: {
  party: Party;
  onClose: () => void;
  onView: () => void;
  onDelete: () => void;
  onResume: () => void;
}) {
  return (
    <div onClick={onClose} className="app-sheet-overlay">
      <div onClick={(e) => e.stopPropagation()} className="app-sheet">
        <div className="app-sheet-head">
          {formatDateTime(partyStartedAt(party))}
        </div>
        <MenuItem emoji="👀" label="VIEW" onClick={onView} />
        <MenuItem emoji="🗑️" label="DELETE" onClick={onDelete} />
        <MenuItem emoji="▶️" label="RESUME" onClick={onResume} />
      </div>
    </div>
  );
}

function MenuItem({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="app-menu-item">
      <span className="app-btn-emoji">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function StartPartyButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="app-start-btn">
      <span className="app-btn-emoji">🍾</span>
      <span>START</span>
    </button>
  );
}

interface GearMenuItem {
  emoji: string;
  label: string;
  onClick: () => void;
}

function GearMenu({ items }: { items: GearMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="app-gear">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="app-gear-btn"
      >
        <img src="/icon.svg" alt="" className="app-gear-img" />
      </button>
      {open && (
        <div className="app-gear-menu">
          {items.map((item) => (
            <MenuItem
              key={item.label}
              emoji={item.emoji}
              label={item.label}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
