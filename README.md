# PARTYPACER

A pocket tally for a night out. Log what you've had and how you feel, watch it
on a timeline, keep your bearings when things get loose. A personal safety tool,
not a social app: no accounts, no feed, nothing leaves your phone.

**→ Try it: https://party-pacer.web.app** : open on a phone, add it to your home
screen. It only runs as an installed PWA (see [Install gate](#install-gate)).

Free, AGPLv3. It promises "your data stays on your phone" because it's built
incapable of doing anything else. The rest of this is for people reading or
forking the code.

---

**Zero network requests at runtime.** No backend, no analytics, no error
reporting, no fonts from a CDN. Everything you log is encrypted on-device under
a key only your passkey can rebuild. Serverless.

## Install gate

`main.tsx` it's role branches on display mode.

- Browser tab → `Landing`, a static install page. The app (`AppRoot`)
- installed standalone PWA (`navigator.standalone` or `display-mode: standalone`).
  "on your phone, not in a tab" is literal, and the lock/biometric flow is on install

## Cryptographic design

Goal: data at rest is useless to anyone but the user holding the unlocked phone,
and "delete" means gone; not tombstoned.

### Key derivation

The aster key is never on the disk

```
WebAuthn platform passkey  (Face ID / Touch ID, userVerification: required)
        │  PRF extension, eval input "partypacer-encryption-v1"
        ▼
   PRF output  (high-entropy, deterministic per credential+input)
        │  HKDF-SHA256  (salt "partypacer-salt-v1", info "partypacer-aes-key")
        ▼
   AES-256-GCM "master key"   (extractable: false)
```

Register (`registerWithEncryption`): create a credential, ask for the [PRF extension](https://w3c.github.io/webauthn/#prf-extension).
Cold starting the app (`unlockEncryption`): requireds the same credential,
get the same PRF output, run it through HKDF, get the master key back

Never serialized : a non-extractable `CryptoKey`, in memory for the session
only. Persisted: the credential ID and a random user handle (`biometric.ts`).

### Storage : two-tier envelope

State isn't encrypted under the master key directly. An envelope instead:

```
random data key (AES-256-GCM, per blob)  ──encrypts──▶  app state JSON
master key (from PRF)                     ──wraps────▶  data key
```

Ciphertext + wrapped data key (each with its own 96-bit IV) live together as one
JSON blob in `localStorage["partypacer-data"]`. Load: unwrap the data key with
the master key, decrypt the state with the data key.

### Delete = key rotation = crypto-shredding

Deleting a logged event creates a new data key. `useParties` saves with
`{ rotate: true }`: fresh data key, re-encrypt the now-smaller state, overwrite
the blob. The old data key only ever lived inside the blob we just overwrote :
so the deleted bytes are
[cryptographically unrecoverable](https://en.wikipedia.org/wiki/Crypto-shredding),
not spliced out of an array that a forensic tool could carve back. The full wipe
rides the same mechanism.

### Privacy Lock

Separate from encryption. An idle timer re-locks the UI; coming back needs a
biometric assertion (`assertForPrivacyLock` : same credential, _no_ PRF, just a
presence check, the master key's already in memory). Timeout configurable in
Settings. Screen blurs on backgrounding too. TODO: make this timeout dump the
plaintext from memory as well.

### Failure mode

Decryption fails : y wipes blob + credential and shows the onboarding low.
There's no recovery code, on purpose. Lose the passkey, lose the data.

### Stored / not stored

| `localStorage` key                 | contents                                               |
| ---------------------------------- | ------------------------------------------------------ |
| `partypacer-data`                  | the encrypted envelope (ciphertext + wrapped data key) |
| `partypacer-credential-id`         | WebAuthn credential ID (not secret)                    |
| `partypacer-user-handle`           | random 16-byte handle (not secret)                     |
| `partypacer-ios-install-dismissed` | UI dismissal flag                                      |

No plaintext party data anywhere. Native Web Crypto (`crypto.subtle`), no crypto
libraries vendored.

## Threat model

**Protects against:** someone picking up the device, data pulled from a backup,
and nothing's transmitted; no network interception, server breach, profiling.
No off-device data to subpoena or sell.

**Doesn't:** a compromised or jailbroken OS with the app unlocked and the master
key live in memory; a hostile build (verify what you install). PRF is required —
no WebAuthn-PRF, no key, no onboarding.

## Tech stack

- React 19 + TypeScript + Vite 7
- Web Crypto, WebAuthn (PRF), an offline-first service worker; no runtime
  deps beyond React and `qrcode.react`
- **Firebase Hosting** for static delivery (see [Firebase](#firebase))
- **Vitest** for the crypto + model tests

## Project layout

```
src/
  main.tsx            entry; install-gate (Landing vs AppRoot) + SW registration
  AppRoot.tsx         boot state machine: checking → onboarding | locked → unlocked
  App.tsx             main timeline UI (should be split up for readabilitly)
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

## Build, run, deploy

```bash
npm install
npm run dev        # vite dev server on :5173
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve the production build locally
npm test           # vitest run (crypto round-trip, rotation, model)
```

> browser shows `Landing`: that's the install-PWA gate. To run the app itself:
> install the build to your home screen, or relax the `isStandalone()`
> check in `main.tsx`.

Deploy (needs your own Firebase project + `.firebaserc`: see
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
and a `/mail` doc (the latter consumed by the _Trigger Email from Firestore_
extension).

`firestore.rules` matches that: field allowlists, type/size caps, a fixed mail
recipient, catch-all `allow read, write: if false`. note: rules can't
rate-limit. Could be vulnerable to someone trying to mess up the server maliciously
which would be a weird choice, but at least let's be honest about it.

## Forking

Per-deployer Firebase config stays out of the repo (for clean forks, not
secrecy (web config is public by design, gated by the rules above)). Copy the
templates, fill in your project:

```bash
cp .firebaserc.example .firebaserc                          # project + site IDs
cp feedback/firebase-config.example.js feedback/firebase-config.js
```

Real files are gitignored; the `.example` files are in the repo

## Known gaps / non-goals

- **No lint config.** A few `eslint-disable` comments, no committed
  ESLint/formatter. TODO.
- **Feedback rate-limiting** needs App Check (see [Firebase](#firebase)).
- **iOS external links:** an installed iOS PWA can't reliably hand a URL to
  Safari; `openExternal` (`links.ts`) tries `_system`, falls back to a tab.
- **No cross-device sync, ever.** That's the point. "Share" shares the app
  URL/QR, never your data.

## License

Source: https://github.com/neilfromdecentware/PartyPacer

AGPLv3 (see [`LICENSE`](./LICENSE). Copyright © 2026 Decentware.)

Run a modified version as a network service and the AGPL makes you offer your
users the source.

## TODO

`TODO` comments in the source, roughly highest-impact first:

- **Andoird Support** While my brother in law says installing it to android had
  work perfectly, I don't have access to a device, so I can't write clear
  install flows or instructions. I'm also not sure what the vulnerabilitly
  surface is of weird or wild android distros.
- **Drop in-memory plaintext when Privacy Lock engages** (`src/App.tsx:626`)
  the lock only gates re-entry; the decrypted state and data key stay live in
  memory, so someone with the device and the know-how could scrape plaintext off
  the heap. The one item here with real threat-model weight. Not a quick fix.
- **Document PIN mode in tour and flows** PIN-derived encryption ships
  alongside the passkey path (`src/pin.ts`), but the in-app tour
  (`ProductTour`, `SettingsTour`, `AboutFlow`), the README crypto section,
  the threat-model copy, and the Settings UI. A lot of the flows and settings
  still refer to faceID
- **Consider Unencrypted Mode** I really care about privacy, but maybe some
  users dont, this is optional.
- **UX refinement** I think some of the logging interactionss could be simpler
  and more intuitive
- **Cover the idle-blur effect, then drop its `eslint-disable`**
  (`src/App.tsx:694`) hand-managed dependency array, no tests. Exactly where a
  stale-closure bug hides.
- **Unify the idle-counter writes** (`src/App.tsx:600`) two writers on one
  ref, races waiting to happen.
- **Extract `useIdleBlur`** (`src/App.tsx:585`) big enough to earn its own
  `hooks/useIdleBlur.ts`.
- **Stop mutating the caller's data-key ref** (`src/storage.ts:166`)
  `saveAppState` mutates a ref it's handed; return the new key instead.
- **DRY the base64↔bytes helpers** (`src/storage.ts:43`) copy-pasted
  across `storage.ts` and `biometric.ts`.

Non-code items (lint, App Check, iOS links) live in
[Known gaps / non-goals](#known-gaps--non-goals).
