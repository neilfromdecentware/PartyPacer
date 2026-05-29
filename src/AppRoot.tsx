import { useEffect, useState } from 'react';
import App from './App';
import { Onboarding } from './components/Onboarding';
import { LockScreen } from './components/LockScreen';
import { AppStateProvider } from './useAppState';
import { wipeCredential } from './biometric';
import { wipePinSalt } from './pin';
import { getAuthMode, wipeAuthMode, type AuthMode } from './authMode';
import { wipeAppState } from './storage';

type BootState =
  | { phase: 'checking' }
  | { phase: 'onboarding' }
  | { phase: 'locked'; mode: AuthMode }
  | { phase: 'unlocked'; key: CryptoKey; openTour?: boolean };

export default function AppRoot() {
  const [boot, setBoot] = useState<BootState>({ phase: 'checking' });

  useEffect(() => {
    const mode = getAuthMode();
    setBoot(mode ? { phase: 'locked', mode } : { phase: 'onboarding' });
  }, []);

  function handleDecryptError() {
    wipeAppState();
    wipeCredential();
    wipePinSalt();
    wipeAuthMode();
    setBoot({ phase: 'onboarding' });
  }

  if (boot.phase === 'checking') return null;

  if (boot.phase === 'onboarding') {
    return (
      <Onboarding
        onDone={(key, withTour) =>
          setBoot({ phase: 'unlocked', key, openTour: withTour })
        }
      />
    );
  }

  if (boot.phase === 'locked') {
    return (
      <LockScreen
        mode={boot.mode}
        onUnlocked={(key) => setBoot({ phase: 'unlocked', key })}
        onWiped={() => setBoot({ phase: 'onboarding' })}
      />
    );
  }

  return (
    <AppStateProvider
      encryptionKey={boot.key}
      onDecryptError={handleDecryptError}
    >
      <App initialTourOpen={boot.openTour} />
    </AppStateProvider>
  );
}
