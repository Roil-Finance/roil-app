import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useParty } from '@/context/PartyContext';
import { useQuery, useMutation } from '@/hooks/useApi';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useToast } from '@/components/Toast';
import { TOKEN_LOGOS } from '@/config';
import SwapConfirmModal from '@/components/SwapConfirmModal';

// Slippage tolerance stays as a UI literal because it shapes the user's
// quote acceptance behaviour; the backend's matching value is informational
// only (the simulator already returns post-slippage estimates).
const SWAP_SLIPPAGE_TOLERANCE_PCT = 2.0;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SwapLimits {
  dailyLimit: number;
  usedToday: number;
}

interface SwapHistoryItem {
  id: string;
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface WhitelistStatus {
  isWhitelisted: boolean;
  joinedAt?: string;
  dailyLimit?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SWAP_TOKENS = ['CC', 'USDCx', 'CBTC', 'ETHx'] as const;

/** Mock oracle prices — 1 unit of token in USD */
const ORACLE_PRICES: Record<string, number> = {
  CC: 1.0,
  USDCx: 1.0,
  CBTC: 42000,
  ETHx: 2048,
};

const SPREAD = 0.005; // 0.5%

function getPrice(from: string, to: string): number {
  const fromUsd = ORACLE_PRICES[from] ?? 1;
  const toUsd = ORACLE_PRICES[to] ?? 1;
  return fromUsd / toUsd;
}

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
  if (n < 0.01) return n.toFixed(6);
  return n.toFixed(decimals);
}

function formatUsd(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Mock data (used when backend is unreachable)
// ---------------------------------------------------------------------------

const MOCK_LIMITS: SwapLimits = { dailyLimit: 50, usedToday: 25 };

const MOCK_HISTORY: SwapHistoryItem[] = [
  { id: '1', from: 'USDCx', to: 'CBTC', fromAmount: 10, toAmount: 0.000238, timestamp: '2026-03-26T10:30:00Z', status: 'completed' },
  { id: '2', from: 'ETHx', to: 'USDCx', fromAmount: 0.5, toAmount: 1024, timestamp: '2026-03-25T14:22:00Z', status: 'completed' },
  { id: '3', from: 'CC', to: 'ETHx', fromAmount: 100, toAmount: 0.0488, timestamp: '2026-03-25T09:15:00Z', status: 'completed' },
];

const MOCK_WHITELIST: WhitelistStatus = { isWhitelisted: true, joinedAt: '2026-03-20', dailyLimit: 50 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Swap() {
  const { party } = useParty();
  const { addToast } = useToast();
  // Backend-driven platform fee rate (falls back to the same default the
  // backend uses) so a fee update on the server doesn't require a frontend
  // redeploy and the SwapConfirmModal disclosure stays accurate.
  const { platformFeeRate } = usePlatformConfig();

  // Whitelist status
  const { data: whitelistStatus } = useQuery<WhitelistStatus>(
    party ? `/api/whitelist/status?party=${encodeURIComponent(party)}` : null,
  );
  const wlStatus = whitelistStatus ?? MOCK_WHITELIST;

  // Swap limits
  const { data: limitsData } = useQuery<SwapLimits>(
    party ? `/api/swap/limits?party=${encodeURIComponent(party)}` : null,
  );
  const limits = limitsData ?? MOCK_LIMITS;

  // Swap history
  const { data: historyData } = useQuery<SwapHistoryItem[]>(
    party ? `/api/swap/history?party=${encodeURIComponent(party)}` : null,
  );
  const history = historyData ?? MOCK_HISTORY;

  // Execute mutation
  const { mutate: executeSwap, isLoading: isExecuting, error: executeError } = useMutation<
    { party: string; from: string; to: string; fromAmount: number },
    { txId: string }
  >('/api/swap/execute');

  // Form state
  const [fromToken, setFromToken] = useState<string>('USDCx');
  const [toToken, setToToken] = useState<string>('CBTC');
  const [amount, setAmount] = useState<string>('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Wallet lock state
  const [isWalletLocked, setIsWalletLocked] = useState(true);
  useEffect(() => {
    // Wallet is "unlocked" if party is set (demo simplification)
    setIsWalletLocked(!party);
  }, [party]);

  // Computed values
  const numAmount = parseFloat(amount) || 0;
  const rawPrice = getPrice(fromToken, toToken);
  const effectivePrice = rawPrice * (1 - SPREAD);
  const estimatedOutput = numAmount * effectivePrice;
  const feeUsd = numAmount * (ORACLE_PRICES[fromToken] ?? 1) * SPREAD;
  const feeInFrom = numAmount * SPREAD;
  const amountUsd = numAmount * (ORACLE_PRICES[fromToken] ?? 1);
  const limitPct = limits.dailyLimit > 0 ? Math.min((limits.usedToday / limits.dailyLimit) * 100, 100) : 0;
  const remainingLimit = Math.max(limits.dailyLimit - limits.usedToday, 0);
  const exceedsLimit = amountUsd > remainingLimit;

  // Readable price display
  const priceDisplay = (() => {
    if (fromToken === toToken) return '1:1';
    const p = getPrice(fromToken, toToken);
    if (p >= 1) return `1 ${fromToken} = ${formatNumber(p)} ${toToken}`;
    return `1 ${toToken} = ${formatNumber(1 / p)} ${fromToken}`;
  })();

  // Flip tokens
  const handleFlip = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  }, [fromToken, toToken]);

  // Select from token
  const selectFromToken = (token: string) => {
    if (token === toToken) setToToken(fromToken);
    setFromToken(token);
    setShowFromDropdown(false);
  };

  // Select to token
  const selectToToken = (token: string) => {
    if (token === fromToken) setFromToken(toToken);
    setToToken(token);
    setShowToDropdown(false);
  };

  // Simulate quote loading
  useEffect(() => {
    if (numAmount <= 0) return;
    setIsLoadingQuote(true);
    const t = setTimeout(() => setIsLoadingQuote(false), 400);
    return () => clearTimeout(t);
  }, [numAmount, fromToken, toToken]);

  // Two-step swap: user clicks "Swap" → confirmation modal opens → user clicks
  // "Confirm swap" → executeSwap fires. Removes the previous one-click path
  // which fired the mutation without review.
  const [showConfirm, setShowConfirm] = useState(false);

  const openConfirm = () => {
    if (numAmount <= 0 || fromToken === toToken || exceedsLimit) return;
    setShowConfirm(true);
  };

  const handleSwap = async () => {
    if (numAmount <= 0 || fromToken === toToken || exceedsLimit) return;
    try {
      await executeSwap({
        party,
        from: fromToken,
        to: toToken,
        fromAmount: numAmount,
      });
      setShowConfirm(false);
      addToast('success', `Swapped ${formatNumber(numAmount)} ${fromToken} for ${formatNumber(estimatedOutput)} ${toToken}`);
      setAmount('');
    } catch {
      setShowConfirm(false);
      addToast('error', executeError ?? 'Swap failed. Please try again.');
    }
  };

  // Max button: fill with remaining limit converted to from-token units
  const handleMax = () => {
    const fromUsd = ORACLE_PRICES[fromToken] ?? 1;
    const maxUnits = remainingLimit / fromUsd;
    setAmount(maxUnits > 0 ? String(parseFloat(maxUnits.toFixed(6))) : '0');
  };

  // If not whitelisted, show join CTA
  if (!wlStatus.isWhitelisted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-slate-100">Swap</h2>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#2563EB]">
              Beta &mdash; 1000 spots
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-8 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-[#E0F5EA] flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-[#059669]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-slate-100 mb-2">
              Whitelist Required
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-6">
              Treasury Swap is in beta. Join the whitelist to unlock swapping with
              institutional-grade settlement on Canton Network.
            </p>
            <Link
              to="/invite"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              Join Whitelist
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If wallet is locked
  if (isWalletLocked) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-slate-100">Swap</h2>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#2563EB]">
              Beta &mdash; 1000 spots
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-8 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#D97706]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E] dark:text-slate-100 mb-2">
              Unlock Your Wallet
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-6">
              Your wallet is locked. Unlock it to start swapping.
            </p>
            <Link
              to="/wallet"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              Unlock Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-slate-100">Swap</h2>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#2563EB]">
            Beta &mdash; 1000 spots
          </span>
        </div>
      </div>

      {/* Error banner */}
      {executeError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {executeError}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Swap Card */}
        <div className="flex-1 max-w-lg mx-auto lg:mx-0">
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
            {/* From Section */}
            <div className="mb-1">
              <label className="block text-xs text-[#6B7280] dark:text-slate-400 mb-1.5">
                You pay
              </label>
              <div className="bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {/* Token selector */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowFromDropdown(!showFromDropdown); setShowToDropdown(false); }}
                      className="flex items-center gap-2 bg-[#F3F4F9] dark:bg-slate-600 rounded-full pl-2 pr-3 py-1.5 hover:bg-[#E8E9F0] dark:hover:bg-slate-500 transition-colors"
                    >
                      <img
                        src={TOKEN_LOGOS[fromToken]}
                        alt={fromToken}
                        className="w-7 h-7 rounded-full"
                      />
                      <span className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100">
                        {fromToken}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>

                    {showFromDropdown && (
                      <div className="absolute z-20 mt-1 w-44 bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
                        {SWAP_TOKENS.map((token) => (
                          <button
                            key={token}
                            onClick={() => selectFromToken(token)}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F3F4F9] dark:hover:bg-slate-600 transition-colors ${
                              token === fromToken ? 'bg-[#E0F5EA] dark:bg-emerald-900/30' : ''
                            }`}
                          >
                            <img src={TOKEN_LOGOS[token]} alt={token} className="w-6 h-6 rounded-full" />
                            <span className="text-sm text-[#1A1A2E] dark:text-slate-100">{token}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount input */}
                  <div className="flex-1 text-right">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
                      }}
                      className="w-full text-right text-2xl font-bold text-[#1A1A2E] dark:text-slate-100 bg-transparent focus:outline-none placeholder:text-[#D1D5DB] dark:placeholder:text-slate-500"
                    />
                    {numAmount > 0 && (
                      <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                        {formatUsd(amountUsd)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Max button */}
                <div className="flex items-center justify-end mt-2">
                  <button
                    onClick={handleMax}
                    className="text-xs font-semibold text-[#059669] hover:text-[#047857] transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Flip arrow */}
            <div className="flex items-center justify-center -my-2 relative z-10">
              <button
                onClick={handleFlip}
                className="w-10 h-10 rounded-full bg-[#F3F4F9] dark:bg-slate-800 border-4 border-white dark:border-slate-700 flex items-center justify-center hover:bg-[#E8E9F0] dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                <ArrowDown className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>

            {/* To Section */}
            <div className="mt-1">
              <label className="block text-xs text-[#6B7280] dark:text-slate-400 mb-1.5">
                You receive
              </label>
              <div className="bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {/* Token selector */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowToDropdown(!showToDropdown); setShowFromDropdown(false); }}
                      className="flex items-center gap-2 bg-[#F3F4F9] dark:bg-slate-600 rounded-full pl-2 pr-3 py-1.5 hover:bg-[#E8E9F0] dark:hover:bg-slate-500 transition-colors"
                    >
                      <img
                        src={TOKEN_LOGOS[toToken]}
                        alt={toToken}
                        className="w-7 h-7 rounded-full"
                      />
                      <span className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100">
                        {toToken}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>

                    {showToDropdown && (
                      <div className="absolute z-20 mt-1 w-44 bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
                        {SWAP_TOKENS.map((token) => (
                          <button
                            key={token}
                            onClick={() => selectToToken(token)}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F3F4F9] dark:hover:bg-slate-600 transition-colors ${
                              token === toToken ? 'bg-[#E0F5EA] dark:bg-emerald-900/30' : ''
                            }`}
                          >
                            <img src={TOKEN_LOGOS[token]} alt={token} className="w-6 h-6 rounded-full" />
                            <span className="text-sm text-[#1A1A2E] dark:text-slate-100">{token}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Estimated output */}
                  <div className="flex-1 text-right">
                    {isLoadingQuote && numAmount > 0 ? (
                      <div className="flex items-center justify-end">
                        <Loader2 className="w-5 h-5 animate-spin text-[#6B7280]" />
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-[#1A1A2E] dark:text-slate-100">
                          {numAmount > 0 ? formatNumber(estimatedOutput, estimatedOutput < 1 ? 6 : 2) : '0'}
                        </p>
                        {numAmount > 0 && (
                          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                            {formatUsd(estimatedOutput * (ORACLE_PRICES[toToken] ?? 1))}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price info */}
            {numAmount > 0 && !isLoadingQuote && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280] dark:text-slate-400">Rate</span>
                  <span className="text-[#1A1A2E] dark:text-slate-200 font-medium">
                    {priceDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280] dark:text-slate-400">Fee (0.5%)</span>
                  <span className="text-[#1A1A2E] dark:text-slate-200 font-medium">
                    {formatNumber(feeInFrom, feeInFrom < 1 ? 6 : 2)} {fromToken}{' '}
                    <span className="text-[#6B7280] dark:text-slate-400">({formatUsd(feeUsd)})</span>
                  </span>
                </div>
              </div>
            )}

            {/* Daily limit bar */}
            <div className="mt-4 bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#6B7280] dark:text-slate-400">Daily Limit</span>
                <span className="text-[#1A1A2E] dark:text-slate-200 font-medium">
                  {formatUsd(limits.usedToday)} of {formatUsd(limits.dailyLimit)}
                </span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${limitPct}%`,
                    background: limitPct >= 90
                      ? '#EF4444'
                      : limitPct >= 70
                        ? '#F59E0B'
                        : 'linear-gradient(135deg, #059669, #10B981)',
                  }}
                />
              </div>
              {exceedsLimit && numAmount > 0 && (
                <p className="text-xs text-[#EF4444] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Exceeds daily limit ({formatUsd(remainingLimit)} remaining)
                </p>
              )}
            </div>

            {/* Swap button — opens confirmation modal, does not fire tx directly */}
            <button
              onClick={openConfirm}
              disabled={
                isExecuting ||
                numAmount <= 0 ||
                fromToken === toToken ||
                exceedsLimit ||
                isLoadingQuote
              }
              className="w-full mt-5 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Swapping...
                </>
              ) : fromToken === toToken ? (
                'Select different tokens'
              ) : numAmount <= 0 ? (
                'Enter an amount'
              ) : exceedsLimit ? (
                'Exceeds daily limit'
              ) : (
                'Swap'
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Recent Swaps */}
        <div className="flex-1 max-w-lg mx-auto lg:mx-0">
          <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-[18px_22px]">
            <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100 mb-4">
              Recent Swaps
            </h3>

            {history.length === 0 ? (
              <p className="text-sm text-[#6B7280] dark:text-slate-400 text-center py-8">
                No swaps yet. Make your first trade above.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((swap) => (
                  <div
                    key={swap.id}
                    className="flex items-center justify-between bg-white dark:bg-slate-700 border border-[#D6D9E3] dark:border-slate-600 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={TOKEN_LOGOS[swap.from]}
                          alt={swap.from}
                          className="w-8 h-8 rounded-full"
                        />
                        <img
                          src={TOKEN_LOGOS[swap.to]}
                          alt={swap.to}
                          className="w-5 h-5 rounded-full absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100">
                          {swap.from} &rarr; {swap.to}
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-slate-400">
                          {new Date(swap.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#1A1A2E] dark:text-slate-100">
                        +{formatNumber(swap.toAmount, swap.toAmount < 1 ? 6 : 2)} {swap.to}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-slate-400">
                        -{formatNumber(swap.fromAmount)} {swap.from}
                      </p>
                    </div>
                    <span
                      className={`ml-3 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                        swap.status === 'completed'
                          ? 'bg-[#E0F5EA] text-[#059669]'
                          : swap.status === 'pending'
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-red-50 dark:bg-red-900/30 text-[#EF4444]'
                      }`}
                    >
                      {swap.status === 'completed' ? (
                        <Check className="w-3 h-3 inline" />
                      ) : (
                        swap.status
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SwapConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSwap}
        fromToken={fromToken}
        toToken={toToken}
        fromAmount={numAmount}
        estimatedOutput={estimatedOutput}
        price={numAmount > 0 ? estimatedOutput / numAmount : 0}
        platformFeeRate={platformFeeRate}
        slippageTolerancePct={SWAP_SLIPPAGE_TOLERANCE_PCT}
        isExecuting={isExecuting}
      />
    </div>
  );
}
