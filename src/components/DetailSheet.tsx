import type { ReactNode } from 'react';

export function DetailSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.96)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'env(safe-area-inset-top, 0px) 1rem env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0.75rem 1rem 1.25rem',
            borderBottom: '1px solid #2a2a2a',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.03em',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '40px',
              height: '40px',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              fontSize: '1.5rem',
              lineHeight: 1,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '1.25rem',
            color: '#ccc',
            fontSize: '0.92rem',
            lineHeight: 1.55,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {title && (
        <h3
          style={{
            margin: '0 0 0.4rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </h3>
      )}
      <div style={{ color: '#bbb' }}>{children}</div>
    </div>
  );
}

export function SheetDivider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid #2a2a2a',
        margin: '0.5rem 0 1.25rem',
      }}
    />
  );
}

export function SheetHeavyDivider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '2px solid #444',
        margin: '1.25rem 0 1.5rem',
      }}
    />
  );
}
