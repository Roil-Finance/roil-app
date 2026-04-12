/**
 * xReserve hook — deposit + withdraw USDC via Canton's xReserve bridge.
 */

import { useState, useCallback, useEffect } from 'react';
import { config } from '@/config';
import {
  type XReserveSource,
  approveUsdc,
  depositToRemote,
  getUsdcAllowance,
  getUsdcBalance,
  getEvmAddress,
  parseUsdc,
  hasInjectedWallet,
  waitForTx,
} from '@/lib/xreserve';
import { getAuthToken } from './useApi';

export type DepositStatus =
  | 'idle'
  | 'onboarding'
  | 'connecting'
  | 'checking_allowance'
  | 'approving'
  | 'burning'
  | 'awaiting_finality'
  | 'awaiting_attestation'
  | 'attested'
  | 'claiming'
  | 'completed'
  | 'failed';

export interface DepositState {
  id?: string;
  status: DepositStatus;
  burnTxHash?: string;
  attestationCid?: string;
  error?: string;
}

export interface WithdrawState {
  id?: string;
  status: 'idle' | 'burning' | 'awaiting_release' | 'completed' | 'failed';
  error?: string;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${config.backendUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Onboarding check — user must have BridgeUserAgreement before depositing
// ---------------------------------------------------------------------------

export function useXReserveOnboarding(cantonParty: string | null) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!cantonParty) return;
    try {
      const res = await api<{
        success: boolean;
        onboarded: boolean;
        pendingRequest: boolean;
      }>(`/api/xreserve/onboarding/${encodeURIComponent(cantonParty)}`);
      setOnboarded(res.onboarded);
      setPending(res.pendingRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [cantonParty]);

  const requestOnboarding = useCallback(async () => {
    try {
      setError(null);
      await api('/api/xreserve/onboard', { method: 'POST' });
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [checkStatus]);

  useEffect(() => {
    if (cantonParty) checkStatus();
  }, [cantonParty, checkStatus]);

  return { onboarded, pending, error, checkStatus, requestOnboarding };
}

// ---------------------------------------------------------------------------
// Deposit
// ---------------------------------------------------------------------------

export function useXReserveDeposit() {
  const [state, setState] = useState<DepositState>({ status: 'idle' });

  const deposit = useCallback(async (amount: string) => {
    if (!hasInjectedWallet()) {
      setState({ status: 'failed', error: 'Install MetaMask to deposit USDC' });
      return;
    }

    try {
      setState({ status: 'connecting' });
      const evmAddress = await getEvmAddress();
      if (!evmAddress) throw new Error('Wallet connection rejected');

      // Fetch chain config from backend (source chain depends on Canton network)
      const info = await api<{
        success: boolean;
        sourceChain: { id: XReserveSource; xReserveContract: string };
      }>('/api/xreserve/info');
      const sourceChain = info.sourceChain.id;

      // Create deposit record on backend
      const amountWei = parseUsdc(amount);
      const init = await api<{
        success: boolean;
        deposit: { id: string };
      }>('/api/xreserve/deposits', {
        method: 'POST',
        body: JSON.stringify({
          evmAddress,
          amount: amountWei.toString(),
        }),
      });
      const depositId = init.deposit.id;

      // Check + approve if needed
      setState({ id: depositId, status: 'checking_allowance' });
      const allowance = await getUsdcAllowance(sourceChain, evmAddress);
      if (allowance < amountWei) {
        setState({ id: depositId, status: 'approving' });
        const approveHash = await approveUsdc(sourceChain, amountWei);
        await waitForTx(sourceChain, approveHash);
      }

      // Burn: call xReserve.depositToRemote
      setState({ id: depositId, status: 'burning' });
      // We need the Canton party to encode recipient — get it from auth context
      // In this flow, the backend stored it with the deposit record and the
      // on-chain call uses `encodeRecipientBytes32` + `encodeHookData` which
      // take the party as input. We recover the party from the user's JWT
      // (already attached in api() calls). For the actual burn, we need
      // to pass it — the info endpoint returns everything else we need.
      // Simpler: fetch deposit record which includes cantonParty
      const depDetail = await api<{
        success: boolean;
        deposit: { cantonParty: string };
      }>(`/api/xreserve/deposits/${depositId}`);

      const burnHash = await depositToRemote({
        chain: sourceChain,
        amount: amountWei,
        cantonParty: depDetail.deposit.cantonParty,
      });

      // Report burn to backend
      await api(`/api/xreserve/deposits/${depositId}/burn`, {
        method: 'POST',
        body: JSON.stringify({ burnTxHash: burnHash }),
      });

      setState({ id: depositId, status: 'awaiting_finality', burnTxHash: burnHash });

      // Poll for attestation (backend watches Canton ledger)
      await pollDeposit(depositId, (newStatus, extra) => {
        setState((s) => ({ ...s, status: newStatus as DepositStatus, ...extra }));
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, status: 'failed', error: msg }));
    }
  }, []);

  const claim = useCallback(async (depositId: string) => {
    try {
      setState((s) => ({ ...s, status: 'claiming' }));
      await api(`/api/xreserve/deposits/${depositId}/claim`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setState((s) => ({ ...s, status: 'completed' }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, status: 'failed', error: msg }));
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, deposit, claim, reset };
}

async function pollDeposit(
  id: string,
  onChange: (status: string, extra?: Partial<DepositState>) => void,
  maxMinutes = 30,
): Promise<void> {
  const maxAttempts = maxMinutes * 2; // 30s intervals
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 30_000));
    try {
      const res = await api<{
        success: boolean;
        deposit: {
          status: string;
          attestationContractId?: string;
        };
      }>(`/api/xreserve/deposits/${id}`);
      onChange(res.deposit.status, {
        attestationCid: res.deposit.attestationContractId,
      });
      if (
        res.deposit.status === 'completed' ||
        res.deposit.status === 'failed' ||
        res.deposit.status === 'attested'
      ) {
        return; // Terminal or needs user action (attested → needs manual claim)
      }
    } catch {
      // Retry on transient errors
    }
  }
}

// ---------------------------------------------------------------------------
// Withdraw
// ---------------------------------------------------------------------------

export function useXReserveWithdraw() {
  const [state, setState] = useState<WithdrawState>({ status: 'idle' });

  const withdraw = useCallback(
    async (args: { destinationEvmAddress: string; amount: string }) => {
      try {
        setState({ status: 'burning' });
        const amountWei = parseUsdc(args.amount);
        const res = await api<{
          success: boolean;
          withdrawal: { id: string };
        }>('/api/xreserve/withdrawals', {
          method: 'POST',
          body: JSON.stringify({
            destinationEvmAddress: args.destinationEvmAddress,
            amount: amountWei.toString(),
          }),
        });
        setState({ id: res.withdrawal.id, status: 'awaiting_release' });

        // Operator releases USDC on Ethereum within minutes. Poll for completion.
        await pollWithdraw(res.withdrawal.id, (s) =>
          setState((prev) => ({ ...prev, status: s as WithdrawState['status'] })),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState((s) => ({ ...s, status: 'failed', error: msg }));
      }
    },
    [],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, withdraw, reset };
}

async function pollWithdraw(
  id: string,
  onChange: (status: string) => void,
  maxMinutes = 15,
): Promise<void> {
  const maxAttempts = maxMinutes * 2;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 30_000));
    try {
      const res = await api<{
        success: boolean;
        withdrawal: { status: string };
      }>(`/api/xreserve/withdrawals/${id}`);
      onChange(res.withdrawal.status);
      if (res.withdrawal.status === 'completed' || res.withdrawal.status === 'failed') {
        return;
      }
    } catch {
      // Retry
    }
  }
}

// ---------------------------------------------------------------------------
// Helper for UI: show current EVM USDC balance
// ---------------------------------------------------------------------------

export async function getEvmUsdcBalance(chain: XReserveSource): Promise<string> {
  if (!hasInjectedWallet()) return '0';
  const addr = await getEvmAddress();
  if (!addr) return '0';
  const bal = await getUsdcBalance(chain, addr);
  const whole = bal / 1_000_000n;
  const frac = bal % 1_000_000n;
  return frac === 0n
    ? whole.toString()
    : `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}
