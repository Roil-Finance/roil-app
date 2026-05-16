import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  AlertCircle,
  Wallet as WalletIcon,
} from 'lucide-react';
import {
  useXReserveOnboarding,
  useXReserveDeposit,
  useXReserveWithdraw,
} from '@/hooks/useXReserve';
import { useParty } from '@/context/PartyContext';

/**
 * BridgeForm — direction toggle + amount + (withdraw only) destination
 * Ethereum address. Wires straight to the existing useXReserve* hooks so
 * the modal flow and the page flow share state machines.
 *
 * Direction state lifts to the parent (Bridge.tsx) so the stepper card
 * can react to it.
 */

interface Props {
  direction: 'deposit' | 'withdraw';
  onDirectionChange: (d: 'deposit' | 'withdraw') => void;
  onTransferStart: () => void;
}

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export default function BridgeForm({
  direction,
  onDirectionChange,
  onTransferStart,
}: Props) {
  const { party } = useParty();
  const {
    onboarded,
    pending: onboardingPending,
    requestOnboarding,
    checkStatus,
  } = useXReserveOnboarding(party ?? null);
  const { state: depositState, deposit, claim } = useXReserveDeposit();
  const { state: withdrawState, withdraw } = useXReserveWithdraw();

  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const inFlight =
    (direction === 'deposit' &&
      depositState.status !== 'idle' &&
      depositState.status !== 'failed' &&
      depositState.status !== 'completed') ||
    (direction === 'withdraw' &&
      withdrawState.status !== 'idle' &&
      withdrawState.status !== 'failed' &&
      withdrawState.status !== 'completed');

  const canClaim = direction === 'deposit' && depositState.status === 'attested';

  const handleSubmit = async () => {
    setLocalError(null);
    if (!amount || Number(amount) <= 0) {
      setLocalError('Enter a positive amount.');
      return;
    }
    if (direction === 'withdraw') {
      if (!ETH_ADDRESS_RE.test(destination)) {
        setLocalError('Enter a valid Ethereum address (0x…).');
        return;
      }
    }

    onTransferStart();

    if (direction === 'deposit') {
      await deposit(amount);
    } else {
      await withdraw({ destinationEvmAddress: destination, amount });
    }
  };

  // -- Onboarding gate ------------------------------------------------------
  if (onboarded === false) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
            <WalletIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">
              Onboarding required
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-1">
              The xReserve operator needs to register a BridgeUserAgreement for
              your Canton party before the first transfer. This is a one-time
              setup.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={requestOnboarding}
            disabled={onboardingPending}
            className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {onboardingPending ? 'Onboarding pending…' : 'Start onboarding'}
          </button>
          <button
            type="button"
            onClick={checkStatus}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[#D6D9E3] dark:border-slate-700 text-[#111827] dark:text-slate-100 hover:bg-[#F3F4F9] dark:hover:bg-slate-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-2xl p-6">
      {/* Direction toggle */}
      <div
        role="tablist"
        aria-label="Transfer direction"
        className="grid grid-cols-2 gap-2 p-1 bg-[#F3F4F9] dark:bg-slate-900 rounded-xl mb-6"
      >
        {(['deposit', 'withdraw'] as const).map((d) => {
          const active = direction === d;
          const Icon = d === 'deposit' ? ArrowDownToLine : ArrowUpFromLine;
          return (
            <button
              key={d}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => {
                onDirectionChange(d);
                setLocalError(null);
              }}
              disabled={inFlight}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 shadow-sm'
                  : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Icon className="w-4 h-4" />
              {d === 'deposit' ? 'Ethereum → Canton' : 'Canton → Ethereum'}
            </button>
          );
        })}
      </div>

      {/* Amount input */}
      <label className="block">
        <span className="text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1.5 block">
          Amount (USDC)
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.000001"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={inFlight}
          aria-label="Transfer amount in USDC"
          className="w-full px-4 py-3 rounded-xl border border-[#D6D9E3] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-100 text-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] disabled:opacity-50"
        />
      </label>

      {/* Destination address (withdraw only) */}
      {direction === 'withdraw' && (
        <label className="block mt-4">
          <span className="text-xs font-medium text-[#6B7280] dark:text-slate-400 mb-1.5 block">
            Destination Ethereum address
          </span>
          <input
            type="text"
            placeholder="0x…"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={inFlight}
            aria-label="Destination Ethereum address"
            className="w-full px-4 py-3 rounded-xl border border-[#D6D9E3] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] disabled:opacity-50"
          />
        </label>
      )}

      {/* Inline meta */}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-[#F8F9FB] dark:bg-slate-900/60 px-3 py-2">
          <dt className="text-[#9CA3AF]">Estimated time</dt>
          <dd className="text-[#111827] dark:text-slate-100 font-medium mt-0.5">
            {direction === 'deposit' ? '~13–15 min' : '~2–5 min'}
          </dd>
        </div>
        <div className="rounded-lg bg-[#F8F9FB] dark:bg-slate-900/60 px-3 py-2">
          <dt className="text-[#9CA3AF]">Bridge</dt>
          <dd className="text-[#111827] dark:text-slate-100 font-medium mt-0.5">
            Circle xReserve
          </dd>
        </div>
      </dl>

      {/* Errors */}
      {(localError || depositState.error || withdrawState.error) && (
        <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-[#E11D48] dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {localError ?? depositState.error ?? withdrawState.error}
          </span>
        </div>
      )}

      {/* Action */}
      <div className="mt-5 flex gap-2">
        {canClaim ? (
          <button
            type="button"
            onClick={() => depositState.id && claim(depositState.id)}
            className="flex-1 px-4 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 transition-opacity shadow-md"
          >
            Claim USDCx on Canton
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={inFlight || onboarded === null}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inFlight && <Loader2 className="w-4 h-4 animate-spin" />}
            {inFlight
              ? 'In progress…'
              : direction === 'deposit'
              ? 'Approve & Bridge'
              : 'Bridge to Ethereum'}
          </button>
        )}
      </div>
    </div>
  );
}
