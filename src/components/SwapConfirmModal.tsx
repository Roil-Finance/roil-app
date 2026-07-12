/**
 * Swap confirmation modal — shown before firing executeSwap. Lets the user
 * review fromAmount / estimatedOutput / fee / min-out before signing.
 *
 * Escapes close the modal; focus is trapped on the confirm button; ARIA
 * role=dialog + aria-modal so assistive tech announces it as a dialog.
 */
import { useEffect, useRef } from 'react';
import { Loader2, X, AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  estimatedOutput: number;
  price: number;
  platformFeeRate: number;
  slippageTolerancePct: number;
  isExecuting: boolean;
  /**
   * Trade size in USD. Used to compute the effective fee % shown in the
   * high-fee banner. We don't have a clean way to derive this from
   * `fromAmount` alone (would need every token's USD price right here), so
   * the caller passes it in — it already has `getPrice` / oracle access.
   */
  tradeSizeUsd?: number;
  /**
   * DEX-side fees estimated from the live Cantex quote (or, when the live
   * quote isn't wired yet, from observed empirical values: admin 0.005%,
   * liquidity 0.045%, network ~0.10 USD per swap). All amounts in USD. The
   * banner triggers when (sum / tradeSizeUsd) > 5%.
   */
  dexFeeUsd?: {
    admin: number;
    liquidity: number;
    network: number;
  };
}

export default function SwapConfirmModal({
  open,
  onClose,
  onConfirm,
  fromToken,
  toToken,
  fromAmount,
  estimatedOutput,
  price,
  platformFeeRate,
  slippageTolerancePct,
  isExecuting,
  tradeSizeUsd,
  dexFeeUsd,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecuting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, isExecuting]);

  if (!open) return null;

  const minOut = estimatedOutput * (1 - slippageTolerancePct / 100);
  const feeAmount = estimatedOutput * platformFeeRate;
  const netOutput = estimatedOutput - feeAmount;

  // Effective-fee % across the *whole* cost stack (platform + DEX fees).
  // Only shown when the caller passes the data — otherwise the banner is
  // omitted (e.g. on networks where the sidecar isn't wired yet).
  const dexFeeTotalUsd =
    (dexFeeUsd?.admin ?? 0) + (dexFeeUsd?.liquidity ?? 0) + (dexFeeUsd?.network ?? 0);
  const platformFeeUsdEstimate =
    tradeSizeUsd !== undefined ? tradeSizeUsd * platformFeeRate : 0;
  const totalFeeUsd = dexFeeTotalUsd + platformFeeUsdEstimate;
  const effectiveFeePct =
    tradeSizeUsd && tradeSizeUsd > 0 ? (totalFeeUsd / tradeSizeUsd) * 100 : null;
  // 5% is "you are losing meaningful money to fees" — a soft nudge, not a
  // hard block. The user can still confirm; we only inform.
  const showHighFeeBanner =
    effectiveFeePct !== null && effectiveFeePct > 5;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-confirm-title"
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4"
      onClick={() => !isExecuting && onClose()}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#D6D9E3] dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="swap-confirm-title" className="text-lg font-semibold text-[#1A1A2E] dark:text-slate-100">
            Review swap
          </h2>
          <button
            aria-label="Close"
            onClick={() => !isExecuting && onClose()}
            disabled={isExecuting}
            className="text-[#6B7280] hover:text-[#1A1A2E] dark:hover:text-slate-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <Row label="You send" value={`${fromAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${fromToken}`} />
          <Row label="You receive (est.)" value={`${estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken}`} />
          <Row label="Price" value={`1 ${fromToken} = ${price.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken}`} />
          <Row label={`Platform fee (${(platformFeeRate * 100).toFixed(2)}%)`} value={`${feeAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken}`} />
          {dexFeeUsd && (
            <>
              <Row
                label="Cantex admin fee"
                value={`$${dexFeeUsd.admin.toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 2 })}`}
              />
              <Row
                label="Liquidity provider fee"
                value={`$${dexFeeUsd.liquidity.toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 2 })}`}
              />
              <Row
                label="Canton network fee"
                value={`$${dexFeeUsd.network.toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 2 })}`}
              />
            </>
          )}
          <Row label="Net output" value={`${netOutput.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken}`} emphasize />
          <Row
            label={`Min output (slippage ${slippageTolerancePct}%)`}
            value={`${minOut.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken}`}
          />
          {effectiveFeePct !== null && (
            <Row
              label="Effective fee on this trade"
              value={`${effectiveFeePct.toFixed(2)}%`}
              emphasize={showHighFeeBanner}
            />
          )}
        </div>

        {showHighFeeBanner && (
          <div
            role="alert"
            className="flex items-start gap-2 text-xs text-[#7C2D12] bg-[#FED7AA] dark:bg-amber-900/40 dark:text-amber-200 rounded-lg p-3 mb-3"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Fees are a large share of this trade.</strong> Canton's network
              fee (~$0.10–0.20 per swap) is roughly fixed regardless of trade size,
              so small trades pay it as a high percentage. Consider batching multiple
              small buys into a single larger swap, or waiting until you have at least
              ~$30–50 to swap at once.
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-[#92400E] bg-[#FEF3C7] rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            Execution is final once confirmed. Ledger submission cannot be reversed. If the
            quoted price moves outside the slippage window, the swap will revert on-chain
            and no tokens will be deducted.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-[#1A1A2E] dark:text-slate-100 bg-[#F3F4F9] dark:bg-slate-800 hover:bg-[#E8EAF0] dark:hover:bg-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={isExecuting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Confirm swap'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#6B7280] dark:text-slate-400">{label}</span>
      <span className={emphasize ? 'font-semibold text-[#1A1A2E] dark:text-slate-100' : 'text-[#1A1A2E] dark:text-slate-100'}>
        {value}
      </span>
    </div>
  );
}
