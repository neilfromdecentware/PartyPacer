import { useState } from 'react';
import { unlockEncryption, wipeCredential } from '../biometric';
import { unlockWithPin, wipePinSalt, MIN_PIN_LENGTH } from '../pin';
import { wipeAuthMode, type AuthMode } from '../authMode';
import { wipeAppState } from '../storage';

type Phase = 'idle' | 'busy' | 'failed' | 'wipe-confirm';

export function LockScreen({
  mode,
  onUnlocked,
  onWiped,
}: {
  mode: AuthMode;
  onUnlocked: (key: CryptoKey) => void;
  onWiped: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [pin, setPin] = useState('');

  async function handlePasskeyUnlock() {
    if (phase === 'busy') return;
    setPhase('busy');
    const outcome = await unlockEncryption();
    if (outcome.ok) onUnlocked(outcome.key);
    else setPhase('failed');
  }

  async function handlePinUnlock() {
    if (phase === 'busy' || pin.length < MIN_PIN_LENGTH) return;
    setPhase('busy');
    const outcome = await unlockWithPin(pin);
    // pin.ts catches wrong PINs via the verifier, so typos land on 'failed'.
    // Corrupt blobs still trigger the wipe path.
    if (outcome.ok) onUnlocked(outcome.key);
    else setPhase('failed');
  }

  function handleWipe() {
    wipeAppState();
    wipeCredential();
    wipePinSalt();
    wipeAuthMode();
    onWiped();
  }

  const showWipeConfirm = phase === 'wipe-confirm';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'env(safe-area-inset-top, 0px) 1.5rem env(safe-area-inset-bottom, 0px)',
        gap: '1.5rem',
      }}
    >
      {!showWipeConfirm && mode === 'passkey' && (
        <PasskeyUnlock phase={phase} onTap={handlePasskeyUnlock} />
      )}

      {!showWipeConfirm && mode === 'pin' && (
        <PinUnlock
          phase={phase}
          pin={pin}
          onPinChange={(v) => {
            setPin(v);
            if (phase === 'failed') setPhase('idle');
          }}
          onSubmit={handlePinUnlock}
          onWipeTap={() => setPhase('wipe-confirm')}
        />
      )}

      {showWipeConfirm ? (
        <>
          <p
            style={{
              color: '#666',
              fontSize: '0.95rem',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Wipe all PARTYPACER data?
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              width: '100%',
              maxWidth: '320px',
            }}
          >
            <button
              onClick={() => setPhase('idle')}
              style={cancelButtonStyle}
            >
              CANCEL
            </button>
            <button onClick={handleWipe} style={wipeButtonStyle}>
              WIPE
            </button>
          </div>
        </>
      ) : (
        // Passkey screen has no in-form wipe button, so it keeps the bottom
        // escape-hatch link. PIN screen has WIPE directly under UNLOCK,
        // so the link would be redundant there.
        mode === 'passkey' && (
          <button
            onClick={() => setPhase('wipe-confirm')}
            style={resetLinkStyle}
          >
            can't unlock? reset and start over
          </button>
        )
      )}
    </div>
  );
}

function PasskeyUnlock({
  phase,
  onTap,
}: {
  phase: Phase;
  onTap: () => void;
}) {
  return (
    <>
      <button
        onClick={onTap}
        disabled={phase === 'busy'}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '5rem',
          lineHeight: 1,
          cursor: phase === 'busy' ? 'default' : 'pointer',
          opacity: phase === 'busy' ? 0.5 : 1,
          padding: '1rem',
          fontFamily: 'inherit',
        }}
        aria-label="Unlock PARTYPACER"
      >
        🔒
      </button>
      <p
        style={{
          color: '#666',
          fontSize: '0.95rem',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {phase === 'busy' && 'Authenticating…'}
        {phase === 'idle' && 'Tap to unlock'}
        {phase === 'failed' && 'Tap to try again'}
      </p>
    </>
  );
}

function PinUnlock({
  phase,
  pin,
  onPinChange,
  onSubmit,
  onWipeTap,
}: {
  phase: Phase;
  pin: string;
  onPinChange: (v: string) => void;
  onSubmit: () => void;
  onWipeTap: () => void;
}) {
  const disabled = phase === 'busy' || pin.length < MIN_PIN_LENGTH;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '320px',
      }}
    >
      <div style={{ fontSize: '4rem', lineHeight: 1 }}>🔢</div>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus
        autoComplete="off"
        maxLength={32}
        value={pin}
        onChange={(e) => onPinChange(e.target.value)}
        disabled={phase === 'busy'}
        placeholder="PIN"
        style={{
          width: '100%',
          padding: '1rem',
          background: '#111',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '12px',
          fontSize: '1.5rem',
          letterSpacing: '0.3em',
          textAlign: 'center',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      <p
        style={{
          color: phase === 'failed' ? '#ff6b6b' : '#666',
          fontSize: '0.85rem',
          margin: 0,
          textAlign: 'center',
          minHeight: '1.2em',
        }}
      >
        {phase === 'busy' && 'Unlocking…'}
        {phase === 'failed' && "PIN didn't unlock — try again"}
      </p>
      <button
        type="submit"
        disabled={disabled}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'transparent',
          color: '#fff',
          border: '2px solid #fff',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontFamily: 'inherit',
        }}
      >
        UNLOCK
      </button>
      <button
        type="button"
        onClick={onWipeTap}
        disabled={phase === 'busy'}
        style={{
          width: '100%',
          padding: '0.85rem',
          marginTop: '-0.5rem', // tighten against UNLOCK (form gap is 1.25rem)
          background: 'transparent',
          color: '#ff6b6b',
          border: '1px solid #4a1f1f',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          cursor: phase === 'busy' ? 'default' : 'pointer',
          opacity: phase === 'busy' ? 0.5 : 1,
          fontFamily: 'inherit',
        }}
      >
        WIPE
      </button>
    </form>
  );
}

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  background: '#222',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const wipeButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  background: '#7a1f1f',
  color: '#fff',
  border: '1px solid #a02f2f',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const resetLinkStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
  background: 'transparent',
  border: 'none',
  color: '#444',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: '0.5rem 1rem',
};
