const CREDENTIAL_ID_KEY = 'partypacer-credential-id';
const USER_HANDLE_KEY = 'partypacer-user-handle';


const PRF_EVAL_INPUT = new TextEncoder().encode('partypacer-encryption-v1');
const HKDF_SALT = new TextEncoder().encode('partypacer-salt-v1');
const HKDF_INFO = new TextEncoder().encode('partypacer-aes-key');

export function biometricsAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

export function hasCredential(): boolean {
  try {
    return localStorage.getItem(CREDENTIAL_ID_KEY) !== null;
  } catch {
    return false;
  }
}

export function wipeCredential(): void {
  try {
    localStorage.removeItem(CREDENTIAL_ID_KEY);
    localStorage.removeItem(USER_HANDLE_KEY);
  } catch {
    /* ignore */
  }
}

function readCredentialId(): ArrayBuffer | null {
  try {
    const stored = localStorage.getItem(CREDENTIAL_ID_KEY);
    if (!stored) return null;
    const bin = atob(stored);
    const buf = new ArrayBuffer(bin.length);
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return buf;
  } catch {
    return null;
  }
}

function writeCredentialId(rawId: ArrayBuffer): void {
  try {
    const bytes = new Uint8Array(rawId);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    localStorage.setItem(CREDENTIAL_ID_KEY, btoa(bin));
  } catch {
    /* ignore */
  }
}

function getUserHandle(): ArrayBuffer {
  const buf = new ArrayBuffer(16);
  const bytes = new Uint8Array(buf);
  try {
    const stored = localStorage.getItem(USER_HANDLE_KEY);
    if (stored) {
      const bin = atob(stored);
      for (let i = 0; i < bin.length && i < 16; i++) bytes[i] = bin.charCodeAt(i);
      return buf;
    }
  } catch {
    /* ignore */
  }
  crypto.getRandomValues(bytes);
  try {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    localStorage.setItem(USER_HANDLE_KEY, btoa(bin));
  } catch {
    /* ignore */
  }
  return buf;
}

async function deriveKeyFromPrf(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    prfOutput,
    'HKDF',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: HKDF_SALT,
      info: HKDF_INFO,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export type AuthOutcome =
  | { ok: true; key: CryptoKey }
  | { ok: false; reason: 'cancelled' | 'unsupported' | 'error' };

// New platform passkey + PRF → AES-GCM key. Onboarding only.
export async function registerWithEncryption(): Promise<AuthOutcome> {
  if (!biometricsAvailable()) return { ok: false, reason: 'unsupported' };

  try {
    const challenge = new ArrayBuffer(32);
    crypto.getRandomValues(new Uint8Array(challenge));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'PARTYPACER', id: window.location.hostname },
        user: {
          id: getUserHandle(),
          name: 'partypacer-user',
          displayName: 'PARTYPACER user',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
        },
        timeout: 60_000,
        extensions: {
          prf: { eval: { first: PRF_EVAL_INPUT } },
        } as unknown as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return { ok: false, reason: 'error' };

    const extResults = credential.getClientExtensionResults() as {
      prf?: { results?: { first?: ArrayBuffer } };
    };
    const prfOutput = extResults.prf?.results?.first;
    if (!prfOutput) return { ok: false, reason: 'unsupported' };

    writeCredentialId(credential.rawId);
    const key = await deriveKeyFromPrf(prfOutput);
    return { ok: true, key };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('register failed', err);
    return { ok: false, reason: 'error' };
  }
}

// Assert existing crednetial + PRF → AES-GCM key. Every cold start.
export async function unlockEncryption(): Promise<AuthOutcome> {
  if (!biometricsAvailable()) return { ok: false, reason: 'unsupported' };
  const rawId = readCredentialId();
  if (!rawId) return { ok: false, reason: 'error' };

  try {
    const challenge = new ArrayBuffer(32);
    crypto.getRandomValues(new Uint8Array(challenge));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          { type: 'public-key', id: rawId, transports: ['internal'] },
        ],
        userVerification: 'required',
        timeout: 60_000,
        rpId: window.location.hostname,
        extensions: {
          prf: { eval: { first: PRF_EVAL_INPUT } },
        } as unknown as AuthenticationExtensionsClientInputs,
      },
    });

    if (!assertion) return { ok: false, reason: 'error' };

    const extResults = (
      assertion as PublicKeyCredential
    ).getClientExtensionResults() as {
      prf?: { results?: { first?: ArrayBuffer } };
    };
    const prfOutput = extResults.prf?.results?.first;
    if (!prfOutput) return { ok: false, reason: 'unsupported' };

    const key = await deriveKeyFromPrf(prfOutput);
    return { ok: true, key };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('unlock failed', err);
    return { ok: false, reason: 'error' };
  }
}

// Privacy Lock assert — same credential, no PRF. Just the gesture-gated check.
export async function assertForPrivacyLock(): Promise<boolean> {
  if (!biometricsAvailable()) return false;
  const rawId = readCredentialId();
  // PIN-mode (or pre-onboarding) has no credential to assert against. Let
  // them back in; background-blur still works regardless.
  // TODO PIN-mode: hide the Settings lock toggle.
  if (!rawId) return true;

  try {
    const challenge = new ArrayBuffer(32);
    crypto.getRandomValues(new Uint8Array(challenge));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          { type: 'public-key', id: rawId, transports: ['internal'] },
        ],
        userVerification: 'required',
        timeout: 60_000,
        rpId: window.location.hostname,
      },
    });
    return assertion !== null;
  } catch (err) {
    console.warn('privacy lock assert failed', err);
    return false;
  }
}
