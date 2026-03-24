import { useState, useEffect, useCallback, useRef } from 'react';
import { CantonWallet, WalletState, TokenBalance } from '@/lib/canton-wallet';
import { WalletManager, type SignFunction, type RoilWallet } from '@/lib/wallet-core';
import { setAuthToken } from './useApi';

// ---------------------------------------------------------------------------
// Singleton CantonWallet instance — used for ledger interactions
// (balance fetching, transaction submission) after wallet unlock
// ---------------------------------------------------------------------------

const cantonWallet = new CantonWallet();

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export interface UseWalletReturn extends WalletState {
  /**
   * Connect / unlock the wallet.
   *
   * Pass a password to unlock via WalletManager (primary flow).
   * Pass a party hint string (containing '::') for legacy dev mode.
   */
  connect: (passwordOrPartyHint?: string) => Promise<WalletState>;
  /** Disconnect and lock the wallet */
  disconnect: () => Promise<void>;
  /** Re-fetch balances from the ledger */
  refreshBalances: () => Promise<TokenBalance[]>;
  /** True when the Canton browser extension is detected */
  isExtensionAvailable: boolean;
  /** True while a connect/disconnect operation is in progress */
  isConnecting: boolean;
  /** Error message from the last failed operation, or null */
  error: string | null;
  /** The unlocked wallet info (null if locked) */
  walletInfo: RoilWallet | null;
}

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>(cantonWallet.getState());
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<RoilWallet | null>(null);
  const signRef = useRef<SignFunction | null>(null);

  // Subscribe to CantonWallet state changes (for balance updates etc.)
  useEffect(() => {
    const unsub = cantonWallet.subscribe(setState);
    return () => {
      try { unsub(); } catch (e) { console.warn('[useWallet] unsub error:', e); }
    };
  }, []);

  /**
   * Connect the wallet.
   *
   * If `passwordOrPartyHint` looks like a party ID (contains '::'), it falls
   * back to the legacy CantonWallet dev-mode flow.
   *
   * Otherwise it's treated as a password for WalletManager.unlockWallet().
   */
  const connect = useCallback(async (passwordOrPartyHint?: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Determine if this is a legacy party-hint connection
      const isPartyHint = passwordOrPartyHint?.includes('::');

      if (!isPartyHint && WalletManager.hasWallet() && passwordOrPartyHint) {
        // --- Primary flow: WalletManager unlock ---
        const { wallet, sign } = await WalletManager.unlockWallet(passwordOrPartyHint);
        signRef.current = sign;
        setWalletInfo(wallet);

        // Create a JWT for Canton JSON API auth
        const jwt = await WalletManager.createJWT(sign, wallet.partyId);
        setAuthToken(jwt);

        // Build the wallet state
        const walletState: WalletState = {
          connected: true,
          party: wallet.partyId,
          displayName: wallet.displayName,
          balances: [],
        };
        setState(walletState);

        return walletState;
      }

      // --- Fallback: legacy CantonWallet connection (dev mode / extension) ---
      const result = await cantonWallet.connect(passwordOrPartyHint);
      const token = cantonWallet.getCurrentToken();
      setAuthToken(token);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect: clear auth token, reset state, lock wallet.
   */
  const disconnect = useCallback(async () => {
    setError(null);
    setAuthToken(null);
    signRef.current = null;
    setWalletInfo(null);
    await cantonWallet.disconnect();
    setState({
      connected: false,
      party: null,
      displayName: null,
      balances: [],
    });
  }, []);

  /**
   * Refresh balances from the ledger.
   */
  const refreshBalances = useCallback(async () => {
    setError(null);
    try {
      return await cantonWallet.refreshBalances();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh balances';
      setError(msg);
      throw err;
    }
  }, []);

  const isExtensionAvailable =
    typeof window !== 'undefined' && !!window.canton;

  return {
    ...state,
    connect,
    disconnect,
    refreshBalances,
    isExtensionAvailable,
    isConnecting,
    error,
    walletInfo,
  };
}
