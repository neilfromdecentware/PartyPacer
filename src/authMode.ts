// Tracks whether this install uses passkey (WebAuthn/PRF) or PIN-derived
// encryption. Set on onboarding, read on every cold start by AppRoot to
// decide which unlock UI to show.

export type AuthMode = 'passkey' | 'pin';

const AUTH_MODE_KEY = 'partypacer-auth-mode';

// Duplicated on purpose from biometric.ts: importing it here would create a
// circular dep (biometric.ts wants to consult auth mode for Privacy Lock).
// Keep in sync.
const CREDENTIAL_ID_KEY = 'partypacer-credential-id';

export function getAuthMode(): AuthMode | null {
  try {
    const m = localStorage.getItem(AUTH_MODE_KEY);
    if (m === 'passkey' || m === 'pin') return m;
    // Back-compat: installs that predate this flag had only the passkey
    // path. A stored credential id = passkey mode.
    if (localStorage.getItem(CREDENTIAL_ID_KEY) !== null) return 'passkey';
  } catch {
    /* ignore */
  }
  return null;
}

export function setAuthMode(mode: AuthMode): void {
  try {
    localStorage.setItem(AUTH_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function wipeAuthMode(): void {
  try {
    localStorage.removeItem(AUTH_MODE_KEY);
  } catch {
    /* ignore */
  }
}
