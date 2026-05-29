import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAppState,
  saveAppState,
  wipeAppState,
  EMPTY_STATE,
  type AppState,
} from './storage';

const DATA_KEY = 'partypacer-data';

function makeMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function sampleState(): AppState {
  return {
    settings: {
      discreetMode: true,
      lockEnabled: true,
      lockTimeoutMinutes: 15,
      hideStopThanks: false,
    },
    current: {
      id: 'p1',
      events: [
        { type: 'start', at: 1000 },
        { type: 'consume', at: 2000, value: '🍺1', id: 'e1' },
        { type: 'feeling', at: 3000, value: '🥳', id: 'e2' },
      ],
    },
    history: [],
    customConsumeEmoji: ['🦊'],
  };
}

function b64ToU8(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
function u8ToB64(u8: Uint8Array): string {
  return Buffer.from(u8).toString('base64');
}
function readBlob(): { iv: string; data: string; wrappedKey?: string } {
  return JSON.parse(localStorage.getItem(DATA_KEY)!);
}
function decryptWith(key: CryptoKey, blob: { iv: string; data: string }) {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToU8(blob.iv) },
    key,
    b64ToU8(blob.data),
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('round-trip', () => {
  it('save then load returns the same state', async () => {
    const key = await makeMasterKey();
    const ref = { current: null as CryptoKey | null };
    const state = sampleState();
    await saveAppState(key, state, ref);
    const { state: loaded } = await loadAppState(key);
    expect(loaded).toEqual(state);
  });

  it('returns EMPTY_STATE and a null data key when nothing is stored', async () => {
    const key = await makeMasterKey();
    const { state, dataKey } = await loadAppState(key);
    expect(state).toEqual(EMPTY_STATE);
    expect(dataKey).toBeNull();
  });
});

describe('key rotation on delete', () => {
  it('reuses the data key on a normal save', async () => {
    const key = await makeMasterKey();
    const ref = { current: null as CryptoKey | null };
    await saveAppState(key, sampleState(), ref);
    const firstDataKey = ref.current;
    await saveAppState(key, sampleState(), ref); // no rotate
    expect(ref.current).toBe(firstDataKey);
    // same key still decrypts the new blob
    await expect(decryptWith(firstDataKey!, readBlob())).resolves.toBeTruthy();
  });

  it('rotates on { rotate: true }; old key can no longer read new blob', async () => {
    const key = await makeMasterKey();
    const ref = { current: null as CryptoKey | null };

    await saveAppState(key, sampleState(), ref);
    const oldDataKey = ref.current!;
    // old key decrypts first blob
    await expect(decryptWith(oldDataKey, readBlob())).resolves.toBeTruthy();

    await saveAppState(key, sampleState(), ref, { rotate: true });
    expect(ref.current).not.toBe(oldDataKey); // a fresh data key

    // crypto-erasure: discarded key can't read new blob
    await expect(decryptWith(oldDataKey, readBlob())).rejects.toThrow();

    // master key still unwraps + loads
    const { state } = await loadAppState(key);
    expect(state.customConsumeEmoji).toEqual(['🦊']);
  });
});

describe('failure modes', () => {
  it('throws decrypt-failed when loaded with the wrong master key', async () => {
    const keyA = await makeMasterKey();
    const ref = { current: null as CryptoKey | null };
    await saveAppState(keyA, sampleState(), ref);
    const keyB = await makeMasterKey();
    await expect(loadAppState(keyB)).rejects.toThrow('decrypt-failed');
  });

  it('throws decrypt-failed on a corrupted ciphertext', async () => {
    const key = await makeMasterKey();
    const ref = { current: null as CryptoKey | null };
    await saveAppState(key, sampleState(), ref);
    const blob = readBlob();
    // flip ciphertext tail, keep base64 length
    blob.data = blob.data.slice(0, -4) + (blob.data.endsWith('A') ? 'BBBB' : 'AAAA');
    localStorage.setItem(DATA_KEY, JSON.stringify(blob));
    await expect(loadAppState(key)).rejects.toThrow('decrypt-failed');
  });
});

describe('backward compatibility', () => {
  it('reads legacy blob (no wrappedKey)', async () => {
    const key = await makeMasterKey();
    const state = sampleState();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify(state));
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plain,
    );
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({ iv: u8ToB64(iv), data: u8ToB64(new Uint8Array(cipher)) }),
    );

    const { state: loaded, dataKey } = await loadAppState(key);
    expect(loaded.customConsumeEmoji).toEqual(['🦊']);
    expect(dataKey).toBeNull(); // legacy format yields no in-memory data key
  });

  it('backfills missing event ids on load', async () => {
    const key = await makeMasterKey();
    const ref = { current: null as CryptoKey | null };
    const state = sampleState();
    // strip id to mimic older blob
    delete (state.current!.events[1] as { id?: string }).id;
    await saveAppState(key, state, ref);

    const { state: loaded } = await loadAppState(key);
    const consume = loaded.current!.events[1] as { id?: string };
    expect(consume.id).toBeTruthy();
  });
});

describe('wipe', () => {
  it('removes the stored blob', async () => {
    const key = await makeMasterKey();
    const ref = { current: null as CryptoKey | null };
    await saveAppState(key, sampleState(), ref);
    expect(localStorage.getItem(DATA_KEY)).not.toBeNull();
    wipeAppState();
    expect(localStorage.getItem(DATA_KEY)).toBeNull();
  });
});
