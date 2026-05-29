import { useEffect, useState } from 'react';

const DISMISS_KEY = 'partypacer-ios-install-dismissed';

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  );
}

export default function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIos() || isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '0.75rem',
        right: '0.75rem',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
        background: '#111',
        border: '1px solid #333',
        borderRadius: '10px',
        padding: '0.9rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.95rem',
        color: '#ddd',
        zIndex: 20,
      }}
    >
      <div style={{ flex: 1, lineHeight: 1.3 }}>
        Tap <span style={{ opacity: 0.8 }}>Share</span> → <span style={{ opacity: 0.8 }}>Add to Home Screen</span> to install PARTYPACER.
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          color: '#888',
          border: 'none',
          fontSize: '1.25rem',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
