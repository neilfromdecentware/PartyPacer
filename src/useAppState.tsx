import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  EMPTY_STATE,
  loadAppState,
  saveAppState,
  type AppState,
  type SaveOptions,
} from './storage';

interface ContextValue {
  state: AppState;
  update: (updater: (s: AppState) => AppState, options?: SaveOptions) => void;
}

const AppStateContext = createContext<ContextValue | null>(null);


export function AppStateProvider({
  encryptionKey,
  onDecryptError,
  children,
}: {
  encryptionKey: CryptoKey;
  onDecryptError?: () => void;
  children: ReactNode;
}) {
  const [state, setState] = useState<AppState | null>(null);
  // data key in a ref, not state: saveAppState mutates .current on rotate and we
  // don't want a re-render when it swaps. populated from loadAppState below. see storage.ts.
  const dataKeyRef = useRef<CryptoKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAppState(encryptionKey)
      .then(({ state: loaded, dataKey }) => {
        if (cancelled) return;
        dataKeyRef.current = dataKey;
        setState(loaded);
      })
      .catch(() => {
        if (cancelled) return;
        onDecryptError?.();
        setState(EMPTY_STATE);
      });
    return () => {
      cancelled = true;
    };
  }, [encryptionKey, onDecryptError]);

  function update(
    updater: (s: AppState) => AppState,
    options?: SaveOptions,
  ) {
    setState((prev) => {
      const base = prev ?? EMPTY_STATE;
      const next = updater(base);
      void saveAppState(encryptionKey, next, dataKeyRef, options);
      return next;
    });
  }

  const value = useMemo<ContextValue>(
    () => ({
      state: state ?? EMPTY_STATE,
      update,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  );

  if (state === null) return null;

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): ContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState outside AppStateProvider');
  return ctx;
}
