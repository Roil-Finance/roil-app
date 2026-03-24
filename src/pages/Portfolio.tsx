import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Pause, Play, Trash2, Edit3, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, ChevronDown, Loader2,
} from 'lucide-react';
import { TOKEN_LOGOS } from '@/config';
import { useParty } from '@/context/PartyContext';
import { usePortfolio, useDrift, useRebalanceHistory } from '@/hooks/usePortfolio';
import { useMutation } from '@/hooks/useApi';
import SimulateModal from '@/components/SimulateModal';
import DEXComparison from '@/components/DEXComparison';
import type { SwapLegWithDEX } from '@/components/DEXComparison';
import type { TriggerMode } from '@/types';

/* ------------------------------------------------------------------ */
/* Token accent colors                                                 */
/* ------------------------------------------------------------------ */
const TOKEN_ACCENT: Record<string, string> = {
  CC: '#059669', USDCx: '#2563EB', CBTC: '#F59E0B', ETHx: '#8B5CF6',
  SOLx: '#14F195', XAUt: '#D97706', XAGt: '#A8A9AD', USTb: '#1E40AF',
};

/* ------------------------------------------------------------------ */
/* Toggle component                                                    */
/* ------------------------------------------------------------------ */
function Toggle({ checked, onChange, disabled, 'aria-label': ariaLabel }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; 'aria-label'?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-[44px] h-[26px] rounded-full transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ backgroundColor: checked ? '#059669' : '#E5E7EB' }}
    >
      <div
        className="absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm Dialog                                                      */
/* ------------------------------------------------------------------ */
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl">
        <h3 className="text-[20px] font-bold text-[#111827] mb-2">{title}</h3>
        <p className="text-[14px] text-[#6B7280] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-[#D6D9E3] text-[14px] font-medium text-[#6B7280] hover:bg-[#F3F4F9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 ${
              danger
                ? 'bg-[#DC2626]'
                : 'bg-gradient-to-r from-[#059669] to-[#10B981]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trigger Mode Selector                                               */
/* ------------------------------------------------------------------ */
const TRIGGER_MODE_OPTIONS = [
  { label: 'Manual', tag: 'Manual' as const, description: 'Rebalance only when you click the button' },
  { label: 'Drift Threshold', tag: 'DriftThreshold' as const, description: 'Auto-rebalance when drift exceeds threshold' },
  { label: 'Price Condition', tag: 'PriceCondition' as const, description: 'Rebalance when asset price hits target' },
];

function TriggerModeSelector({
  currentMode,
  driftThreshold,
  onModeChange,
  isUpdating,
}: {
  currentMode: TriggerMode;
  driftThreshold: number;
  onModeChange: (tag: string, threshold?: number) => void;
  isUpdating: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localThreshold, setLocalThreshold] = useState(driftThreshold);

  const currentLabel = TRIGGER_MODE_OPTIONS.find((o) => o.tag === currentMode.tag)?.label ?? currentMode.tag;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D6D9E3] text-[13px] font-medium text-[#111827] hover:bg-[#F3F4F9] transition-colors disabled:opacity-50"
      >
        {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {currentLabel}
        <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-[320px] bg-white rounded-xl border border-[#D6D9E3] shadow-lg overflow-hidden">
            {TRIGGER_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.tag}
                onClick={() => {
                  if (opt.tag === 'DriftThreshold') {
                    onModeChange(opt.tag, localThreshold);
                  } else {
                    onModeChange(opt.tag);
                  }
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-[#F3F4F9] transition-colors border-b border-[#D6D9E3]/50 last:border-0 ${
                  currentMode.tag === opt.tag ? 'bg-[#E0F5EA]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[#111827]">{opt.label}</span>
                  {currentMode.tag === opt.tag && (
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  )}
                </div>
                <p className="text-[12px] text-[#6B7280] mt-0.5">{opt.description}</p>
              </button>
            ))}

            {/* Threshold slider (always visible for quick setting) */}
            <div className="px-4 py-3 bg-[#F3F4F9] border-t border-[#D6D9E3]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[#6B7280]">Drift Threshold</span>
                <span className="text-[13px] font-semibold text-[#059669]">{localThreshold.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={localThreshold}
                onChange={(e) => setLocalThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#D6D9E3] rounded-full appearance-none cursor-pointer accent-[#059669]"
              />
              <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1">
                <span>1%</span>
                <span>15%</span>
              </div>
              {currentMode.tag === 'DriftThreshold' && localThreshold !== driftThreshold && (
                <button
                  onClick={() => {
                    onModeChange('DriftThreshold', localThreshold);
                    setIsOpen(false);
                  }}
                  className="mt-2 w-full px-3 py-1.5 rounded-lg text-[12px] font-medium text-white bg-[#059669] hover:bg-[#047857] transition-colors"
                >
                  Update Threshold to {localThreshold.toFixed(1)}%
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Format helpers                                                      */
/* ------------------------------------------------------------------ */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAmount(amount: number, symbol: string): string {
  if ((symbol === 'CBTC' || symbol === 'ETHx') && amount < 1) {
    return amount.toFixed(6);
  }
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */
export default function Portfolio() {
  const navigate = useNavigate();
  const { party } = useParty();

  // Real data hooks
  const { portfolio, refetch: refetchPortfolio, isLoading: portfolioLoading } = usePortfolio(party);
  const { drift: maxDrift } = useDrift(portfolio);
  const { logs: rebalanceLogs, isLoading: historyLoading } = useRebalanceHistory(party);

  // UI state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);

  // Mutations
  const triggerModeMutation = useMutation<
    { triggerMode: string; driftThreshold?: number },
    { success: boolean }
  >(
    () => `/api/portfolio/${encodeURIComponent(party)}/trigger-mode`,
    'PUT',
  );

  const activateMutation = useMutation<{ id: string }, { success: boolean }>(
    () => `/api/portfolio/${encodeURIComponent(party)}/activate`,
    'POST',
  );

  const deactivateMutation = useMutation<{ id: string }, { success: boolean }>(
    () => `/api/portfolio/${encodeURIComponent(party)}/deactivate`,
    'POST',
  );

  // Derived state from portfolio
  const isActive = portfolio.isActive;
  const paused = !isActive;

  const driftThreshold = useMemo(() => {
    if (portfolio.triggerMode.tag === 'DriftThreshold') {
      return portfolio.triggerMode.value;
    }
    return 5.0;
  }, [portfolio.triggerMode]);

  const totalValue = useMemo(() => {
    const total = portfolio.holdings.reduce((acc, h) => acc + h.valueCc, 0);
    return `$${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, [portfolio.holdings]);

  const totalValueNum = useMemo(() => {
    return portfolio.holdings.reduce((acc, h) => acc + h.valueCc, 0);
  }, [portfolio.holdings]);

  const tokenAllocations = useMemo(() => {
    if (totalValueNum === 0) return [];
    return portfolio.targets.map((target) => {
      const holding = portfolio.holdings.find((h) => h.asset.symbol === target.asset.symbol);
      const currentPct = holding ? (holding.valueCc / totalValueNum) * 100 : 0;
      return {
        symbol: target.asset.symbol,
        targetPct: target.targetPct,
        currentPct: Math.round(currentPct * 10) / 10,
        holdings: holding ? formatAmount(holding.amount, holding.asset.symbol) + ' ' + holding.asset.symbol : '0 ' + target.asset.symbol,
        value: holding ? `$${holding.valueCc.toLocaleString()}` : '$0',
        change24h: 0, // Would come from market data
      };
    });
  }, [portfolio, totalValueNum]);

  const driftStatus = maxDrift > driftThreshold ? 'high' : maxDrift > driftThreshold * 0.6 ? 'medium' : 'low';

  // Handlers
  const handleTogglePause = useCallback(async () => {
    try {
      if (isActive) {
        await deactivateMutation.mutate({ id: party });
      } else {
        await activateMutation.mutate({ id: party });
      }
      refetchPortfolio();
    } catch {
      // Optimistic toggle for demo mode
      refetchPortfolio();
    }
  }, [isActive, party, deactivateMutation, activateMutation, refetchPortfolio]);

  const handleTriggerModeChange = useCallback(async (tag: string, threshold?: number) => {
    try {
      await triggerModeMutation.mutate({
        triggerMode: tag,
        driftThreshold: threshold,
      });
      refetchPortfolio();
    } catch {
      // Silent fail for demo mode
      refetchPortfolio();
    }
  }, [triggerModeMutation, refetchPortfolio]);

  const handleDelete = () => {
    setShowDeleteDialog(false);
    navigate('/create');
  };

  const handleRebalanceComplete = () => {
    refetchPortfolio();
  };

  const isTogglingPause = activateMutation.isLoading || deactivateMutation.isLoading;

  // Loading state
  if (portfolioLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#059669] animate-spin" />
        <span className="ml-3 text-[15px] text-[#6B7280]">Loading portfolio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">My Portfolio</h1>
          <p className="text-[15px] text-[#6B7280] mt-1">
            {portfolio.targets.length} assets &middot; {portfolio.totalRebalances} rebalances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePause}
            disabled={isTogglingPause}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium border transition-colors disabled:opacity-50 ${
              paused
                ? 'border-[#059669] text-[#059669] hover:bg-[#E0F5EA]'
                : 'border-[#D6D9E3] text-[#6B7280] hover:bg-[#F3F4F9]'
            }`}
          >
            {isTogglingPause ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : paused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => navigate('/create/build', { state: { allocations: tokenAllocations.map((t) => ({ symbol: t.symbol, pct: t.targetPct })) } })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium border border-[#D6D9E3] text-[#6B7280] hover:bg-[#F3F4F9] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium border border-[#FFE4E6] text-[#E11D48] hover:bg-[#FFE4E6] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => setShowSimulateModal(true)}
            disabled={paused}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-[14px]
                       bg-gradient-to-r from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            Rebalance Now
          </button>
        </div>
      </div>

      {/* Status bar */}
      {paused && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A]">
          <Pause className="w-4 h-4 text-[#D97706]" />
          <span className="text-[14px] font-medium text-[#92400E]">
            Portfolio is paused. Auto-rebalancing is disabled.
          </span>
          <button
            onClick={handleTogglePause}
            className="ml-auto text-[13px] font-medium text-[#D97706] hover:text-[#92400E] underline transition-colors"
          >
            Resume now
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5">
          <p className="text-sm text-[#6B7280]">Total Value</p>
          <p className="text-[26px] font-bold text-[#111827] mt-1">{totalValue}</p>
        </div>
        <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5">
          <p className="text-sm text-[#6B7280]">Tokens</p>
          <p className="text-[26px] font-bold text-[#111827] mt-1">{portfolio.targets.length}</p>
        </div>
        <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5">
          <p className="text-sm text-[#6B7280]">Max Drift</p>
          <p className={`text-[26px] font-bold mt-1 ${
            driftStatus === 'high' ? 'text-[#DC2626]' : driftStatus === 'medium' ? 'text-[#D97706]' : 'text-[#059669]'
          }`}>
            {maxDrift.toFixed(1)}%
          </p>
        </div>
        <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6B7280]">Trigger Mode</p>
              <div className="mt-2">
                <TriggerModeSelector
                  currentMode={portfolio.triggerMode}
                  driftThreshold={driftThreshold}
                  onModeChange={handleTriggerModeChange}
                  isUpdating={triggerModeMutation.isLoading}
                />
              </div>
            </div>
            <Toggle
              checked={portfolio.triggerMode.tag !== 'Manual'}
              onChange={(v) => {
                if (v) {
                  handleTriggerModeChange('DriftThreshold', driftThreshold);
                } else {
                  handleTriggerModeChange('Manual');
                }
              }}
              disabled={triggerModeMutation.isLoading}
              aria-label="Toggle auto-trigger mode"
            />
          </div>
        </div>
      </div>

      {/* Token allocations table */}
      <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5">
        <h2 className="text-[18px] font-bold text-[#111827] mb-5">Token Allocations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[13px] text-[#9CA3AF] border-b border-[#D6D9E3]">
                <th className="text-left font-medium pb-3 pr-4">Token</th>
                <th className="text-right font-medium pb-3 pr-4">Holdings</th>
                <th className="text-right font-medium pb-3 pr-4">Value</th>
                <th className="text-right font-medium pb-3 pr-4">Target</th>
                <th className="text-right font-medium pb-3 pr-4">Current</th>
                <th className="text-right font-medium pb-3 pr-4">Drift</th>
                <th className="text-right font-medium pb-3">24h</th>
              </tr>
            </thead>
            <tbody>
              {tokenAllocations.map((t) => {
                const drift = t.currentPct - t.targetPct;
                const absDrift = Math.abs(drift);
                return (
                  <tr key={t.symbol} className="border-b border-[#D6D9E3]/50 last:border-0 hover:bg-[#ECEEF4] transition-colors">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <img src={TOKEN_LOGOS[t.symbol]} alt={t.symbol} className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-[15px] font-semibold text-[#111827]">{t.symbol}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span className="text-[14px] text-[#111827]">{t.holdings}</span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span className="text-[14px] font-semibold text-[#111827]">{t.value}</span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span className="text-[14px] text-[#6B7280]">{t.targetPct}%</span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-[60px] h-[6px] rounded-full bg-[#E5E7EB] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(t.currentPct, 100)}%`, backgroundColor: TOKEN_ACCENT[t.symbol] || '#6B7280' }}
                          />
                        </div>
                        <span className="text-[14px] font-semibold" style={{ color: TOKEN_ACCENT[t.symbol] || '#111827' }}>
                          {t.currentPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span className={`text-[13px] font-medium px-2 py-0.5 rounded-full ${
                        absDrift > driftThreshold
                          ? 'bg-[#FFE4E6] text-[#DC2626]'
                          : absDrift > driftThreshold * 0.6
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#E0F5EA] text-[#059669]'
                      }`}>
                        {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.change24h > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
                        ) : t.change24h < 0 ? (
                          <TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />
                        ) : null}
                        <span className={`text-[13px] font-medium ${
                          t.change24h > 0 ? 'text-[#059669]' : t.change24h < 0 ? 'text-[#DC2626]' : 'text-[#9CA3AF]'
                        }`}>
                          {t.change24h > 0 ? '+' : ''}{t.change24h}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rebalance History */}
      <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5">
        <h2 className="text-[18px] font-bold text-[#111827] mb-4">Rebalance History</h2>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#059669] animate-spin" />
            <span className="ml-2 text-[14px] text-[#6B7280]">Loading history...</span>
          </div>
        ) : rebalanceLogs.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-[#D6D9E3] mx-auto mb-2" />
            <p className="text-[14px] text-[#9CA3AF]">No rebalance history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rebalanceLogs.map((log, index) => {
              const isExpanded = expandedLogIndex === index;
              const firstLeg = log.swapLegs[0];
              const actionText = firstLeg
                ? `${formatAmount(firstLeg.fromAmount, firstLeg.fromAsset.symbol)} ${firstLeg.fromAsset.symbol} → ${formatAmount(firstLeg.toAmount, firstLeg.toAsset.symbol)} ${firstLeg.toAsset.symbol}${log.swapLegs.length > 1 ? ` +${log.swapLegs.length - 1} more` : ''}`
                : 'Rebalance executed';

              // Build DEX legs for expanded view (using demo DEX data since logs may not have it)
              const dexLegs: SwapLegWithDEX[] = log.swapLegs.map((leg) => ({
                from: leg.fromAsset.symbol,
                to: leg.toAsset.symbol,
                amount: leg.fromAmount,
                dex: 'Cantex',
                price: leg.toAmount > 0 ? leg.fromAmount / leg.toAmount : 0,
                alternativeQuotes: [],
              }));

              return (
                <div key={index}>
                  <div
                    onClick={() => setExpandedLogIndex(isExpanded ? null : index)}
                    className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#ECEEF4] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-[#D97706]" />
                      </div>
                      <div>
                        <p className="text-[14px] text-[#111827]">{actionText}</p>
                        <p className="text-[12px] text-[#9CA3AF]">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-[#6B7280]">
                        Drift: {log.driftBefore.toFixed(1)}%
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E0F5EA] text-[#059669]">
                        Completed
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="ml-11 mr-3 mb-3 p-4 bg-white border border-[#D6D9E3] rounded-xl space-y-3">
                      {/* All swap legs */}
                      <div>
                        <p className="text-[12px] text-[#9CA3AF] uppercase tracking-wide font-medium mb-2">Swap Details</p>
                        {log.swapLegs.map((leg, li) => (
                          <div key={li} className="flex items-center gap-2 py-1.5">
                            <img src={TOKEN_LOGOS[leg.fromAsset.symbol]} alt={leg.fromAsset.symbol} className="w-5 h-5 rounded-full" />
                            <span className="text-[13px] text-[#111827]">
                              {formatAmount(leg.fromAmount, leg.fromAsset.symbol)} {leg.fromAsset.symbol}
                            </span>
                            <span className="text-[#9CA3AF]">→</span>
                            <img src={TOKEN_LOGOS[leg.toAsset.symbol]} alt={leg.toAsset.symbol} className="w-5 h-5 rounded-full" />
                            <span className="text-[13px] text-[#111827]">
                              {formatAmount(leg.toAmount, leg.toAsset.symbol)} {leg.toAsset.symbol}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* DEX routing info */}
                      <div>
                        <p className="text-[12px] text-[#9CA3AF] uppercase tracking-wide font-medium mb-2">Route</p>
                        <DEXComparison swapLegs={dexLegs} compact />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategy Info */}
      <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5">
        <h2 className="text-[18px] font-bold text-[#111827] mb-4">Strategy Details</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#6B7280]">Trigger Mode</span>
            <span className="text-[14px] font-semibold text-[#111827]">
              {portfolio.triggerMode.tag === 'Manual'
                ? 'Manual'
                : portfolio.triggerMode.tag === 'DriftThreshold'
                  ? `Auto at ${portfolio.triggerMode.value}%`
                  : 'Price Condition'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#6B7280]">Platform</span>
            <span className="text-[14px] text-[#111827]">{portfolio.platform.replace('Canton::', '')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#6B7280]">Drift Threshold</span>
            <span className="text-[14px] font-semibold text-[#059669]">{driftThreshold}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#6B7280]">Last Rebalance</span>
            <span className="text-[14px] text-[#111827]">
              {rebalanceLogs.length > 0
                ? formatDate(rebalanceLogs[0].timestamp)
                : 'Never'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#6B7280]">Total Rebalances</span>
            <span className="text-[14px] font-semibold text-[#111827]">{portfolio.totalRebalances}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#6B7280]">Status</span>
            <div className="flex items-center gap-1.5">
              {paused ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="text-[14px] font-medium text-[#D97706]">Paused</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="text-[14px] font-medium text-[#059669]">Active</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Portfolio"
          message="Are you sure you want to delete this portfolio? This will stop all auto-rebalancing and DCA schedules linked to it. This action cannot be undone."
          confirmLabel="Delete Portfolio"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {/* Simulate & Rebalance modal */}
      <SimulateModal
        isOpen={showSimulateModal}
        portfolioId={party}
        onClose={() => setShowSimulateModal(false)}
        onRebalanceComplete={handleRebalanceComplete}
      />
    </div>
  );
}
