/**
 * xReserve Modal — deposit USDC from Ethereum to Canton / withdraw back.
 *
 * Canton is NOT a CCTP domain. This uses Circle's xReserve lock-and-mint
 * bridge operated by Digital Asset. Only Ethereum L1 is supported today.
 */

import { useState, useEffect } from 'react';
import {
  X, ArrowDownToLine, ArrowUpFromLine, Wallet, CheckCircle2,
  AlertCircle, Loader2, ArrowRight, ExternalLink, Clock,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  useXReserveDeposit,
  useXReserveWithdraw,
  useXReserveOnboarding,
  getEvmUsdcBalance,
  type DepositStatus,
} from '@/hooks/useXReserve';
import {
  XRESERVE_CHAINS,
  hasInjectedWallet,
  type XReserveSource,
} from '@/lib/xreserve';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cantonParty: string;
  /** Initial tab — 'deposit' or 'withdraw' */
  initialTab?: 'deposit' | 'withdraw';
}

const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  idle: '',
  onboarding: 'Onboarding with xReserve operator...',
  connecting: 'Connecting Ethereum wallet...',
  checking_allowance: 'Checking USDC allowance...',
  approving: 'Approving USDC (step 1 of 2)...',
  burning: 'Submitting deposit on Ethereum (step 2 of 2)...',
  awaiting_finality: 'Waiting for Ethereum finality (~13 min)...',
  awaiting_attestation: 'Waiting for Canton attestation...',
  attested: 'Ready to claim! Click below to mint USDCx.',
  claiming: 'Minting USDCx on Canton...',
  completed: 'Deposit complete — USDCx in your Canton wallet',
  failed: 'Deposit failed',
};

export function XReserveModal({ isOpen, onClose, cantonParty, initialTab = 'deposit' }: Props) {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>(initialTab);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Close on Escape key — pairs with the focus trap to give keyboard-only
  // users a way out without grabbing the mouse.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="xreserve-modal-title"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2
              id="xreserve-modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              USDC Bridge
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Circle xReserve — between Ethereum and Canton
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close USDC bridge modal"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTab('deposit')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              tab === 'deposit'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </button>
          <button
            onClick={() => setTab('withdraw')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              tab === 'withdraw'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </button>
        </div>

        {/* Body */}
        {tab === 'deposit' ? (
          <DepositPanel cantonParty={cantonParty} onClose={onClose} />
        ) : (
          <WithdrawPanel onClose={onClose} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deposit Panel
// ---------------------------------------------------------------------------

function DepositPanel({
  cantonParty,
  onClose,
}: {
  cantonParty: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [sourceChain, setSourceChain] = useState<XReserveSource | null>(null);
  const { state, deposit, claim, reset } = useXReserveDeposit();
  const onboarding = useXReserveOnboarding(cantonParty);

  // Fetch chain info on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'}/api/xreserve/info`)
      .then((r) => r.json())
      .then((data: { sourceChain?: { id: XReserveSource } }) => {
        setSourceChain(data?.sourceChain?.id ?? 'sepolia');
      })
      .catch(() => setSourceChain('sepolia'));
  }, []);

  // Fetch EVM USDC balance
  useEffect(() => {
    if (!sourceChain || !hasInjectedWallet()) return;
    let cancelled = false;
    getEvmUsdcBalance(sourceChain)
      .then((b) => { if (!cancelled) setBalance(b); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sourceChain, state.status]);

  const isBusy =
    state.status !== 'idle' &&
    state.status !== 'completed' &&
    state.status !== 'failed' &&
    state.status !== 'attested';
  const canSubmit = amount && parseFloat(amount) > 0 && !isBusy && onboarding.onboarded === true;

  if (!hasInjectedWallet()) {
    return (
      <div className="p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            No Ethereum wallet detected
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Install MetaMask or another injected wallet to deposit USDC.
          </p>
        </div>
      </div>
    );
  }

  // Onboarding state
  if (onboarding.onboarded === false) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Onboarding required (one-time)
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Before depositing, you need to create a BridgeUserAgreement with the
              xReserve operator. This is a one-time setup per Canton account.
              {onboarding.pending && ' Waiting for operator to accept...'}
            </p>
          </div>
        </div>

        {onboarding.error && (
          <p className="text-xs text-red-600 dark:text-red-400">{onboarding.error}</p>
        )}

        <button
          onClick={onboarding.requestOnboarding}
          disabled={onboarding.pending}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
        >
          {onboarding.pending ? 'Waiting for operator...' : 'Start onboarding'}
        </button>

        <button
          onClick={onboarding.checkStatus}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Refresh status
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Amount */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Amount (USDC)
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Balance: {balance}
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
          {sourceChain ? XRESERVE_CHAINS[sourceChain].name : '...'} USDC
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
              : state.status === 'attested'
              ? 'bg-amber-50 dark:bg-amber-900/20'
              : 'bg-blue-50 dark:bg-blue-900/20'
          }`}
        >
          {state.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : state.status === 'failed' ? (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          ) : state.status === 'attested' ? (
            <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {DEPOSIT_STATUS_LABELS[state.status]}
            </p>
            {state.error && (
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {state.error}
              </p>
            )}
            {state.burnTxHash && sourceChain && (
              <a
                href={`${XRESERVE_CHAINS[sourceChain].chain.blockExplorers?.default.url}/tx/${state.burnTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
              >
                View burn tx <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p>- Ethereum L1 only — L2s not supported by xReserve yet</p>
        <p>- Canton traffic fees paid by Roil (not you)</p>
        <p>- Total time: ~13-15 min for Ethereum finality</p>
      </div>

      {/* Action button */}
      {state.status === 'attested' && state.id ? (
        <button
          onClick={() => claim(state.id!)}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Claim USDCx
        </button>
      ) : (
        <button
          onClick={() => {
            if (state.status === 'completed' || state.status === 'failed') {
              reset();
              if (state.status === 'completed') onClose();
            } else {
              deposit(amount);
            }
          }}
          disabled={!canSubmit && state.status !== 'completed' && state.status !== 'failed'}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {state.status === 'completed' ? 'Close' : state.status === 'failed' ? 'Try again' : isBusy ? (
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Withdraw Panel
// ---------------------------------------------------------------------------

function WithdrawPanel({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const { state, withdraw, reset } = useXReserveWithdraw();

  const isBusy = state.status === 'burning' || state.status === 'awaiting_release';
  const validDest = /^0x[a-fA-F0-9]{40}$/.test(destination);
  const canSubmit = amount && parseFloat(amount) > 0 && validDest && !isBusy;

  return (
    <div className="p-6 space-y-4">
      {/* Destination */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Ethereum address
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value.trim())}
          disabled={isBusy}
          placeholder="0x..."
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono text-sm"
        />
        {destination && !validDest && (
          <p className="text-xs text-red-600 mt-1">Invalid Ethereum address</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Amount (USDCx)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isBusy}
          placeholder="0.00"
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>

      {/* Flow */}
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
        <div className="text-blue-600 dark:text-blue-400 font-medium">Canton USDCx</div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <div className="text-slate-700 dark:text-slate-300 font-medium">Ethereum USDC</div>
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
          <div className="text-sm text-slate-900 dark:text-white">
            {state.status === 'burning' && 'Burning USDCx on Canton...'}
            {state.status === 'awaiting_release' && 'Waiting for operator to release USDC on Ethereum...'}
            {state.status === 'completed' && 'Withdrawal complete — USDC sent to your address'}
            {state.status === 'failed' && (state.error ?? 'Withdrawal failed')}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p>- Only Ethereum L1 destination supported today</p>
        <p>- xReserve fee will be deducted from the released USDC</p>
      </div>

      <button
        onClick={() => {
          if (state.status === 'completed') {
            reset();
            onClose();
          } else {
            withdraw({ destinationEvmAddress: destination, amount });
          }
        }}
        disabled={!canSubmit && state.status !== 'completed'}
        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {state.status === 'completed' ? 'Close' : isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </>
        )}
      </button>
    </div>
  );
}
