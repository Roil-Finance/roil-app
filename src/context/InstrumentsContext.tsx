/**
 * InstrumentsContext — source of truth for asset→admin-party mapping.
 *
 * The frontend used to hardcode `Canton::Admin` for every asset. That would
 * build valid AssetId payloads on TestNet by coincidence but break on any
 * network where the real admin party differs. This context fetches the
 * per-asset admin from `/api/market/instruments` at startup and exposes a
 * helper `adminFor(symbol)` that components use instead of a hardcoded
 * string.
 *
 * While the fetch is in flight we fall back to a synthetic placeholder that
 * is clearly invalid (`Loading::Admin`) so the backend will reject
 * transactions that slip through before hydration — failing loudly is
 * safer than silently submitting to the wrong party.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { config } from '../config';

export interface Instrument {
  symbol: string;
  admin: string;
}

interface InstrumentsContextValue {
  instruments: Instrument[];
  isLoaded: boolean;
  adminFor: (symbol: string) => string;
}

const PLACEHOLDER_ADMIN = 'Loading::Admin';

const InstrumentsContext = createContext<InstrumentsContextValue>({
  instruments: [],
  isLoaded: false,
  adminFor: () => PLACEHOLDER_ADMIN,
});

export function InstrumentsProvider({ children }: { children: ReactNode }) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${config.backendUrl}/api/market/instruments`, {
      signal: AbortSignal.timeout(8000),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((body: { data?: { instruments?: Instrument[] } }) => {
        if (cancelled) return;
        const list = body?.data?.instruments ?? [];
        setInstruments(list);
        setIsLoaded(true);
      })
      .catch(() => {
        // Keep placeholder — `adminFor` will return invalid admin string so
        // ledger submissions fail loudly rather than silently wrong-submit.
        if (!cancelled) setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const adminFor = (symbol: string): string => {
    const hit = instruments.find((i) => i.symbol === symbol);
    return hit?.admin ?? PLACEHOLDER_ADMIN;
  };

  return (
    <InstrumentsContext.Provider value={{ instruments, isLoaded, adminFor }}>
      {children}
    </InstrumentsContext.Provider>
  );
}

export function useInstruments() {
  return useContext(InstrumentsContext);
}

/**
 * Escape hatch for call sites that currently hardcode `Canton::Admin`.
 * Preferable long-term: migrate those call sites to `useInstruments()`.
 */
export function buildAssetId(symbol: string, adminLookup: (s: string) => string) {
  return { symbol, admin: adminLookup(symbol) };
}
