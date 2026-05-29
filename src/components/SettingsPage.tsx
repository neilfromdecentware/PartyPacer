import { useState } from 'react';
import { SettingsTour } from './SettingsTour';

const LOCK_TIMEOUT_OPTIONS: { label: string; minutes: number }[] = [
  { label: 'OFF', minutes: 0 },
  { label: '1 MIN', minutes: 1 },
  { label: '5 MIN', minutes: 5 },
  { label: '15 MIN', minutes: 15 },
  { label: '30 MIN', minutes: 30 },
];

export default function SettingsPage({
  discreetMode,
  onSetDiscreetMode,
  lockEnabled,
  onSetLockEnabled,
  lockTimeoutMinutes,
  onSetLockTimeout,
  onBack,
}: {
  discreetMode: boolean;
  onSetDiscreetMode: (val: boolean) => void;
  lockEnabled: boolean;
  onSetLockEnabled: (val: boolean) => void;
  lockTimeoutMinutes: number;
  onSetLockTimeout: (mins: number) => void;
  onBack: () => void;
}) {
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          minHeight: '2.75rem',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            width: '44px',
            height: '44px',
            fontSize: '1.75rem',
            lineHeight: 1,
            background: 'transparent',
            color: '#fff',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ←
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
          padding: '0.5rem 0.25rem',
        }}
      >
        <h1
          style={{
            margin: '0 0 1.5rem',
            fontSize: '1.6rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: '#fff',
          }}
        >
          SETTINGS
        </h1>
        <SettingRow
          label="DISCREET MODE"
          description={
            lockEnabled && discreetMode
              ? 'Turn PRIVACY LOCK off first to disable'
              : 'Blur the timeline after half a second of no interaction'
          }
          control={
            <Toggle
              on={discreetMode}
              onClick={() => onSetDiscreetMode(!discreetMode)}
              disabled={lockEnabled && discreetMode}
            />
          }
        />
        <div
          style={{
            padding: '1rem 0',
            borderBottom: '1px solid #2a2a2a',
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            PRIVACY LOCK
          </div>
          <div
            style={{
              color: '#888',
              fontSize: '0.85rem',
              marginTop: '0.25rem',
              lineHeight: 1.3,
            }}
          >
            Require Face ID to dismiss the blur after a period of inactivity
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '0.75rem',
            }}
          >
            {LOCK_TIMEOUT_OPTIONS.map((opt) => {
              const isOff = opt.minutes === 0;
              const isSelected = isOff
                ? !lockEnabled
                : lockEnabled && lockTimeoutMinutes === opt.minutes;
              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    if (isOff) {
                      onSetLockEnabled(false);
                    } else {
                      onSetLockEnabled(true);
                      onSetLockTimeout(opt.minutes);
                    }
                  }}
                  style={{
                    padding: '0.5rem 0.85rem',
                    background: isSelected ? '#fff' : 'transparent',
                    color: isSelected ? '#000' : '#fff',
                    border: '2px solid #fff',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => setTourOpen(true)}
          style={{ ...secondaryButtonStyle, marginTop: '1.5rem' }}
        >
          EXPLAIN SETTINGS
        </button>
      </div>
      {tourOpen && (
        <SettingsTour
          onDone={() => setTourOpen(false)}
          currentSettings={{
            discreetMode,
            lockEnabled,
            lockTimeoutMinutes,
          }}
        />
      )}
    </>
  );
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 0',
        borderBottom: '1px solid #2a2a2a',
        gap: '1rem',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              color: '#888',
              fontSize: '0.85rem',
              marginTop: '0.25rem',
              lineHeight: 1.3,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#888',
  border: '1px solid #333',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

function Toggle({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '4rem',
        padding: '0.5rem 0.85rem',
        background: on ? '#fff' : 'transparent',
        color: on ? '#000' : '#fff',
        border: '2px solid #fff',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'inherit',
      }}
    >
      {on ? 'ON' : 'OFF'}
    </button>
  );
}
