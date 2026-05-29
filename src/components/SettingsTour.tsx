import { useState, type ReactNode } from 'react';

type TourStep = 'settings-icon' | 'discreet' | 'privacy-lock';

const LOCK_TIMEOUT_OPTIONS = [
  { label: 'OFF', minutes: 0 },
  { label: '1 MIN', minutes: 1 },
  { label: '5 MIN', minutes: 5 },
  { label: '15 MIN', minutes: 15 },
  { label: '30 MIN', minutes: 30 },
];

export function SettingsTour({
  onDone,
  onDoneWithTour,
  currentSettings,
}: {
  onDone: () => void;
  onDoneWithTour?: () => void;
  currentSettings: {
    discreetMode: boolean;
    lockEnabled: boolean;
    lockTimeoutMinutes: number;
  };
}) {
  const [step, setStep] = useState<TourStep>('settings-icon');
  const lockLabel = currentSettings.lockEnabled
    ? `${currentSettings.lockTimeoutMinutes} MIN`
    : 'OFF';

  function next() {
    if (step === 'settings-icon') setStep('discreet');
    else if (step === 'discreet') setStep('privacy-lock');
    else onDone();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'env(safe-area-inset-top, 0px) 1.5rem env(safe-area-inset-bottom, 0px)',
      }}
    >
      {step === 'settings-icon' && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
              right: '1rem',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              boxShadow:
                '0 0 0 3px #c084fc, 0 0 0 10px rgba(192, 132, 252, 0.28)',
            }}
          >
            <img
              src="/icon.svg"
              alt=""
              style={{ width: '2rem', height: '2rem' }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 3.75rem)',
              right: '1.5rem',
              color: '#fff',
              fontSize: '1.5rem',
              lineHeight: 1,
            }}
          >
            ↑
          </div>
          <TourCard
            title="Settings live here"
            body={
              <>
                The PARTYPACER icon in the top-right corner of the main screen
                opens settings whenever you need them.
              </>
            }
            buttonLabel="NEXT"
            onButton={next}
          />
        </>
      )}

      {step === 'discreet' && (
        <TourCard
          title="Discreet mode"
          preview={
            <MockRow label="DISCREET MODE">
              <MockToggle on={currentSettings.discreetMode} />
            </MockRow>
          }
          body={
            <>
              Blurs your timeline after a moment of no interaction. A quick
              glance from someone behind you won't reveal what you've been
              logging.{' '}
              <span style={{ color: '#fff' }}>
                (currently {currentSettings.discreetMode ? 'ON' : 'OFF'})
              </span>
            </>
          }
          buttonLabel="NEXT"
          onButton={next}
        />
      )}

      {step === 'privacy-lock' && (
        <TourCard
          title="Privacy lock"
          preview={
            <div>
              <div
                style={{
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  marginBottom: '0.6rem',
                }}
              >
                PRIVACY LOCK
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                }}
              >
                {LOCK_TIMEOUT_OPTIONS.map((opt) => {
                  const isOff = opt.minutes === 0;
                  const isSelected = isOff
                    ? !currentSettings.lockEnabled
                    : currentSettings.lockEnabled &&
                      currentSettings.lockTimeoutMinutes === opt.minutes;
                  return (
                    <MockPill
                      key={opt.label}
                      label={opt.label}
                      selected={isSelected}
                    />
                  );
                })}
              </div>
            </div>
          }
          body={
            <>
              Require Face ID to dismiss the blur after a chosen idle period.
              Pair with discreet mode for the strongest hands-off privacy.{' '}
              <span style={{ color: '#fff' }}>(currently {lockLabel})</span>
            </>
          }
          buttonLabel="DONE"
          onButton={onDone}
          secondaryButtonLabel={onDoneWithTour ? 'TAKE A TOUR →' : undefined}
          onSecondaryButton={onDoneWithTour}
        />
      )}
    </div>
  );
}

function TourCard({
  title,
  preview,
  body,
  buttonLabel,
  onButton,
  secondaryButtonLabel,
  onSecondaryButton,
}: {
  title: string;
  preview?: ReactNode;
  body: ReactNode;
  buttonLabel: string;
  onButton: () => void;
  secondaryButtonLabel?: string;
  onSecondaryButton?: () => void;
}) {
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #333',
        borderRadius: '16px',
        padding: '1.75rem 1.5rem',
        maxWidth: '380px',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          margin: '0 0 1rem',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </h2>
      {preview && (
        <div
          style={{
            background: '#000',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            textAlign: 'left',
          }}
        >
          {preview}
        </div>
      )}
      <p
        style={{
          color: '#aaa',
          fontSize: '0.95rem',
          margin: '0 0 1.5rem',
          lineHeight: 1.5,
        }}
      >
        {body}
      </p>
      <button
        onClick={onButton}
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
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {buttonLabel}
      </button>
      {secondaryButtonLabel && onSecondaryButton && (
        <button
          onClick={onSecondaryButton}
          style={{
            width: '100%',
            padding: '1rem',
            marginTop: '0.6rem',
            background: 'transparent',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {secondaryButtonLabel}
        </button>
      )}
    </div>
  );
}

function MockRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: '0.95rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function MockToggle({ on }: { on: boolean }) {
  return (
    <div
      style={{
        minWidth: '3.5rem',
        padding: '0.4rem 0.75rem',
        background: on ? '#fff' : 'transparent',
        color: on ? '#000' : '#fff',
        border: '2px solid #fff',
        borderRadius: '10px',
        fontSize: '0.8rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textAlign: 'center',
      }}
    >
      {on ? 'ON' : 'OFF'}
    </div>
  );
}

function MockPill({
  label,
  selected,
}: {
  label: string;
  selected?: boolean;
}) {
  return (
    <div
      style={{
        padding: '0.4rem 0.65rem',
        background: selected ? '#fff' : 'transparent',
        color: selected ? '#000' : '#fff',
        border: '2px solid #fff',
        borderRadius: '10px',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      {label}
    </div>
  );
}
