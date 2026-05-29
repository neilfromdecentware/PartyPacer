import { ensurePartyEventIds, type Party } from './party';

const DATA_KEY = 'partypacer-data';

export interface Settings {
  discreetMode: boolean;
  lockEnabled: boolean;
  lockTimeoutMinutes: number;
  hideStopThanks: boolean;
}

export interface AppState {
  settings: Settings;
  current: Party | null;
  history: Party[];
  customConsumeEmoji: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  discreetMode: true,
  lockEnabled: true,
  lockTimeoutMinutes: 15,
  hideStopThanks: false,
};

export const EMPTY_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  current: null,
  history: [],
  customConsumeEmoji: [],
};


export interface LoadResult {
  state: AppState;
  dataKey: CryptoKey | null;
}

export interface SaveOptions {
  rotate?: boolean;
}

// TODO these byte<->b64 loops are copy-pasted in biometric.ts, dedupe sometime
function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return buf;
}

async function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

async function wrapDataKey(
  masterKey: CryptoKey,
  dataKey: CryptoKey,
): Promise<{ wrapIv: Uint8Array; wrappedKey: ArrayBuffer }> {
  const raw = await crypto.subtle.exportKey('raw', dataKey);
  const wrapIvBuf = new ArrayBuffer(12);
  const wrapIv = new Uint8Array(wrapIvBuf);
  crypto.getRandomValues(wrapIv);
  const wrappedKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: wrapIvBuf },
    masterKey,
    raw,
  );
  return { wrapIv, wrappedKey };
}

async function unwrapDataKey(
  masterKey: CryptoKey,
  wrapIv: ArrayBuffer,
  wrappedKey: ArrayBuffer,
): Promise<CryptoKey> {
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: wrapIv },
    masterKey,
    wrappedKey,
  );
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function loadAppState(masterKey: CryptoKey): Promise<LoadResult> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DATA_KEY);
  } catch {
    /* ignore */
  }
  if (!raw) return { state: EMPTY_STATE, dataKey: null };

  try {
    const blob = JSON.parse(raw) as {
      iv: string;
      data: string;
      wrapIv?: string;
      wrappedKey?: string;
    };

    let decryptKey: CryptoKey;
    let dataKey: CryptoKey | null = null;
    // new format: unwrap the data key. legacy blobs (no wrappedKey) were encrypted
    // straight with the master key — see "backward compatibility" in storage.test.ts.
    if (blob.wrappedKey && blob.wrapIv) {
      const wrapIvBuf = base64ToBuffer(blob.wrapIv);
      const wrappedKeyBuf = base64ToBuffer(blob.wrappedKey);
      dataKey = await unwrapDataKey(masterKey, wrapIvBuf, wrappedKeyBuf);
      decryptKey = dataKey;
    } else {
      decryptKey = masterKey;
    }

    const ivBuf = base64ToBuffer(blob.iv);
    const cipherBuf = base64ToBuffer(blob.data);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuf },
      decryptKey,
      cipherBuf,
    );
    const parsed = JSON.parse(new TextDecoder().decode(plain)) as AppState;
    return {
      state: {
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        current: parsed.current ? ensurePartyEventIds(parsed.current) : null,
        history: (parsed.history ?? []).map(ensurePartyEventIds),
        customConsumeEmoji: parsed.customConsumeEmoji ?? [],
      },
      dataKey,
    };
  } catch (err) {
    console.warn('decrypt failed', err);
    throw new Error('decrypt-failed');
  }
}

// Two-tier keys. A random data key encrypts the state; the master key (biometric.ts,
// PRF→HKDF) only wraps the data key. rotate => fresh data key => old blob unrecoverbale.
// That's the crypto-erasure: deletes in useParties pass { rotate: true } so removed
// data can't be recovered, not just dropped. https://en.wikipedia.org/wiki/Crypto-shredding
// lose the key, lose the data. nuke it from orbit, only way to be sure.
export async function saveAppState(
  masterKey: CryptoKey,
  state: AppState,
  dataKeyRef: { current: CryptoKey | null }, // mutable holder, owned by useAppState
  options: SaveOptions = {},
): Promise<void> {
  // first save (no key yet) or a delete → mint a new data key. mutates the caller's ref.
  // TODO mutating the caller's ref is gross, just return the new key instead?
  if (!dataKeyRef.current || options.rotate) {
    dataKeyRef.current = await generateDataKey();
  }

  const ivBuf = new ArrayBuffer(12);

  const ivBytes = new Uint8Array(ivBuf);
  crypto.getRandomValues(ivBytes);
  const plainBuf = new TextEncoder().encode(JSON.stringify(state))
    .buffer as ArrayBuffer;
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuf },
    dataKeyRef.current,
    plainBuf,
  );

  // stash the data key wrapped under the master key, next to the ciphertext.
  const { wrapIv, wrappedKey } = await wrapDataKey(
    masterKey,
    dataKeyRef.current,
  );

  const blob = {
    iv: bytesToBase64(ivBytes),
    data: bytesToBase64(new Uint8Array(cipherBuf)),
    wrapIv: bytesToBase64(wrapIv),
    wrappedKey: bytesToBase64(new Uint8Array(wrappedKey)),
  };
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(blob));
  } catch {
    /* ignore */
  }
}

export function wipeAppState(): void {
  try {
    localStorage.removeItem(DATA_KEY);
  } catch {
    /* ignore */
  }
}
