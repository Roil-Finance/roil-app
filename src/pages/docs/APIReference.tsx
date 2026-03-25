import { useState } from 'react';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Method badge colors                                                  */
/* ------------------------------------------------------------------ */

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-[#E0F5EA] text-[#059669] dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-[#DBEAFE] text-[#2563EB] dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-[#FEF3C7] text-[#D97706] dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-[#FEE2E2] text-[#EF4444] dark:bg-red-900/30 dark:text-red-400',
};

/* ------------------------------------------------------------------ */
/* Endpoint data                                                        */
/* ------------------------------------------------------------------ */

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  body?: string;
  response?: string;
}

interface EndpointGroup {
  name: string;
  endpoints: Endpoint[];
}

const API_GROUPS: EndpointGroup[] = [
  {
    name: 'Portfolio',
    endpoints: [
      {
        method: 'GET',
        path: '/api/portfolio/templates',
        description: 'List all available portfolio templates with pre-configured allocations.',
        auth: false,
        response: `{ "success": true, "data": [{ "id": "conservative", "name": "Conservative", "targets": [...], "triggerMode": { "tag": "DriftThreshold", "value": 3.0 } }] }`,
      },
      {
        method: 'GET',
        path: '/api/portfolio/system/config',
        description: 'Get platform configuration (network, supported assets, fee rate).',
        auth: false,
        response: `{ "success": true, "data": { "network": "devnet", "supportedAssets": ["CC","USDCx","CBTC",...], "platformFeeRate": 0.001 } }`,
      },
      {
        method: 'GET',
        path: '/api/portfolio/:party',
        description: 'Retrieve all portfolios visible to the given Canton party.',
        auth: true,
        response: `{ "success": true, "data": [{ "contractId": "00a1b2...", "platform": "roil::...", "user": "alice::...", "targets": [...], "holdings": [...], "triggerMode": {...}, "totalRebalances": 14, "isActive": true }] }`,
      },
      {
        method: 'POST',
        path: '/api/portfolio',
        description: 'Create a new portfolio. Creates a PortfolioProposal and accepts it.',
        auth: true,
        body: `{ "user": "alice::abc123...", "targets": [{ "asset": { "symbol": "CBTC", "admin": "Canton::Admin" }, "targetPct": 50 }, { "asset": { "symbol": "USDCx", "admin": "Canton::Admin" }, "targetPct": 50 }], "triggerMode": { "tag": "DriftThreshold", "value": 5.0 } }`,
        response: `{ "success": true, "data": { "contractId": "00c4a1...", "user": "alice::abc123...", "targets": [...], "triggerMode": {...} } }`,
      },
      {
        method: 'POST',
        path: '/api/portfolio/from-template',
        description: 'Create a portfolio from a pre-built template by ID.',
        auth: true,
        body: `{ "user": "alice::abc123...", "templateId": "balanced" }`,
      },
      {
        method: 'PUT',
        path: '/api/portfolio/:id/targets',
        description: 'Update target allocations for a specific portfolio. Must sum to 100%.',
        auth: true,
        body: `{ "newTargets": [{ "asset": { "symbol": "CBTC", "admin": "Canton::Admin" }, "targetPct": 60 }, { "asset": { "symbol": "USDCx", "admin": "Canton::Admin" }, "targetPct": 40 }] }`,
      },
      {
        method: 'PUT',
        path: '/api/portfolio/:id/trigger-mode',
        description: 'Change the trigger mode (Manual, DriftThreshold, PriceCondition).',
        auth: true,
        body: `{ "triggerMode": { "tag": "DriftThreshold", "value": 7.0 } }`,
      },
      {
        method: 'GET',
        path: '/api/portfolio/:id/drift',
        description: 'Check current drift of a portfolio from its target allocations.',
        auth: true,
        response: `{ "success": true, "data": { "maxDrift": 6.2, "drifts": { "CBTC": 6.2, "ETHx": -2.1 }, "needsRebalance": true } }`,
      },
      {
        method: 'POST',
        path: '/api/portfolio/:id/simulate',
        description: 'Dry-run rebalance showing planned swaps without executing.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/portfolio/:id/rebalance',
        description: 'Trigger a manual rebalance. Executes swaps via Smart Router.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/portfolio/:id/estimate-cost',
        description: 'Estimate transaction cost for a rebalance operation.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/portfolio/:id/history',
        description: 'Get rebalance log history for a portfolio.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/portfolio/:party/performance',
        description: 'Get performance summary (24h/7d/30d changes) and historical snapshots.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/portfolio/:id/deactivate',
        description: 'Pause a portfolio (stops auto-rebalancing).',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/portfolio/:id/activate',
        description: 'Resume a paused portfolio.',
        auth: true,
      },
      {
        method: 'DELETE',
        path: '/api/portfolio/:id',
        description: 'Archive a portfolio (deactivates permanently).',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/portfolio/:party/events',
        description: 'Server-Sent Events stream for real-time portfolio updates.',
        auth: true,
      },
    ],
  },
  {
    name: 'DCA',
    endpoints: [
      {
        method: 'GET',
        path: '/api/dca/:party',
        description: 'List all DCA schedules for a Canton party.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/dca',
        description: 'Create a new DCA schedule.',
        auth: true,
        body: `{ "user": "alice::abc123...", "sourceAsset": { "symbol": "USDCx", "admin": "Canton::Admin" }, "targetAsset": { "symbol": "CBTC", "admin": "Canton::Admin" }, "amountPerBuy": 100, "frequency": "Weekly" }`,
      },
      {
        method: 'PUT',
        path: '/api/dca/:id/amount',
        description: 'Update the buy amount for a DCA schedule.',
        auth: true,
        body: `{ "newAmount": 200 }`,
      },
      {
        method: 'PUT',
        path: '/api/dca/:id/frequency',
        description: 'Change the DCA execution frequency.',
        auth: true,
        body: `{ "newFrequency": "Daily" }`,
      },
      {
        method: 'POST',
        path: '/api/dca/:id/pause',
        description: 'Pause an active DCA schedule.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/dca/:id/resume',
        description: 'Resume a paused DCA schedule.',
        auth: true,
      },
      {
        method: 'DELETE',
        path: '/api/dca/:id',
        description: 'Cancel and archive a DCA schedule permanently.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/dca/:id/history',
        description: 'Get execution history for a specific DCA schedule.',
        auth: true,
      },
    ],
  },
  {
    name: 'Rewards',
    endpoints: [
      {
        method: 'GET',
        path: '/api/rewards/:party',
        description: 'Get current reward stats, tier, and TX count for a party.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/rewards/:party/history',
        description: 'Get reward payout history for a party.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/rewards/leaderboard',
        description: 'Privacy-preserving leaderboard of top 20 users by TX count.',
        auth: false,
      },
      {
        method: 'POST',
        path: '/api/rewards/referral',
        description: 'Create a referral linking two parties.',
        auth: true,
        body: `{ "referrer": "alice::abc...", "referee": "bob::def...", "referrerBonusPct": 10 }`,
      },
      {
        method: 'GET',
        path: '/api/rewards/:party/referrals',
        description: 'List all referrals for a party.',
        auth: true,
      },
    ],
  },
  {
    name: 'Market',
    endpoints: [
      {
        method: 'GET',
        path: '/api/market/prices',
        description: 'Get current prices of all supported assets with 24h change data.',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/pools',
        description: 'Get Cantex liquidity pool information (reserves, fees).',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/history/:asset',
        description: 'Get price history for an asset. Query param: hours (1-168).',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/convert',
        description: 'Convert amount between assets. Params: from, to, amount.',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/quote',
        description: 'Get a swap quote from Cantex without executing.',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/best-quote',
        description: 'Get the best quote across all DEXes (Cantex + Temple).',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/compare-quotes',
        description: 'Get quotes from all DEXes for side-by-side comparison.',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/dexes',
        description: 'List available DEXes and their current status.',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/orderbook',
        description: 'Get Temple CLOB orderbook depth. Params: from, to.',
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/market/network',
        description: 'Canton Network stats (open rounds, featured apps).',
        auth: false,
      },
    ],
  },
  {
    name: 'Transfers',
    endpoints: [
      {
        method: 'GET',
        path: '/api/transfers/:party/holdings',
        description: 'Get CIP-0056 token holdings for a Canton party.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/transfers/swap',
        description: 'Execute a token swap via the Smart Router.',
        auth: true,
        body: `{ "user": "alice::...", "sellAsset": "CC", "sellAmount": 100, "buyAsset": "USDCx", "expectedBuyAmount": 99.5 }`,
      },
      {
        method: 'POST',
        path: '/api/transfers/transfer',
        description: 'Transfer tokens between Canton parties.',
        auth: true,
        body: `{ "sender": "alice::...", "receiver": "bob::...", "instrumentId": "CC", "amount": 500, "memo": "Payment" }`,
      },
    ],
  },
  {
    name: 'Compound',
    endpoints: [
      {
        method: 'GET',
        path: '/api/compound/:party/yields',
        description: 'Get current yield summary including all yield sources and weighted APY.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/compound/:party/projected',
        description: 'Get projected yield sources without executing compound.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/compound/:party/execute',
        description: 'Trigger a manual compound for a party.',
        auth: true,
      },
    ],
  },
  {
    name: 'Admin',
    endpoints: [
      {
        method: 'PUT',
        path: '/api/admin/fee-rate',
        description: 'Update the platform fee rate. Admin auth required.',
        auth: true,
        body: `{ "feeRate": 0.001 }`,
      },
      {
        method: 'POST',
        path: '/api/admin/pause',
        description: 'Pause all platform operations. Emergency use only.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/admin/resume',
        description: 'Resume platform operations after pause.',
        auth: true,
      },
    ],
  },
  {
    name: 'System',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint. Returns 200 if the server is running.',
        auth: false,
        response: `{ "status": "ok", "uptime": 86400, "version": "1.0.0" }`,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Expandable Endpoint Card                                             */
/* ------------------------------------------------------------------ */

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const hasDetails = endpoint.body || endpoint.response;

  return (
    <div className="border border-[#E5E7EB] dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => hasDetails && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${hasDetails ? 'cursor-pointer hover:bg-[#FAFBFC] dark:hover:bg-slate-800/50' : 'cursor-default'} transition-colors`}
      >
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-[13px] font-mono text-[#111827] dark:text-slate-200 flex-1 truncate">
          {endpoint.path}
        </code>
        {endpoint.auth && (
          <Lock className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-slate-500 shrink-0" />
        )}
        {hasDetails && (
          open
            ? <ChevronDown className="w-4 h-4 text-[#9CA3AF] dark:text-slate-500 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-[#9CA3AF] dark:text-slate-500 shrink-0" />
        )}
      </button>
      <div className="px-4 pb-3 -mt-1">
        <p className="text-[13px] text-[#6B7280] dark:text-slate-400">{endpoint.description}</p>
      </div>
      {open && hasDetails && (
        <div className="border-t border-[#E5E7EB] dark:border-slate-700 p-4 space-y-3">
          {endpoint.body && (
            <div>
              <div className="text-[11px] font-semibold text-[#9CA3AF] dark:text-slate-500 uppercase tracking-wider mb-1">
                Request Body
              </div>
              <div className="bg-[#1E293B] rounded-lg p-3 overflow-x-auto">
                <pre className="text-green-400 font-mono text-[12px] leading-relaxed whitespace-pre">
                  {endpoint.body}
                </pre>
              </div>
            </div>
          )}
          {endpoint.response && (
            <div>
              <div className="text-[11px] font-semibold text-[#9CA3AF] dark:text-slate-500 uppercase tracking-wider mb-1">
                Response
              </div>
              <div className="bg-[#1E293B] rounded-lg p-3 overflow-x-auto">
                <pre className="text-green-400 font-mono text-[12px] leading-relaxed whitespace-pre">
                  {endpoint.response}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function APIReference() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        API Reference
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-6 max-w-[640px]">
        Complete REST API documentation for the Roil Finance backend. All endpoints return JSON
        wrapped in a <code className="px-1 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[13px] font-mono">{"{ success, data }"}</code> envelope.
      </p>

      {/* Auth section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Authentication
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Protected endpoints require a JWT in the Authorization header. Endpoints marked with a
          <Lock className="w-3.5 h-3.5 inline-block mx-1 text-[#9CA3AF]" />
          icon require authentication.
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`Authorization: Bearer <jwt-token>
Content-Type: application/json

// Base URL
https://api.roil.app   (production)
http://localhost:3001   (development)`}
          </pre>
        </div>

        <div className="flex items-center gap-6 text-[13px]">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${METHOD_COLORS.GET}`}>GET</span>
            <span className="text-[#6B7280] dark:text-slate-400">Read data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${METHOD_COLORS.POST}`}>POST</span>
            <span className="text-[#6B7280] dark:text-slate-400">Create / Action</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${METHOD_COLORS.PUT}`}>PUT</span>
            <span className="text-[#6B7280] dark:text-slate-400">Update</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${METHOD_COLORS.DELETE}`}>DELETE</span>
            <span className="text-[#6B7280] dark:text-slate-400">Remove</span>
          </div>
        </div>
      </section>

      {/* Endpoint groups */}
      <div className="space-y-10">
        {API_GROUPS.map((group) => (
          <section key={group.name}>
            <h2 className="text-xl font-bold text-[#111827] dark:text-slate-100 mb-4 pb-2 border-b border-[#E5E7EB] dark:border-slate-700">
              {group.name}
            </h2>
            <div className="space-y-2">
              {group.endpoints.map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
