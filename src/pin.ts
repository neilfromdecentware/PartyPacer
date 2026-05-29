// PIN-derived master key, alternative to biometric.ts's WebAuthn/PRF path.
// Same shape (non-extractable AES-GCM CryptoKey) so storage.ts uses it
// identically. Master-key entropy is bounded by PIN strength; see README
// threat-model.

const PIN_SALT_KEY = 'partypacer-pin-salt';
// Verifier blob. Catches wrong PINs before they reach storage.
const PIN_VERIFIER_KEY = 'partypacer-pin-verifier';

// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const PBKDF2_ITERATIONS = 600_000;

export const MIN_PIN_LENGTH = 4;

const VERIFIER_PLAINTEXT = new TextEncoder().encode(
  'partypacer-pin-verifier-v1',
);

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function readSalt(): Uint8Array | null {
  try {
    const b = localStorage.getItem(PIN_SALT_KEY);
    if (!b) return null;
    return base64ToBytes(b);
  } catch {
    return null;
  }
}

function writeSalt(salt: Uint8Array): void {
  try {
    localStorage.setItem(PIN_SALT_KEY, bytesToBase64(salt));
  } catch {
    /* ignore */
  }
}

async function deriveKeyFromPin(
  pin: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

interface Verifier {
  iv: string;
  ct: string;
}

async function writeVerifier(key: CryptoKey): Promise<void> {
  try {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      VERIFIER_PLAINTEXT,
    );
    const blob: Verifier = {
      iv: bytesToBase64(iv),
      ct: bytesToBase64(new Uint8Array(ct)),
    };
    localStorage.setItem(PIN_VERIFIER_KEY, JSON.stringify(blob));
  } catch {
    /* ignore */
  }
}

// `true` = correct PIN. `false` = wrong PIN. `'legacy'` = no verifier
// stored yet (install predates the verifier); caller decides how to handle.
async function verifyKey(key: CryptoKey): Promise<boolean | 'legacy'> {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(PIN_VERIFIER_KEY);
  } catch {
    /* ignore */
  }
  if (!stored) return 'legacy';
  try {
    const blob = JSON.parse(stored) as Verifier;
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(blob.iv) as BufferSource },
      key,
      base64ToBytes(blob.ct) as BufferSource,
    );
    return true;
  } catch {
    return false;
  }
}

export type PinOutcome =
  | { ok: true; key: CryptoKey }
  | { ok: false; reason: 'invalid' | 'no-salt' | 'wrong-pin' | 'error' };

export async function registerWithPin(pin: string): Promise<PinOutcome> {
  if (pin.length < MIN_PIN_LENGTH) return { ok: false, reason: 'invalid' };
  try {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const key = await deriveKeyFromPin(pin, salt);
    writeSalt(salt);
    await writeVerifier(key);
    return { ok: true, key };
  } catch (err) {
    console.warn('PIN register failed', err);
    return { ok: false, reason: 'error' };
  }
}

export async function unlockWithPin(pin: string): Promise<PinOutcome> {
  if (pin.length < MIN_PIN_LENGTH) return { ok: false, reason: 'invalid' };
  const salt = readSalt();
  if (!salt) return { ok: false, reason: 'no-salt' };
  try {
    const key = await deriveKeyFromPin(pin, salt);
    const verified = await verifyKey(key);
    if (verified === false) return { ok: false, reason: 'wrong-pin' };
    // Legacy install (no verifier yet). Backfill so the next attempt
    // validates cleanly. Wrong PIN here still wipes via decrypt-fail.
    if (verified === 'legacy') await writeVerifier(key);
    return { ok: true, key };
  } catch (err) {
    console.warn('PIN unlock failed', err);
    return { ok: false, reason: 'error' };
  }
}

export function hasPinSalt(): boolean {
  try {
    return localStorage.getItem(PIN_SALT_KEY) !== null;
  } catch {
    return false;
  }
}

export function wipePinSalt(): void {
  try {
    localStorage.removeItem(PIN_SALT_KEY);
    localStorage.removeItem(PIN_VERIFIER_KEY);
  } catch {
    /* ignore */
  }
}
