import { useState } from 'react';
import { AboutFlow } from './AboutFlow';
import { ProductTour } from './ProductTour';
import { SharePanel } from './SharePage';

type Tab = 'about' | 'tour' | 'install';

function iosMajorVersion(ua: string): number | null {
  if (!/iPhone|iPad|iPod/.test(ua)) return null;
  // iOS 26+ froze the "CPU iPhone OS 18_6" UA token; Version/X tracks the
  // real OS major from 26 on. Max of both.
  const cpu = ua.match(/OS (\d+)[_.]/);
  const ver = ua.match(/Version\/(\d+)/);
  const major = Math.max(
    cpu ? parseInt(cpu[1], 10) : 0,
    ver ? parseInt(ver[1], 10) : 0,
  );
  return major > 0 ? major : null;
}

export default function Landing() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isInIOSSafari = isIOS && !/CriOS|FxiOS|EdgiOS/.test(ua);
  const iosVersion = iosMajorVersion(ua);
  const [tab, setTab] = useState<Tab>('about');
  const [tourOpen, setTourOpen] = useState(false);

  function openTour() {
    setTab('tour');
    setTourOpen(true);
  }

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding:
            'calc(env(safe-area-inset-top, 0px) + 2rem) 1.25rem calc(env(safe-area-inset-bottom, 0px) + 2rem)',
          gap: '1.25rem',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <img
            src="/icon.svg"
            alt=""
            style={{ width: '2.75rem', height: '2.75rem' }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: '2.25rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            PARTYPACER
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            width: '100%',
          }}
        >
          <TabButton
            label="ABOUT"
            active={tab === 'about'}
            onClick={() => setTab('about')}
          />
          <TabButton label="TOUR" active={tab === 'tour'} onClick={openTour} />
          <TabButton
            label="INSTALL"
            active={tab === 'install'}
            onClick={() => setTab('install')}
          />
        </div>

        <div style={{ width: '100%' }}>
          {tab === 'about' && <AboutFlow embedded />}
          {tab === 'tour' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1.5rem 0',
              }}
            >
              <button
                onClick={() => setTourOpen(true)}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'transparent',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                TAKE TOUR AGAIN
              </button>
            </div>
          )}
          {tab === 'install' && (
            <InstallTab
              isIOS={isIOS}
              isInIOSSafari={isInIOSSafari}
              iosVersion={iosVersion}
            />
          )}
        </div>
      </div>

      {tourOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding:
              'calc(env(safe-area-inset-top, 0px) + 0.5rem) 1rem calc(env(safe-area-inset-bottom, 0px) + 0.5rem)',
          }}
        >
          <button
            onClick={() => setTourOpen(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
              right: '1rem',
              width: '44px',
              height: '44px',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              fontSize: '1.75rem',
              lineHeight: 1,
              cursor: 'pointer',
              fontFamily: 'inherit',
              zIndex: 2,
            }}
          >
            ×
          </button>
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <ProductTour embedded onDone={() => setTourOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '0.85rem 0.5rem',
        background: active ? '#fff' : 'transparent',
        color: active ? '#000' : '#fff',
        border: '2px solid #fff',
        borderRadius: '12px',
        fontSize: '0.95rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function InstallTab({
  isIOS,
  isInIOSSafari,
  iosVersion,
}: {
  isIOS: boolean;
  isInIOSSafari: boolean;
  iosVersion: number | null;
}) {
  const supported = isIOS;
  const defaultVariant: InstallVariant =
    iosVersion !== null && iosVersion >= 26 ? 'liquid-glass' : 'pre-26';
  const [variant, setVariant] = useState<InstallVariant>(defaultVariant);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div
        style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '1.5rem',
        }}
      >
        <h2
          style={{
            margin: '0 0 1rem',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#fff',
          }}
        >
          INSTALL
        </h2>
        {isIOS && isInIOSSafari ? (
          <>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <TabButton
                label="iOS 26+"
                active={variant === 'liquid-glass'}
                onClick={() => setVariant('liquid-glass')}
              />
              <TabButton
                label="iOS 18–25"
                active={variant === 'pre-26'}
                onClick={() => setVariant('pre-26')}
              />
            </div>
            {variant === 'liquid-glass'
              ? renderLiquidGlassSteps()
              : renderLegacySteps()}
          </>
        ) : (
          renderNonSafariOrUnsupported({ isIOS, isInIOSSafari })
        )}
      </div>

      {!supported && (
        <div
          style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <h2
            style={{
              margin: '0 0 1rem',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#fff',
            }}
          >
            SEND TO YOUR PHONE
          </h2>
          <SharePanel description="Open this link on an iPhone — or send it to someone who can." />
        </div>
      )}
    </div>
  );
}

type InstallVariant = 'liquid-glass' | 'pre-26';

function renderLiquidGlassSteps() {
  return (
    <>
      <p style={{ ...paragraph, marginBottom: '0.75rem', color: '#888' }}>
        For iOS 26 and later (Liquid Glass Safari).
      </p>
      <ol style={list}>
        <li>
          Tap the <strong>…</strong> menu at the bottom right
        </li>
        <li>
          Tap <strong>Share</strong>
        </li>
        <li>
          Tap <strong>View More</strong>
        </li>
        <li>
          Scroll down and tap <strong>Add to Home Screen</strong>
        </li>
        <li>
          Tap <strong>Add</strong>
        </li>
        <li>Open PARTYPACER from your home screen</li>
      </ol>
    </>
  );
}

function renderLegacySteps() {
  return (
    <>
      <p style={{ ...paragraph, marginBottom: '0.75rem', color: '#888' }}>
        For iOS 18 through 25 (pre-Liquid-Glass Safari).
      </p>
      <ol style={list}>
        <li>
          Tap the <strong>Share</strong> button (square with an up arrow at
          the bottom of Safari)
        </li>
        <li>
          Scroll down and tap <strong>Add to Home Screen</strong>
        </li>
        <li>
          Tap <strong>Add</strong>
        </li>
        <li>Open PARTYPACER from your home screen</li>
      </ol>
    </>
  );
}

function renderNonSafariOrUnsupported({
  isIOS,
  isInIOSSafari,
}: {
  isIOS: boolean;
  isInIOSSafari: boolean;
}) {
  if (isIOS && !isInIOSSafari) {
    return (
      <p style={paragraph}>
        Open this page in Safari to install. Tap the address bar and choose{' '}
        <strong>Open in Safari</strong>.
      </p>
    );
  }
  return (
    <p style={paragraph}>
      PARTYPACER currently requires iPhone with iOS 18 or later. Android and
      desktop are not supported yet.
    </p>
  );
}

const paragraph: React.CSSProperties = {
  margin: 0,
  color: '#ddd',
  fontSize: '0.95rem',
  lineHeight: 1.5,
};

const list: React.CSSProperties = {
  margin: 0,
  paddingLeft: '1.25rem',
  color: '#ddd',
  fontSize: '0.95rem',
  lineHeight: 1.6,
};
