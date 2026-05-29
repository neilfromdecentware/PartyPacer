import { useState } from 'react';
import { registerWithEncryption } from '../biometric';
import { registerWithPin, MIN_PIN_LENGTH } from '../pin';
import { setAuthMode } from '../authMode';
import { SettingsTour } from './SettingsTour';
import { AboutFlow } from './AboutFlow';
import { DEFAULT_SETTINGS } from '../storage';

type Step =
  | 'welcome'
  | 'select-encryption'
  | 'encryption' // passkey path
  | 'pin-set'
  | 'pin-confirm'
  | 'success'
  | 'tour';

type ChosenMode = 'passkey' | 'pin' | null;

export function Onboarding({
  onDone,
}: {
  onDone: (key: CryptoKey, withTour?: boolean) => void;
}) {
  const [step, setStep] = useState<Step>('welcome');
  const [chosenMode, setChosenMode] = useState<ChosenMode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  // PIN entry state
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  async function handleEncryptionNext() {
    setBusy(true);
    setError(null);
    const outcome = await registerWithEncryption();
    setBusy(false);
    if (outcome.ok) {
      setAuthMode('passkey');
      setDerivedKey(outcome.key);
      setStep('success');
    } else if (outcome.reason === 'unsupported') {
      setError(
        'Your device must support Face ID with iOS 18 or later. ' +
          'PARTYPACER cannot run here.',
      );
    } else {
      setError("Couldn't authenticate. Tap NEXT to try again.");
    }
  }

  function handlePinSetNext() {
    setError(null);
    if (pin.length < MIN_PIN_LENGTH) {
      setError(`PIN must be at least ${MIN_PIN_LENGTH} characters.`);
      return;
    }
    setStep('pin-confirm');
  }

  async function handlePinConfirmNext() {
    setError(null);
    if (pinConfirm !== pin) {
      setError("PINs don't match — try again.");
      return;
    }
    setBusy(true);
    const outcome = await registerWithPin(pin);
    setBusy(false);
    if (outcome.ok) {
      setAuthMode('pin');
      setDerivedKey(outcome.key);
      // Clear PIN from React state once it's been used. The key is what
      // matters from here on; the PIN itself doesn't need to hang around.
      setPin('');
      setPinConfirm('');
      setStep('success');
    } else {
      setError("Couldn't save PIN. Tap NEXT to try again.");
    }
  }

  function handleDone(withTour = false) {
    if (derivedKey) onDone(derivedKey, withTour);
  }

  if (step === 'tour') {
    return (
      <SettingsTour
        onDone={() => handleDone(false)}
        onDoneWithTour={() => handleDone(true)}
        currentSettings={DEFAULT_SETTINGS}
      />
    );
  }

  if (aboutOpen) {
    return <AboutFlow onClose={() => setAboutOpen(false)} />;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding:
          'env(safe-area-inset-top, 0px) 1.5rem env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '2rem 1.5rem',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {step === 'welcome' && (
          <Card
            emoji="🥳"
            title="Welcome to PARTYPACER"
            body={
              <>
                Track what you've had and how you feel during a night out.
                Everything stays on your phone.
              </>
            }
            buttonLabel="NEXT"
            onButton={() => setStep('select-encryption')}
            secondaryButtonLabel="ABOUT"
            onSecondaryButton={() => setAboutOpen(true)}
          />
        )}
        {step === 'select-encryption' && (
          <>
            <div
              style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}
            >
              🔐
            </div>
            <h2 style={titleStyle}>Select Encryption</h2>
            <div style={bodyStyle}>
              Choose how PARTYPACER will be locked.
            </div>
            <button
              onClick={() => {
                setChosenMode('passkey');
                setError(null);
                setStep('encryption');
              }}
              style={primaryButtonStyle}
            >
              👤 FACEID (RECOMMENDED)
            </button>
            <button
              onClick={() => {
                setChosenMode('pin');
                setError(null);
                setPin('');
                setPinConfirm('');
                setStep('pin-set');
              }}
              style={{ ...primaryButtonStyle, marginTop: '0.75rem' }}
            >
              🔢 PIN (LESS SECURE)
            </button>
          </>
        )}
        {step === 'encryption' && (
          <Card
            emoji="🔒"
            title="Lock it down"
            body={
              <>
                Tap <strong>NEXT</strong> and your iPhone will show you this:
                <img
                  src="/passkey-prompt.png"
                  alt="iOS Save a passkey prompt"
                  style={{
                    display: 'block',
                    width: '70%',
                    maxWidth: '240px',
                    margin: '1rem auto',
                    borderRadius: '14px',
                    border: '1px solid #2a2a2a',
                  }}
                />
                Tap <strong>Add Passkey</strong> — PARTYPACER will then be
                locked to your Face ID.
              </>
            }
            error={error}
            buttonLabel={busy ? 'AUTHENTICATING…' : 'NEXT'}
            buttonDisabled={busy}
            onButton={handleEncryptionNext}
          />
        )}
        {step === 'pin-set' && (
          <>
            <div
              style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}
            >
              🔢
            </div>
            <h2 style={titleStyle}>Set a PIN</h2>
            <div style={bodyStyle}>
              At least {MIN_PIN_LENGTH} characters. Longer is stronger —
              anyone with your phone and your PIN can read your PARTYPACER
              data.
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePinSetNext();
              }}
            >
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                autoComplete="new-password"
                maxLength={32}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="PIN"
                style={pinInputStyle}
              />
              {error && <p style={errorStyle}>{error}</p>}
              <button
                type="submit"
                disabled={pin.length < MIN_PIN_LENGTH}
                style={{
                  ...primaryButtonStyle,
                  marginTop: '0.5rem',
                  opacity: pin.length < MIN_PIN_LENGTH ? 0.5 : 1,
                  cursor:
                    pin.length < MIN_PIN_LENGTH ? 'default' : 'pointer',
                }}
              >
                NEXT
              </button>
            </form>
          </>
        )}
        {step === 'pin-confirm' && (
          <>
            <div
              style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}
            >
              🔢
            </div>
            <h2 style={titleStyle}>Confirm PIN</h2>
            <div style={bodyStyle}>
              Type your PIN again. If you forget it, your data is gone — no
              recovery code exists, on purpose.
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePinConfirmNext();
              }}
            >
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                autoComplete="new-password"
                maxLength={32}
                value={pinConfirm}
                onChange={(e) => {
                  setPinConfirm(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="PIN"
                disabled={busy}
                style={pinInputStyle}
              />
              {error && <p style={errorStyle}>{error}</p>}
              <button
                type="submit"
                disabled={busy || pinConfirm.length < MIN_PIN_LENGTH}
                style={{
                  ...primaryButtonStyle,
                  marginTop: '0.5rem',
                  opacity:
                    busy || pinConfirm.length < MIN_PIN_LENGTH ? 0.5 : 1,
                  cursor:
                    busy || pinConfirm.length < MIN_PIN_LENGTH
                      ? 'default'
                      : 'pointer',
                }}
              >
                {busy ? 'SAVING…' : 'NEXT'}
              </button>
            </form>
          </>
        )}
        {step === 'success' && (
          <Card
            emoji="✅"
            title="You're set"
            body={
              <>
                {chosenMode === 'pin' ? (
                  <>
                    PARTYPACER is locked to your PIN. Quick tour of the
                    settings next.
                  </>
                ) : (
                  <>
                    PARTYPACER is locked to your Face ID. Quick tour of the
                    settings next.
                  </>
                )}
              </>
            }
            buttonLabel="NEXT"
            onButton={() => setStep('tour')}
          />
        )}
      </div>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.75rem',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#fff',
  letterSpacing: '0.02em',
};

const bodyStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: '0.95rem',
  margin: '0 0 1.5rem',
  lineHeight: 1.5,
};

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '1rem',
  background: 'transparent',
  color: '#fff',
  border: '2px solid #fff',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const pinInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '1rem',
  background: '#000',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '12px',
  fontSize: '1.5rem',
  letterSpacing: '0.3em',
  textAlign: 'center',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  marginBottom: '0.5rem',
};

const errorStyle: React.CSSProperties = {
  color: '#ff6b6b',
  fontSize: '0.85rem',
  margin: '0 0 0.75rem',
  lineHeight: 1.4,
};

function Card({
  emoji,
  title,
  body,
  error,
  buttonLabel,
  buttonDisabled,
  onButton,
  secondaryButtonLabel,
  onSecondaryButton,
}: {
  emoji: string;
  title: string;
  body: React.ReactNode;
  error?: string | null;
  buttonLabel: string;
  buttonDisabled?: boolean;
  onButton: () => void;
  secondaryButtonLabel?: string;
  onSecondaryButton?: () => void;
}) {
  return (
    <>
      <div style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}>
        {emoji}
      </div>
      <h2 style={titleStyle}>{title}</h2>
      <div style={bodyStyle}>{body}</div>
      {error && <p style={errorStyle}>{error}</p>}
      <button
        onClick={onButton}
        disabled={buttonDisabled}
        style={{
          ...primaryButtonStyle,
          cursor: buttonDisabled ? 'default' : 'pointer',
          opacity: buttonDisabled ? 0.6 : 1,
        }}
      >
        {buttonLabel}
      </button>
      {secondaryButtonLabel && onSecondaryButton && (
        <button
          onClick={onSecondaryButton}
          style={{
            width: '100%',
            padding: '0.85rem',
            marginTop: '0.5rem',
            background: 'transparent',
            color: '#888',
            border: '1px solid #333',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {secondaryButtonLabel}
        </button>
      )}
    </>
  );
}
