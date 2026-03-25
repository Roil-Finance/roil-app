import { Globe, ArrowRightLeft, BookOpen, Eye, Zap } from 'lucide-react';

export default function CantonIntegration() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Canton Integration
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        How Roil Finance connects to the Canton Network, interacts with the JSON Ledger API,
        and leverages Cantex and Temple DEXes for trade execution.
      </p>

      {/* JSON Ledger API v2 */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#E0F5EA] dark:bg-emerald-900/30 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#059669] dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            JSON Ledger API v2
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Roil communicates with the Canton participant node through the JSON Ledger API v2, a modern
          HTTP/JSON interface that replaces the older gRPC Ledger API. All ledger operations &mdash; queries,
          creates, and exercises &mdash; go through this interface.
        </p>

        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// Ledger client configuration
const ledger = new LedgerClient({
  host: process.env.CANTON_LEDGER_HOST,    // e.g. "https://participant.canton.network"
  port: 5001,
  useTls: true,
});

// Query active contracts
const portfolios = await ledger.query(
  "Roil.Portfolio:Portfolio",       // Fully qualified template ID
  platformParty,                     // Acting party
);

// Create a new contract
const contractId = await ledger.createAs(
  "Roil.Portfolio:PortfolioProposal",
  { platform: platformParty, user: userParty },
  platformParty,
);

// Exercise a choice on a contract
const result = await ledger.exerciseAs(
  "Roil.Portfolio:Portfolio",
  contractId,
  "UpdateTargets",                   // Choice name
  { newTargets: [...] },             // Choice arguments
  userParty,                          // Submitting party (must be controller)
);`}
          </pre>
        </div>

        <div className="bg-[#F0FDF4] dark:bg-emerald-900/20 border border-[#BBF7D0] dark:border-emerald-800 rounded-xl p-5">
          <p className="text-[14px] text-[#059669] dark:text-emerald-400 leading-relaxed">
            <strong>Template IDs</strong> follow the format <code className="font-mono">PackageName.ModuleName:TemplateName</code>.
            Roil&rsquo;s contracts are deployed under the <code className="font-mono">Roil</code> package with modules
            <code className="font-mono">Portfolio</code>, <code className="font-mono">DCA</code>,
            <code className="font-mono">RewardTracker</code>, <code className="font-mono">TokenTransfer</code>, and
            <code className="font-mono">Governance</code>.
          </p>
        </div>
      </section>

      {/* Cantex DEX */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] dark:bg-blue-900/30 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            Cantex DEX Integration
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Cantex is Canton Network&rsquo;s native Automated Market Maker (AMM) DEX. It uses the constant
          product formula (x * y = k) for price discovery and supports all 9 Roil token pairs.
        </p>

        <div className="space-y-3 mb-6">
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Liquidity Pools</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Each trading pair has a dedicated liquidity pool with reserves of both assets. Pool info
              (reserve amounts, fee percentage) is available via
              <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">GET /api/market/pools</code>.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Swap Execution</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Swaps are atomic transactions on the Canton ledger. The user&rsquo;s holding is debited
              and the target asset is credited in a single transaction, with slippage protection
              enforced by the smart contract.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">Quote API</h4>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Get a pre-execution quote via
              <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">GET /api/market/quote?from=CC&to=USDCx&amount=100</code>.
              Returns the expected output amount, fee, and price impact without executing the swap.
            </p>
          </div>
        </div>
      </section>

      {/* Temple CLOB */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#EDE9FE] dark:bg-violet-900/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#7C3AED] dark:text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            Temple CLOB Integration
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Temple is a Central Limit Order Book (CLOB) DEX on Canton Network. Unlike Cantex&rsquo;s AMM model,
          Temple matches specific buy and sell orders, often providing tighter spreads for larger trades.
        </p>

        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`// Get orderbook depth for a trading pair
GET /api/market/orderbook?from=CC&to=USDCx

// Response:
{
  "bids": [
    { "price": 0.998, "amount": 5000 },
    { "price": 0.995, "amount": 12000 }
  ],
  "asks": [
    { "price": 1.002, "amount": 8000 },
    { "price": 1.005, "amount": 15000 }
  ],
  "spread": 0.004,
  "midPrice": 1.000
}`}
          </pre>
        </div>

        <p className="text-[14px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
          The Smart Router automatically compares quotes from both Cantex and Temple, selecting the
          venue that offers the best output for each swap leg. You can also explicitly compare quotes via
          <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">GET /api/market/compare-quotes</code>.
        </p>
      </section>

      {/* Sub-Transaction Privacy */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] dark:bg-red-900/30 flex items-center justify-center">
            <Eye className="w-4 h-4 text-[#EF4444] dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            Sub-Transaction Privacy
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Canton Network&rsquo;s defining feature is sub-transaction privacy. Unlike public blockchains where
          every transaction is globally visible, Canton ensures that each party only sees the parts of a
          transaction they are involved in.
        </p>

        <div className="bg-[#FFFBEB] dark:bg-amber-900/20 border border-[#FDE68A] dark:border-amber-800 rounded-xl p-5 mb-6">
          <h3 className="text-[14px] font-semibold text-[#92400E] dark:text-amber-300 mb-2">
            Privacy Guarantee Example
          </h3>
          <p className="text-[13px] text-[#92400E] dark:text-amber-300/80 leading-relaxed">
            When Alice rebalances her portfolio, the following privacy rules apply:
          </p>
          <ul className="mt-2 space-y-1 text-[13px] text-[#92400E] dark:text-amber-300/80">
            <li>&bull; <strong>Alice</strong> sees: her full portfolio, swap details, new holdings</li>
            <li>&bull; <strong>Cantex DEX</strong> sees: only the specific swap leg it executes</li>
            <li>&bull; <strong>Other users</strong> see: nothing</li>
            <li>&bull; <strong>Roil platform</strong> sees: the portfolio contract update (as signatory)</li>
          </ul>
        </div>

        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed">
          This privacy model is enforced at the protocol level by Canton&rsquo;s synchronization domains.
          There is no way to &ldquo;peek&rdquo; at other parties&rsquo; transactions, even if you run your own participant node.
          The privacy guarantee is cryptographic, not policy-based.
        </p>
      </section>

      {/* Featured App Program */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] dark:bg-amber-900/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100">
            Featured App Program
          </h2>
        </div>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Roil is a participant in Canton Network&rsquo;s Featured App Rewards program. Applications
          that drive ledger activity receive CC (Canton Coin) rewards proportional to their transaction
          volume.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">
              How Rewards Flow
            </h3>
            <ul className="space-y-1.5 text-[13px] text-[#6B7280] dark:text-slate-400">
              <li>1. Canton measures Roil&rsquo;s monthly TX volume</li>
              <li>2. CC rewards allocated to Roil&rsquo;s platform party</li>
              <li>3. Roil distributes to users based on tier system</li>
              <li>4. Users receive CC fee rebates</li>
            </ul>
          </div>
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">
              Network Stats API
            </h3>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              Query Canton Network stats via
              <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[12px] font-mono">GET /api/market/network</code>.
              Returns open rounds, featured apps list, and current network configuration from the
              Canton Scan API.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
