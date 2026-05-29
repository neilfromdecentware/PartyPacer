import { describe, expect, it, beforeEach } from 'vitest';
import {
  registerWithPin,
  unlockWithPin,
  hasPinSalt,
  wipePinSalt,
  MIN_PIN_LENGTH,
} from './pin';
import { saveAppState, loadAppState, EMPTY_STATE } from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('PIN crypto', () => {
  it('registers, persists salt, unlocks with the same PIN → same key', async () => {
    const reg = await registerWithPin('123456');
    expect(reg.ok).toBe(true);
    expect(hasPinSalt()).toBe(true);

    const unlock = await unlockWithPin('123456');
    expect(unlock.ok).toBe(true);

    // The keys themselves are non-extractable, so prove equivalence via a
    // round-trip through the storage envelope: save under reg.key, load
    // under unlock.key, get the same state back.
    if (!reg.ok || !unlock.ok) throw new Error('unreachable');
    const dataKeyRef = { current: null as CryptoKey | null };
    const state = { ...EMPTY_STATE, customConsumeEmoji: ['🦄'] };
    await saveAppState(reg.key, state, dataKeyRef);
    const loaded = await loadAppState(unlock.key);
    expect(loaded.state.customConsumeEmoji).toEqual(['🦄']);
  });

  it('rejects PINs shorter than MIN_PIN_LENGTH', async () => {
    const reg = await registerWithPin('1'.repeat(MIN_PIN_LENGTH - 1));
    expect(reg.ok).toBe(false);
    if (reg.ok) throw new Error('unreachable');
    expect(reg.reason).toBe('invalid');
    expect(hasPinSalt()).toBe(false);
  });

  it('unlock with no salt fails cleanly', async () => {
    const out = await unlockWithPin('123456');
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error('unreachable');
    expect(out.reason).toBe('no-salt');
  });

  it('wrong PIN rejects at unlock, data is never touched', async () => {
    // The whole point of the verifier: a wrong PIN must NOT hand back a
    // key the caller can then feed to storage. Otherwise a typo trips
    // AppRoot.handleDecryptError → wipe.
    const reg = await registerWithPin('correct-pin');
    if (!reg.ok) throw new Error('unreachable');
    const dataKeyRef = { current: null as CryptoKey | null };
    const original = { ...EMPTY_STATE, customConsumeEmoji: ['🍕'] };
    await saveAppState(reg.key, original, dataKeyRef);

    const wrong = await unlockWithPin('wrong-pin');
    expect(wrong.ok).toBe(false);
    if (wrong.ok) throw new Error('unreachable');
    expect(wrong.reason).toBe('wrong-pin');

    // Data survives. Correct PIN still unlocks the original state.
    const right = await unlockWithPin('correct-pin');
    if (!right.ok) throw new Error('unreachable');
    const loaded = await loadAppState(right.key);
    expect(loaded.state.customConsumeEmoji).toEqual(['🍕']);
  });

  it('legacy install (no verifier) accepts the unlock and backfills', async () => {
    // Simulate a PIN install that predates the verifier: salt present,
    // no verifier blob. Unlock should pass through, then write a verifier
    // so the next attempt validates cleanly.
    const reg = await registerWithPin('123456');
    if (!reg.ok) throw new Error('unreachable');
    localStorage.removeItem('partypacer-pin-verifier');

    const first = await unlockWithPin('123456');
    expect(first.ok).toBe(true); // legacy: passes through
    expect(localStorage.getItem('partypacer-pin-verifier')).not.toBeNull();

    // After backfill, a wrong PIN is now caught.
    const wrong = await unlockWithPin('999999');
    expect(wrong.ok).toBe(false);
    if (wrong.ok) throw new Error('unreachable');
    expect(wrong.reason).toBe('wrong-pin');
  });

  it('wipePinSalt clears the salt', async () => {
    await registerWithPin('123456');
    expect(hasPinSalt()).toBe(true);
    wipePinSalt();
    expect(hasPinSalt()).toBe(false);
  });
});
