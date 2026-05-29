import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const FALLBACK_URL = 'https://party-pacer.web.app';

const SHARE_TEXT =
  'PARTYPACER — a pocket tally for what you have and how you feel during a night out. Stays on your phone.';

function getShareUrl(): string {
  return typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : FALLBACK_URL;
}

export default function SharePage({ onBack }: { onBack: () => void }) {
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
          padding: '0.5rem 0.25rem 1.5rem',
        }}
      >
        <h1
          style={{
            margin: '0 0 0.5rem',
            fontSize: '1.6rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: '#fff',
          }}
        >
          SHARE APP
        </h1>
        <SharePanel
          description="Show this QR code to anyone you want to share PARTYPACER with — or send the link directly."
        />
      </div>
    </>
  );
}

export function SharePanel({ description }: { description?: string }) {
  const url = getShareUrl();
  const [copied, setCopied] = useState(false);
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function handleShare() {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: 'PARTYPACER',
        text: SHARE_TEXT,
        url,
      });
    } catch {
      /* user cancelled — ignore */
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {description && (
        <p
          style={{
            margin: '0 0 1.5rem',
            color: '#888',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            alignSelf: 'flex-start',
          }}
        >
          {description}
        </p>
      )}

      <div
        style={{
          background: '#fff',
          padding: '1rem',
          borderRadius: '14px',
          marginBottom: '1.5rem',
        }}
      >
        <QRCodeSVG
          value={url}
          size={240}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
        />
      </div>

      <div
        style={{
          color: '#888',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          wordBreak: 'break-all',
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}
      >
        {url.replace(/^https?:\/\//, '')}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '320px',
        }}
      >
        {canNativeShare && (
          <button onClick={handleShare} style={primaryButtonStyle}>
            SHARE LINK
          </button>
        )}
        <button onClick={handleCopy} style={secondaryButtonStyle}>
          {copied ? 'COPIED ✓' : 'COPY LINK'}
        </button>
      </div>
    </div>
  );
}

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

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem',
  background: 'transparent',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '12px',
  fontSize: '0.9rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
