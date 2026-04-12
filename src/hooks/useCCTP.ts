/**
 * CCTP operations hook — orchestrates deposit flow across EVM + Canton.
 */

import { useState, useCallback } from 'react';
import { config } from '@/config';
import {
  type CCTPChain,
  CCTP_CHAINS,
  approveUsdc,
  depositForBurn,
  getUsdcAllowance,
  getUsdcBalance,
  getEvmAddress,
  parseUsdc,
  hasInjectedWallet,
} from '@/lib/cctp';
import { getAuthToken } from './useApi';

export type DepositStatus =
  | 'idle'
  | 'connecting'
  | 'checking_allowance'
  | 'approving'
  | 'burning'
  | 'awaiting_attestation'
  | 'attested'
  | 'minting'
  | 'completed'
  | 'failed';

export interface DepositState {
  id?: string;
  status: DepositStatus;
  burnTxHash?: string;
  error?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${config.backendUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function useCCTP() {
  const [state, setState] = useState<DepositState>({ status: 'idle' });

  const deposit = useCallback(
    async (args: { chain: CCTPChain; amount: string }) => {
      if (!hasInjectedWallet()) {
        setState({ status: 'failed', error: 'No Ethereum wallet detected. Install MetaMask.' });
        return;
      }

      try {
        // 1. Connect wallet
        setState({ status: 'connecting' });
        const evmAddress = await getEvmAddress();
        if (!evmAddress) throw new Error('Wallet connection rejected');

        // 2. Initiate deposit on backend (gets mintRecipient bytes32)
        const amountWei = parseUsdc(args.amount);
        const initRes = await apiFetch<{
          success: boolean;
          deposit: { id: string };
          transaction: {
            tokenMessenger: string;
            usdc: string;
            destinationDomain: number;
            mintRecipient: `0x${string}`;
          };
        }>('/api/cctp/deposit', {
          method: 'POST',
          body: JSON.stringify({
            evmAddress,
            sourceChain: args.chain,
            amount: amountWei.toString(),
          }),
        });

        const { deposit: dep, transaction: tx } = initRes;
        setState({ id: dep.id, status: 'checking_allowance' });

        // 3. Check allowance, approve if needed
        const allowance = await getUsdcAllowance(args.chain, evmAddress);
        if (allowance < amountWei) {
          setState({ id: dep.id, status: 'approving' });
          const approveHash = await approveUsdc(args.chain, amountWei);
          // Wait for approval (best-effort; the burn tx will fail if allowance insufficient)
          await waitForTx(args.chain, approveHash);
        }

        // 4. Burn USDC
        setState({ id: dep.id, status: 'burning' });
        const burnHash = await depositForBurn({
          chain: args.chain,
          amount: amountWei,
          mintRecipient: tx.mintRecipient,
        });

        // 5. Report burn to backend
        await apiFetch(`/api/cctp/deposit/${dep.id}/burn`, {
          method: 'POST',
          body: JSON.stringify({ burnTxHash: burnHash }),
        });

        setState({ id: dep.id, status: 'awaiting_attestation', burnTxHash: burnHash });

        // 6. Poll backend for attestation + mint completion
        await pollDepositStatus(dep.id, (status) => {
          setState((s) => ({ ...s, status: status as DepositStatus }));
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState((s) => ({ ...s, status: 'failed', error: msg }));
      }
    },
    [],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, deposit, reset };
}

async function pollDepositStatus(
  id: string,
  onStatusChange: (status: string) => void,
  maxAttempts = 60, // 60 attempts × 30s = 30 min max
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 30_000));
    try {
      const res = await apiFetch<{
        success: boolean;
        deposit: { status: string };
      }>(`/api/cctp/deposit/${id}`);
      onStatusChange(res.deposit.status);
      if (res.deposit.status === 'completed' || res.deposit.status === 'failed') {
        return;
      }
    } catch {
      // Retry on transient errors
    }
  }
}

async function waitForTx(chain: CCTPChain, hash: `0x${string}`): Promise<void> {
  const { createPublicClient, http } = await import('viem');
  const client = createPublicClient({ chain: CCTP_CHAINS[chain].chain, transport: http() });
  await client.waitForTransactionReceipt({ hash, confirmations: 1 });
}

export async function getBalance(chain: CCTPChain): Promise<string> {
  if (!hasInjectedWallet()) return '0';
  const addr = await getEvmAddress();
  if (!addr) return '0';
  const bal = await getUsdcBalance(chain, addr);
  const whole = bal / 1_000_000n;
  const frac = bal % 1_000_000n;
  return frac === 0n ? whole.toString() : `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}
