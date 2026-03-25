import { Layers, Sliders, BarChart3, TrendingUp } from 'lucide-react';

const TEMPLATES = [
  { name: 'Conservative', risk: 'Low', assets: 'USDCx 40%, USTb 30%, XAUt 20%, CC 10%', drift: '3.0%' },
  { name: 'Balanced Growth', risk: 'Medium', assets: 'CBTC 25%, ETHx 20%, USDCx 25%, XAUt 15%, CC 15%', drift: '5.0%' },
  { name: 'BTC-ETH Maxi', risk: 'High', assets: 'CBTC 50%, ETHx 30%, USDCx 20%', drift: '7.0%' },
  { name: 'Crypto Basket', risk: 'High', assets: 'CBTC 30%, ETHx 25%, SOLx 15%, CC 15%, USDCx 15%', drift: '5.0%' },
  { name: 'Precious Metals', risk: 'Low', assets: 'XAUt 60%, XAGt 40%', drift: '3.0%' },
  { name: 'Institutional Grade', risk: 'Medium', assets: 'USTb 40%, XAUt 25%, USDCx 20%, CBTC 15%', drift: '4.0%' },
  { name: 'Stablecoin Yield', risk: 'Low', assets: 'USDCx 70%, CC 30%', drift: '2.0%' },
  { name: 'All Weather', risk: 'Medium', assets: 'USTb 30%, XAUt 20%, CBTC 20%, USDCx 15%, ETHx 15%', drift: '5.0%' },
];

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function PortfolioManagement() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Portfolio Management
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        Create, configure, and manage diversified portfolios of tokenized assets on the Canton Network.
      </p>

      {/* Creating Portfolios */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Creating Portfolios
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Roil offers two approaches to portfolio creation. Both result in a Daml <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">Portfolio</code> contract
          on the Canton ledger with your specified target allocations and trigger mode.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] dark:bg-blue-900/30 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">
              From Template
            </h3>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Select from 8 pre-built strategies. Each template defines asset allocations that sum to 100%
              and a default drift threshold. You can modify allocations after creation.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] dark:bg-emerald-900/30 flex items-center justify-center mb-3">
              <Sliders className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">
              Build Your Own
            </h3>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Choose from 9 available assets, set allocation percentages with interactive sliders, and
              configure trigger mode. Minimum 2 assets, maximum 20. Allocations must sum to 100%.
            </p>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Portfolio Templates
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-slate-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8F9FB] dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-700">
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Template</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Allocation</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider">Drift</th>
              </tr>
            </thead>
            <tbody>
              {TEMPLATES.map((t, i) => (
                <tr
                  key={t.name}
                  className={`border-b border-[#E5E7EB] dark:border-slate-700 ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-[#FAFBFC] dark:bg-slate-800/30'}`}
                >
                  <td className="px-4 py-3 text-[14px] font-medium text-[#111827] dark:text-slate-200">{t.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${RISK_COLORS[t.risk]}`}>
                      {t.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-slate-400">{t.assets}</td>
                  <td className="px-4 py-3 text-[13px] text-[#374151] dark:text-slate-300 font-mono">{t.drift}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Target Allocations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Target Allocations
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Each portfolio defines a set of target allocations that represent the ideal percentage distribution
          across your chosen assets. The portfolio tracks how far your actual holdings have drifted from
          these targets.
        </p>

        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// Daml TargetAllocation type
data TargetAllocation = TargetAllocation
  { asset     : AssetId        -- { symbol: "CBTC", admin: "Canton::Admin" }
  , targetPct : Decimal        -- e.g. 25.0 (must sum to 100)
  }

-- Example: Balanced Growth targets
targets = [
  TargetAllocation { asset = AssetId "CBTC" admin, targetPct = 25.0 },
  TargetAllocation { asset = AssetId "ETHx" admin, targetPct = 20.0 },
  TargetAllocation { asset = AssetId "USDCx" admin, targetPct = 25.0 },
  TargetAllocation { asset = AssetId "XAUt" admin, targetPct = 15.0 },
  TargetAllocation { asset = AssetId "CC" admin, targetPct = 15.0 },
]`}
          </pre>
        </div>

        <div className="bg-[#F0FDF4] dark:bg-emerald-900/20 border border-[#BBF7D0] dark:border-emerald-800 rounded-xl p-5">
          <p className="text-[14px] text-[#059669] dark:text-emerald-400">
            <strong>Validation:</strong> Allocations must sum to exactly 100% (with 0.1% tolerance). The API
            returns a 400 error if targets are outside the range 99.9%&ndash;100.1%.
          </p>
        </div>
      </section>

      {/* Holdings Sync */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Holdings Sync
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Your portfolio&rsquo;s actual holdings are queried from the Canton ledger in real-time. Each holding
          includes the asset identifier, quantity, and the CC-denominated value (using the Price Oracle&rsquo;s
          latest rates).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-center">
            <BarChart3 className="w-6 h-6 text-[#2563EB] dark:text-blue-400 mx-auto mb-2" />
            <div className="text-[14px] font-semibold text-[#111827] dark:text-slate-100">Allocation Chart</div>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-1">Interactive donut showing actual vs target</p>
          </div>
          <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-center">
            <TrendingUp className="w-6 h-6 text-[#059669] dark:text-emerald-400 mx-auto mb-2" />
            <div className="text-[14px] font-semibold text-[#111827] dark:text-slate-100">Performance Graph</div>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-1">24h, 7d, 30d value history</p>
          </div>
          <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-center">
            <Sliders className="w-6 h-6 text-[#D97706] dark:text-amber-400 mx-auto mb-2" />
            <div className="text-[14px] font-semibold text-[#111827] dark:text-slate-100">Drift Tracking</div>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-1">Per-asset drift from target %</p>
          </div>
        </div>
      </section>

      {/* Performance Tracking */}
      <section>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Performance Tracking
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          The backend records portfolio snapshots at regular intervals, enabling historical performance analysis.
          The <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">GET /api/portfolio/:party/performance</code> endpoint
          returns:
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`{
  "summary": {
    "current": 15420,       // Current total value in CC
    "change24h": 2.3,       // 24-hour change %
    "change7d": 5.1,        // 7-day change %
    "change30d": 12.7,      // 30-day change %
    "high30d": 16000,       // 30-day high
    "low30d": 13500         // 30-day low
  },
  "history": [
    {
      "timestamp": "2026-03-25T12:00:00Z",
      "totalValueCc": 15420,
      "holdings": [
        { "asset": "CBTC", "amount": 0.15, "valueCc": 5200 },
        { "asset": "ETHx", "amount": 2.5, "valueCc": 4100 }
      ]
    }
  ]
}`}
          </pre>
        </div>
      </section>
    </div>
  );
}
