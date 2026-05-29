import { useState } from 'react';
import { FEEDBACK_URL, openExternal } from '../links';

export function StopThanks({
  onClose,
}: {
  onClose: (dontShowAgain: boolean) => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
      <div
        style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '2rem 1.5rem 1.5rem',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}>
          🙏
        </div>
        <h2
          style={{
            margin: '0 0 0.75rem',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.02em',
          }}
        >
          Thanks for using PARTYPACER
        </h2>
        <p
          style={{
            color: '#aaa',
            fontSize: '0.95rem',
            margin: '0 0 1.5rem',
            lineHeight: 1.5,
          }}
        >
          The app sends me nothing, so I have no way of knowing whether anyone
          is out there using it. If you'd give me a thumbs up on the feedback
          page, it'd make my day — just to know people are.
        </p>

        <button
          onClick={() => openExternal(FEEDBACK_URL)}
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
          👍 GIVE FEEDBACK
        </button>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            margin: '1.25rem 0 1rem',
            color: '#888',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            style={{ width: '1.1rem', height: '1.1rem', accentColor: '#c084fc' }}
          />
          Don't show this again
        </label>

        <button
          onClick={() => onClose(dontShowAgain)}
          style={{
            width: '100%',
            padding: '0.85rem',
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
          CLOSE
        </button>
      </div>
    </div>
  );
}
