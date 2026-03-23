import { CheckCircle, ArrowRight } from 'lucide-react';
import TokenIcon from '@/components/TokenIcon';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface AlternativeQuote {
  dex: string;
  price: number;
  fee?: number;
}

export interface SwapLegWithDEX {
  from: string;
  to: string;
  amount: number;
  dex: string;
  price: number;
  alternativeQuotes?: AlternativeQuote[];
}

interface DEXComparisonProps {
  swapLegs: SwapLegWithDEX[];
  compact?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  }
  return `$${price.toFixed(2)}`;
}

function formatAmount(amount: number, symbol: string): string {
  if ((symbol === 'CBTC' || symbol === 'ETHx') && amount < 1) {
    return amount.toFixed(6);
  }
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DEX_COLORS: Record<string, string> = {
  Cantex: '#3B82F6',
  Temple: '#8B5CF6',
  Meridian: '#F59E0B',
  SwapNet: '#10B981',
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function DEXComparison({ swapLegs, compact = false, className = '' }: DEXComparisonProps) {
  if (!swapLegs || swapLegs.length === 0) return null;

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {swapLegs.map((leg, i) => {
          const bestQuote = leg.alternativeQuotes?.length
            ? [...(leg.alternativeQuotes || []), { dex: leg.dex, price: leg.price }]
                .sort((a, b) => b.price - a.price)[0]
            : null;
          const isSelected = !bestQuote || bestQuote.dex === leg.dex;

          return (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className="font-medium text-[#111827]">{leg.from}</span>
              <ArrowRight className="w-3 h-3 text-[#9CA3AF]" />
              <span className="font-medium text-[#111827]">{leg.to}</span>
              <span className="text-[#9CA3AF]">via</span>
              <span
                className="font-semibold"
                style={{ color: DEX_COLORS[leg.dex] || '#059669' }}
              >
                {leg.dex}
              </span>
              {isSelected && (
                <CheckCircle className="w-3 h-3 text-[#059669]" />
              )}
              <span className="text-[#6B7280]">{formatPrice(leg.price)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {swapLegs.map((leg, i) => {
        const allQuotes: AlternativeQuote[] = [
          { dex: leg.dex, price: leg.price },
          ...(leg.alternativeQuotes || []),
        ].sort((a, b) => b.price - a.price);

        const bestDex = allQuotes[0]?.dex;

        return (
          <div key={i} className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-xl p-4">
            {/* Swap header */}
            <div className="flex items-center gap-2 mb-3">
              <TokenIcon symbol={leg.from} size={20} showBadge={false} />
              <span className="text-[14px] font-semibold text-[#111827]">
                {formatAmount(leg.amount, leg.from)} {leg.from}
              </span>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
              <TokenIcon symbol={leg.to} size={20} showBadge={false} />
              <span className="text-[14px] font-semibold text-[#111827]">{leg.to}</span>
            </div>

            {/* DEX quotes table */}
            <div className="space-y-1.5">
              {allQuotes.map((quote) => {
                const isSelected = quote.dex === leg.dex;
                const isBest = quote.dex === bestDex;

                return (
                  <div
                    key={quote.dex}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-[#E0F5EA] border border-[#059669]/30'
                        : 'bg-white border border-[#D6D9E3]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: DEX_COLORS[quote.dex] || '#6B7280' }}
                      />
                      <span className="text-[13px] font-medium text-[#111827]">{quote.dex}</span>
                      {isBest && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[#E0F5EA] text-[#059669]">
                          Best Price
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#111827]">
                        {formatPrice(quote.price)}
                      </span>
                      {quote.fee !== undefined && (
                        <span className="text-[11px] text-[#9CA3AF]">
                          ({quote.fee}% fee)
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle className="w-3.5 h-3.5 text-[#059669]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection reason */}
            {allQuotes.length > 1 && (
              <p className="text-[12px] text-[#6B7280] mt-2">
                {leg.dex} selected
                {bestDex === leg.dex
                  ? ' (best price)'
                  : bestDex
                    ? ` over ${bestDex} (lower slippage)`
                    : ''}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
