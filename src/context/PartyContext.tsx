import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { WalletManager } from '@/lib/wallet-core';

// ---------------------------------------------------------------------------
// Party context — holds the current Canton party identifier
// ---------------------------------------------------------------------------

interface PartyContextValue {
  party: string;
  setParty: (p: string) => void;
}

const PartyContext = createContext<PartyContextValue>({
  party: '',
  setParty: () => {},
});

export function PartyProvider({ children }: { children: ReactNode }) {
  const [party, setParty] = useState('');

  // On mount: check if a wallet exists and pre-populate the party ID.
  // The wallet is still locked (private key not in memory), but we can
  // show the party ID for display purposes (demo mode).
  useEffect(() => {
    if (WalletManager.hasWallet()) {
      const info = WalletManager.getWalletInfo();
      if (info?.partyId) {
        setParty(info.partyId);
      }
    }
  }, []);

  return (
    <PartyContext.Provider value={{ party, setParty }}>
      {children}
    </PartyContext.Provider>
  );
}

export function useParty(): PartyContextValue {
  return useContext(PartyContext);
}
