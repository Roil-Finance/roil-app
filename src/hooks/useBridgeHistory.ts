import { useEffect, useState, useCallback } from 'react';
import { config } from '@/config';
import { getAuthToken } from './useApi';

/**
 * Bridge history hook — fetches the user's past xReserve deposits and
 * withdrawals from the backend and merges them into a single timestamp-sorted
 * list for the /bridge page transaction table.
 *
 * The shape mirrors `xreserve-client.ts` (DepositRecord / WithdrawRecord) on
 * the backend but stays loose here so we can evolve the backend independently.
 */

export type BridgeDirection = 'deposit' | 'withdraw';

export interface BridgeHistoryEntry {
  id: string;
  direction: BridgeDirection;
  amount: string;        // USDC wei, decimal string
  status: string;        // backend status string
  evmAddress: string;
  createdAt: string;
  updatedAt: string;
  burnTxHash?: string;
  releaseTxHash?: string;
  error?: string;
}

interface DepositRecord {
  id: string;
  cantonParty: string;
  evmAddress: string;
  sourceChain: string;
  amount: string;
  status: string;
  burnTxHash?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

interface WithdrawRecord {
  id: string;
  cantonParty: string;
  destinationEvmAddress: string;
  destinationChain: string;
  amount: string;
  status: string;
  releaseTxHash?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${config.backendUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status}: ${await res.text().catch(() => '')}`);
  }
  return res.json() as Promise<T>;
}

export function useBridgeHistory(enabled: boolean = true) {
  const [entries, setEntries] = useState<BridgeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const [depRes, wdrRes] = await Promise.all([
        fetchJson<{ success: boolean; deposits: DepositRecord[] }>(
          '/api/xreserve/deposits',
        ),
        fetchJson<{ success: boolean; withdrawals: WithdrawRecord[] }>(
          '/api/xreserve/withdrawals',
        ),
      ]);

      const deposits: BridgeHistoryEntry[] = (depRes.deposits ?? []).map((d) => ({
        id: d.id,
        direction: 'deposit',
        amount: d.amount,
        status: d.status,
        evmAddress: d.evmAddress,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        burnTxHash: d.burnTxHash,
        error: d.error,
      }));

      const withdrawals: BridgeHistoryEntry[] = (wdrRes.withdrawals ?? []).map(
        (w) => ({
          id: w.id,
          direction: 'withdraw',
          amount: w.amount,
          status: w.status,
          evmAddress: w.destinationEvmAddress,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          releaseTxHash: w.releaseTxHash,
          error: w.error,
        }),
      );

      const merged = [...deposits, ...withdrawals].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
      setEntries(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, isLoading, error, refresh };
}
