/**
 * CCTP Deposit Modal — bring USDC from EVM chains to Canton.
 *
 * Flow:
 * 1. User selects source chain (Ethereum, Base, Arbitrum, etc.)
 * 2. User enters amount
 * 3. Connect wallet → approve (if needed) → burn
 * 4. Wait for Circle attestation (~20 min for Ethereum, ~8 min for L2s)
 * 5. Backend auto-mints USDCx on Canton to user's party
 */

import { useState, useEffect } from 'react';
import { X, ArrowRight, Wallet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useCCTP, getBalance, type DepositStatus } from '@/hooks/useCCTP';
import { CCTP_CHAINS, type CCTPChain, hasInjectedWallet } from '@/lib/cctp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CHAIN_OPTIONS: { id: CCTPChain; label: string; avgTime: string }[] = [
  { id: 'base', label: 'Base', avgTime: '~8 min' },
  { id: 'arbitrum', label: 'Arbitrum', avgTime: '~13 min' },
  { id: 'optimism', label: 'Optimism', avgTime: '~13 min' },
  { id: 'polygon', label: 'Polygon', avgTime: '~22 min' },
  { id: 'avalanche', label: 'Avalanche', avgTime: '~15 min' },
  { id: 'ethereum', label: 'Ethereum', avgTime: '~20 min' },
];

const STATUS_LABELS: Record<DepositStatus, string> = {
  idle: '',
  connecting: 'Connecting wallet...',
  checking_allowance: 'Checking USDC allowance...',
  approving: 'Approving USDC (1/2)...',
  burning: 'Burning USDC on source chain...',
  awaiting_attestation: 'Waiting for Circle attestation...',
  attested: 'Attestation received, minting on Canton...',
  minting: 'Minting USDCx on Canton...',
  completed: 'Deposit complete!',
  failed: 'Deposit failed',
};

export function CCTPDepositModal({ isOpen, onClose }: Props) {
  const [chain, setChain] = useState<CCTPChain>('base');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const { state, deposit, reset } = useCCTP();

  // Fetch balance when chain changes
  useEffect(() => {
    if (!isOpen || !hasInjectedWallet()) return;
    let cancelled = false;
    getBalance(chain)
      .then((b) => { if (!cancelled) setBalance(b); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [chain, isOpen, state.status]);

  if (!isOpen) return null;

  const isBusy = state.status !== 'idle' && state.status !== 'completed' && state.status !== 'failed';
  const canSubmit = amount && parseFloat(amount) > 0 && !isBusy;

  const handleDeposit = () => {
    reset();
    deposit({ chain, amount });
  };

  const handleClose = () => {
    if (isBusy) return; // Prevent close during active operation
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Deposit USDC
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bridge USDC from EVM chains to Canton via Circle CCTP
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isBusy}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!hasInjectedWallet() ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  No Ethereum wallet detected
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Install MetaMask or another injected wallet to deposit USDC.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chain selector */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  From chain
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CHAIN_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setChain(opt.id)}
                      disabled={isBusy}
                      className={`p-3 rounded-lg border transition text-sm ${
                        chain === opt.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      } disabled:opacity-50`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.avgTime}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Amount (USDC)
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Balance: {balance} USDC
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isBusy}
                    placeholder="0.00"
                    className="w-full px-4 py-3 pr-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => setAmount(balance)}
                    disabled={isBusy || balance === '0'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Flow preview */}
              <div className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
                <div className="text-slate-700 dark:text-slate-300 font-medium">
                  {CCTP_CHAINS[chain].name} USDC
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  Canton USDCx
                </div>
              </div>

              {/* Status */}
              {state.status !== 'idle' && (
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    state.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : state.status === 'failed'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  {state.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : state.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {STATUS_LABELS[state.status]}
                    </p>
                    {state.error && (
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {state.error}
                      </p>
                    )}
                    {state.burnTxHash && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                        Burn tx: {state.burnTxHash}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>- Traffic fees on Canton are paid by Roil (not you)</p>
                <p>- USDC is natively minted, not wrapped</p>
                <p>- Attestation time varies by chain finality</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {hasInjectedWallet() && (
          <div className="p-6 pt-0">
            <button
              onClick={state.status === 'completed' ? handleClose : handleDeposit}
              disabled={!canSubmit && state.status !== 'completed'}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {state.status === 'completed' ? (
                'Close'
              ) : isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Deposit
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
