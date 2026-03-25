import { AlertTriangle } from 'lucide-react';

export default function AutoRebalance() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Auto-Rebalance
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        Automatically adjust your portfolio when holdings drift from target allocations. Roil&rsquo;s
        Smart Router finds the best execution path across multiple DEXes.
      </p>

      {/* Trigger Modes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Trigger Modes
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-6">
          Each portfolio is configured with a trigger mode that determines when rebalancing occurs.
          You can change the trigger mode at any time via the Settings page or the API.
        </p>

        <div className="space-y-4">
          {/* Manual */}
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] dark:bg-slate-700 text-[12px] font-bold text-[#6B7280] dark:text-slate-400 font-mono">
                Manual
              </span>
              <span className="text-[13px] text-[#9CA3AF] dark:text-slate-500">User-initiated only</span>
            </div>
            <p className="text-[14px] text-[#374151] dark:text-slate-300 leading-relaxed">
              Rebalancing only happens when you explicitly trigger it by clicking the Rebalance button
              or calling <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">POST /api/portfolio/:id/rebalance</code>.
              Useful for advanced users who want full control over timing.
            </p>
          </div>

          {/* Drift Threshold */}
          <div className="p-5 rounded-xl border-2 border-[#059669] dark:border-emerald-600 bg-[#F0FDF4] dark:bg-emerald-900/10">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#059669] text-[12px] font-bold text-white font-mono">
                DriftThreshold
              </span>
              <span className="text-[13px] text-[#059669] dark:text-emerald-400 font-medium">Recommended</span>
            </div>
            <p className="text-[14px] text-[#374151] dark:text-slate-300 leading-relaxed mb-3">
              The system monitors portfolio drift continuously. When any asset&rsquo;s allocation deviates from
              its target by more than the threshold percentage, a rebalance is automatically triggered.
            </p>
            <div className="bg-[#1E293B] rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// Drift calculation
for each target in portfolio.targets:
  holding = portfolio.holdings[target.asset]
  currentPct = (holding.valueCc / totalValue) * 100
  drift = |currentPct - target.targetPct|

  if drift > threshold:
    triggerRebalance()

// Example: target CBTC = 25%, actual = 31.2%
// drift = |31.2 - 25.0| = 6.2%
// If threshold = 5.0% → rebalance triggered`}
              </pre>
            </div>
          </div>

          {/* Price Condition */}
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-[12px] font-bold text-white font-mono">
                PriceCondition
              </span>
              <span className="text-[13px] text-[#9CA3AF] dark:text-slate-500">Advanced</span>
            </div>
            <p className="text-[14px] text-[#374151] dark:text-slate-300 leading-relaxed">
              Rebalance is triggered when a specific asset reaches a target price. Supports both
              <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">sell_above</code> and
              <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">buy_below</code> actions.
              For example, sell CBTC allocation when BTC price exceeds $100,000.
            </p>
          </div>
        </div>
      </section>

      {/* Smart Router */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Smart Router
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-6">
          When a rebalance executes, the Smart Router compares quotes from all available DEXes and
          selects the one offering the best output amount for each swap leg. This ensures optimal
          execution regardless of liquidity conditions.
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-slate-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8F9FB] dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-700">
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Feature</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Cantex (AMM)</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Temple (CLOB)</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              <tr className="border-b border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900">
                <td className="px-4 py-3 font-medium text-[#111827] dark:text-slate-200">Type</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Automated Market Maker</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Central Limit Order Book</td>
              </tr>
              <tr className="border-b border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-[#111827] dark:text-slate-200">Best For</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Small to medium trades</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Large trades, tight spreads</td>
              </tr>
              <tr className="border-b border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900">
                <td className="px-4 py-3 font-medium text-[#111827] dark:text-slate-200">Pricing</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">x * y = k constant product</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Order matching (bid/ask)</td>
              </tr>
              <tr className="border-b border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-[#111827] dark:text-slate-200">Slippage</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Increases with trade size</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Depends on depth</td>
              </tr>
              <tr className="bg-white dark:bg-slate-900">
                <td className="px-4 py-3 font-medium text-[#111827] dark:text-slate-200">Availability</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Always (pool-based)</td>
                <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400">Requires maker orders</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Simulation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Simulation Before Execution
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Before executing any rebalance, you can run a simulation to preview the planned swap legs,
          estimated output amounts, and current drift metrics. This is a dry-run that does not modify
          any contracts on the ledger.
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`POST /api/portfolio/:id/simulate

// Response:
{
  "currentDrift": {
    "maxDrift": 6.2,
    "drifts": { "CBTC": 6.2, "ETHx": -2.1, "USDCx": -4.1 }
  },
  "plannedSwaps": [
    {
      "fromAsset": { "symbol": "CBTC", "admin": "Canton::Admin" },
      "toAsset": { "symbol": "USDCx", "admin": "Canton::Admin" },
      "fromAmount": 0.012,
      "toAmount": 320
    }
  ],
  "estimatedSwapCount": 1,
  "wouldRebalance": true
}`}
          </pre>
        </div>

        <div className="bg-[#FFFBEB] dark:bg-amber-900/20 border border-[#FDE68A] dark:border-amber-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#92400E] dark:text-amber-300/80 leading-relaxed">
              <strong>Important:</strong> Simulation results are estimates. Actual output amounts may vary
              due to price movement between simulation and execution. The platform applies a configurable
              slippage tolerance (default 0.5%) to protect against unfavorable execution.
            </p>
          </div>
        </div>
      </section>

      {/* Rebalance History */}
      <section>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Rebalance History
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Every executed rebalance creates a <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">RebalanceLog</code> contract
          on the Canton ledger. This immutable record contains the swap legs, the drift before rebalancing,
          and a timestamp.
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// RebalanceLog contract payload
{
  "platform": "roil::abc123...",
  "user": "alice::def456...",
  "swapLegs": [
    {
      "fromAsset": { "symbol": "CC", "admin": "Canton::Admin" },
      "toAsset": { "symbol": "USDCx", "admin": "Canton::Admin" },
      "fromAmount": 320,
      "toAmount": 320
    }
  ],
  "driftBefore": 6.4,
  "timestamp": "2026-03-15T10:30:00Z"
}`}
          </pre>
        </div>
      </section>
    </div>
  );
}
