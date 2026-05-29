# PARTYPACER

A pocket tally for a night out. Log what you've had and how you feel, watch it
on a timeline, keep your bearings when things get loose. A personal safety tool,
not a social app — no accounts, no feed, nothing leaves your phone.

**→ Try it: https://party-pacer.web.app** — open on a phone, add it to your home
screen. It only runs as an installed PWA (see [Install gate](#install-gate)).

Free, AGPLv3. It promises "your data stays on your phone" because it's built
incapable of doing anything else. The rest of this is for people reading or
forking the code.

---

**Zero network requests at runtime.** No backend, no analytics, no error
reporting, no fonts from a CDN. Everything you log is encrypted on-device under
a key only your passkey can rebuild. No server to leak, because there's no
server.

## Install gate

`main.tsx` branches on display mode. Browser tab → `Landing`, a static install
page. The app (`AppRoot`) only mounts as an installed standalone PWA
(`navigator.standalone` or `display-mode: standalone`). Keeps the "on your
phone, not in a tab" line literal, and the lock/biometric flow only runs where
passkeys behave predictably.

## Cryptographic design

The part worth reviewing. Goal: data at rest is useless to anyone but the user
holding the unlocked phone, and "delete" means gone — not tombstoned.

### Key derivation — the master key never touches disk

```
WebAuthn platform passkey  (Face ID / Touch ID, userVerification: required)
        │  PRF extension, eval input "partypacer-encryption-v1"
        ▼
   PRF output  (high-entropy, deterministic per credential+input)
        │  HKDF-SHA256  (salt "partypacer-salt-v1", info "partypacer-aes-key")
        ▼
   AES-256-GCM "master key"   (extractable: false)
```

Register (`registerWithEncryption`): create a resident platform credential, ask
for the [PRF extension](https://w3c.github.io/webauthn/#prf-extension). Cold
start (`unlockEncryption`): assert the same credential, get the same PRF output,
run it through HKDF, master key's back.

Never serialized — a non-extractable `CryptoKey`, in memory for the session
only. Persisted: the credential ID and a random user handle (`biometric.ts`).
Nothing key-bearing. No passkey, no key. No key, no plaintext.

### Storage — two-tier envelope

State isn't encrypted under the master key directly. An envelope instead:

```
random data key (AES-256-GCM, per blob)  ──encrypts──▶  app state JSON
master key (from PRF)                     ──wraps────▶  data key
```

Ciphertext + wrapped data key (each with its own 96-bit IV) live together as one
JSON blob in `localStorage["partypacer-data"]`. Load: unwrap the data key with
the master key, decrypt the state with the data key.

### Delete = key rotation = crypto-shredding

Deleting a logged event mints a new data key. `useParties` saves with
`{ rotate: true }`: fresh data key, re-encrypt the now-smaller state, overwrite
the blob. The old data key only ever lived inside the blob we just overwrote —
so the deleted bytes are
[cryptographically unrecoverable](https://en.wikipedia.org/wiki/Crypto-shredding),
not spliced out of an array a forensic tool could carve back. The full wipe
rides the same mechanism.

### Privacy Lock

Separate from encryption. An idle timer re-locks the UI; coming back needs a
biometric assertion (`assertForPrivacyLock` — same credential, *no* PRF, just a
presence check, the master key's already in memory). Timeout configurable in
Settings. Screen blurs on backgrounding too.

### Failure mode

Decryption fails — corrupt blob, credential mismatch, OS passkey reset — and
`AppRoot.handleDecryptError` wipes blob + credential and drops to onboarding. No
half-decrypted state, no "enter recovery code." There's no recovery code, on
purpose. Lose the passkey, lose the data.

### Stored / not stored

| `localStorage` key | contents |
| --- | --- |
| `partypacer-data` | the encrypted envelope (ciphertext + wrapped data key) |
| `partypacer-credential-id` | WebAuthn credential ID (not secret) |
| `partypacer-user-handle` | random 16-byte handle (not secret) |
| `partypacer-ios-install-dismissed` | UI dismissal flag |

No plaintext party data anywhere. Native Web Crypto (`crypto.subtle`), no crypto
libraries vendored.

## Threat model

**Protects against:** someone picking up the device, data pulled from a backup,
and — nothing's transmitted — network interception, server breach, profiling.
No off-device data to subpoena or sell.

**Doesn't:** a compromised or jailbroken OS with the app unlocked and the master
key live in memory; a hostile build (verify what you install). PRF is required —
no WebAuthn-PRF, no key, no onboarding.

## Tech stack

- **React 19** + **TypeScript** (strict) + **Vite 7**
- Web Crypto, WebAuthn (PRF), an offline-first **service worker** — no runtime
  deps beyond React and `qrcode.react`
- **Firebase Hosting** for static delivery (nothing pulled at runtime — see
  [Firebase](#firebase))
- **Vitest** for the crypto + model tests

## Project layout

```
src/
  main.tsx            entry; install-gate (Landing vs AppRoot) + SW registration
  AppRoot.tsx         boot state machine: checking → onboarding | locked → unlocked
  App.tsx             main timeline UI (still chunky — see notes inline)
  biometric.ts        WebAuthn passkey + PRF → HKDF → master key
  storage.ts          two-tier AES-GCM envelope; load/save/wipe; key rotation
  party.ts            Party / event data model + helpers
  useAppState.tsx     context: holds decrypted state + the live data-key ref
  useParties.ts       add/delete events (delete → { rotate: true })
  useSettings.ts, useCustomConsumeEmoji.ts, useNow.ts
  lib/                pure helpers (emoji sets, time formatting)
  components/         screens: Onboarding, LockScreen, Landing, SettingsPage,
                      SharePage, wizards, StopThanks, tours, install prompt …
public/
  sw.js               cache-first service worker (precache + runtime cache)
  manifest.json, icons, splash screens
feedback/             standalone feedback page (separate Firebase site)
firestore.rules       locks Firestore down to just the feedback writes
```

`App.tsx` carries `// TODO`-style notes where a split was skipped on purpose —
the pieces are entangled, not just co-located. Signposts, not oversights.

## Build, run, deploy

```bash
npm install
npm run dev        # vite dev server on :5173
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve the production build locally
npm test           # vitest run (crypto round-trip, rotation, model)
```

> Dev tab shows `Landing` — that's the install-PWA gate. To poke the app itself:
> install the preview build to your home screen, or relax the `isStandalone()`
> check in `main.tsx`.

Deploy (needs your own Firebase project + `.firebaserc` — see
[Forking](#forking)):

```bash
npm run deploy           # build + deploy the app (hosting:party-pacer)
npm run deploy:feedback  # deploy the feedback page
npm run deploy:rules     # deploy firestore.rules
```

## Firebase

The PWA never imports or calls Firebase (`grep firebase src/` → empty). Firebase
is just the static host. The only network code in the project is the separate
**feedback page** (`feedback/`, its own hosting site): writes a `/feedback` doc
and a `/mail` doc (the latter consumed by the *Trigger Email from Firestore*
extension).

`firestore.rules` matches that: field allowlists, type/size caps, a fixed mail
recipient, catch-all `allow read, write: if false`. Caveat — rules can't
rate-limit. A scripted client posting valid-shaped docs would need App Check or a
throttled Cloud Function ahead of the mail send. Known gap, flagged in the file.

## Forking

Per-deployer Firebase config stays out of the repo — for clean forks, not
secrecy (web config is public by design, gated by the rules above). Copy the
templates, fill in your project:

```bash
cp .firebaserc.example .firebaserc                          # project + site IDs
cp feedback/firebase-config.example.js feedback/firebase-config.js
```

Real files are gitignored; the `.example` versions show the shape.

## Known gaps / non-goals

- **No lint config.** A few `eslint-disable` comments, no committed
  ESLint/formatter. TODO.
- **Feedback rate-limiting** needs App Check (see [Firebase](#firebase)).
- **iOS external links:** an installed iOS PWA can't reliably hand a URL to
  Safari; `openExternal` (`links.ts`) tries `_system`, falls back to a tab.
- **No cross-device sync, ever.** That's the point. "Share" shares the app
  URL/QR, never your data.

## License

AGPLv3 — see [`LICENSE`](./LICENSE). Copyright © 2026 Decentware.

Run a modified version as a network service and the AGPL makes you offer your
users the source.

## TODO

`TODO` comments in the source, roughly highest-impact first:

- **Drop in-memory plaintext when Privacy Lock engages** (`src/App.tsx:626`) —
  the lock only gates re-entry; the decrypted state and data key stay live in
  memory, so someone with the device and the know-how could scrape plaintext off
  the heap. The one item here with real threat-model weight. Not a quick fix.
- **Document PIN mode in tour and flows** — PIN-derived encryption ships
  alongside the passkey path (`src/pin.ts`), but the in-app tour
  (`ProductTour`, `SettingsTour`, `AboutFlow`), the README crypto section,
  the threat-model copy, and the Settings UI (Privacy Lock should hide or
  re-label for PIN users — see the inline `// TODO` in
  `assertForPrivacyLock`) still describe only the passkey path. Blocks
  promoting PIN mode beyond preview.
- **Cover the idle-blur effect, then drop its `eslint-disable`**
  (`src/App.tsx:694`) — hand-managed dependency array, no tests. Exactly where a
  stale-closure bug hides.
- **Unify the idle-counter writes** (`src/App.tsx:600`) — two writers on one
  ref, races waiting to happen.
- **Extract `useIdleBlur`** (`src/App.tsx:585`) — big enough to earn its own
  `hooks/useIdleBlur.ts`.
- **Stop mutating the caller's data-key ref** (`src/storage.ts:166`) —
  `saveAppState` mutates a ref it's handed; return the new key instead.
- **Dedupe the base64↔bytes helpers** (`src/storage.ts:43`) — copy-pasted
  across `storage.ts` and `biometric.ts`.

Non-code items (lint, App Check, iOS links) live in
[Known gaps / non-goals](#known-gaps--non-goals).
