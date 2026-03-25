import { FileCode, ArrowRightLeft, Gift, Shield, Coins } from 'lucide-react';

const CONTRACTS = [
  {
    name: 'Portfolio',
    icon: FileCode,
    module: 'Portfolio',
    color: 'bg-[#059669]',
    signatories: 'platform, user',
    choices: ['UpdateTargets', 'UpdateTriggerMode', 'DeactivatePortfolio', 'ActivatePortfolio'],
    description: 'Core contract representing a user\'s portfolio. Stores target allocations, current holdings, trigger mode, and rebalance count. Both platform and user are signatories.',
    fields: [
      { name: 'platform', type: 'Party', desc: 'Roil platform party' },
      { name: 'user', type: 'Party', desc: 'Portfolio owner' },
      { name: 'targets', type: '[TargetAllocation]', desc: 'Desired % allocation per asset' },
      { name: 'holdings', type: '[Holding]', desc: 'Current asset amounts and CC values' },
      { name: 'triggerMode', type: 'TriggerMode', desc: 'Manual | DriftThreshold | PriceCondition' },
      { name: 'totalRebalances', type: 'Int', desc: 'Lifetime rebalance counter' },
      { name: 'isActive', type: 'Bool', desc: 'Active/paused state' },
    ],
  },
  {
    name: 'DCASchedule',
    icon: ArrowRightLeft,
    module: 'DCA',
    color: 'bg-[#2563EB]',
    signatories: 'platform, user',
    choices: ['UpdateDCAAmount', 'UpdateDCAFrequency', 'PauseDCA', 'ResumeDCA', 'CancelDCA', 'ExecuteDCA'],
    description: 'Defines a recurring DCA buy schedule. The platform\'s DCA engine reads active schedules and executes buys at the configured frequency via the ExecuteDCA choice.',
    fields: [
      { name: 'sourceAsset', type: 'AssetId', desc: 'Asset spent (e.g. USDCx)' },
      { name: 'targetAsset', type: 'AssetId', desc: 'Asset purchased (e.g. CBTC)' },
      { name: 'amountPerBuy', type: 'Decimal', desc: 'Source amount per execution' },
      { name: 'frequency', type: 'DCAFrequency', desc: 'Hourly | Daily | Weekly | Monthly' },
      { name: 'totalExecutions', type: 'Int', desc: 'Number of completed buys' },
      { name: 'isActive', type: 'Bool', desc: 'Active/paused state' },
      { name: 'createdAt', type: 'Text', desc: 'ISO 8601 creation timestamp' },
    ],
  },
  {
    name: 'RewardTracker',
    icon: Gift,
    module: 'RewardTracker',
    color: 'bg-[#D97706]',
    signatories: 'platform',
    choices: ['IncrementTx', 'DistributeReward', 'ResetMonth'],
    description: 'Tracks per-user monthly transaction counts and tier status. Updated by the platform after each rebalance or DCA execution. Used to calculate reward payouts.',
    fields: [
      { name: 'user', type: 'Party', desc: 'Tracked user' },
      { name: 'monthId', type: 'Text', desc: 'Month identifier (e.g. "2026-03")' },
      { name: 'txCount', type: 'Int', desc: 'Transaction count this month' },
      { name: 'tier', type: 'RewardTier', desc: 'Current tier: Bronze | Silver | Gold | Platinum' },
      { name: 'consecutiveMonths', type: 'Int', desc: 'Months at current or higher tier' },
      { name: 'totalRewardsEarned', type: 'Decimal', desc: 'Lifetime reward total in CC' },
    ],
  },
  {
    name: 'TokenTransfer',
    icon: Coins,
    module: 'TokenTransfer',
    color: 'bg-[#7C3AED]',
    signatories: 'sender, receiver',
    choices: ['Execute', 'Cancel'],
    description: 'Represents a pending token transfer between two Canton parties. Both sender and receiver must be signatories. Implements the CIP-0056 token transfer pattern.',
    fields: [
      { name: 'sender', type: 'Party', desc: 'Transfer initiator' },
      { name: 'receiver', type: 'Party', desc: 'Transfer recipient' },
      { name: 'instrumentId', type: 'Text', desc: 'CIP-0056 instrument identifier' },
      { name: 'amount', type: 'Decimal', desc: 'Transfer amount' },
      { name: 'memo', type: 'Text', desc: 'Optional transfer memo' },
    ],
  },
  {
    name: 'Governance',
    icon: Shield,
    module: 'Governance',
    color: 'bg-[#EF4444]',
    signatories: 'platform',
    choices: ['UpdateFeeRate', 'PauseOperations', 'ResumeOperations', 'FreezeParty', 'UnfreezeParty'],
    description: 'Platform-level governance contract. Controls fee rates, operational status, and emergency freeze capabilities. Only the platform party can exercise governance choices.',
    fields: [
      { name: 'platform', type: 'Party', desc: 'Platform admin party' },
      { name: 'feeRate', type: 'Decimal', desc: 'Current platform fee rate' },
      { name: 'isPaused', type: 'Bool', desc: 'Global pause state' },
      { name: 'frozenParties', type: '[Party]', desc: 'List of frozen party IDs' },
    ],
  },
];

export default function DamlContracts() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Daml Contracts
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        Roil is built on Daml smart contracts running on the Canton Network. This section
        documents the core contract templates and their choices.
      </p>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Contract Overview
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-6">
          The platform consists of 6 primary contract templates, plus supporting contracts for
          proposals, logs, and referrals. All contracts follow the Canton Network best practice of
          explicit signatory and observer declarations.
        </p>

        {/* Contract cards */}
        <div className="space-y-6">
          {CONTRACTS.map((c) => (
            <div key={c.name} className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-5 bg-[#F8F9FB] dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-700">
                <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center`}>
                  <c.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#111827] dark:text-slate-100">{c.name}</h3>
                  <span className="text-[12px] text-[#9CA3AF] dark:text-slate-500 font-mono">module {c.module}</span>
                </div>
                <span className="text-[11px] font-medium text-[#6B7280] dark:text-slate-400 bg-[#F1F5F9] dark:bg-slate-700 px-2 py-1 rounded">
                  signatories: {c.signatories}
                </span>
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-[14px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
                  {c.description}
                </p>

                {/* Fields table */}
                <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] dark:border-slate-700 mb-4">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-[#F8F9FB] dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-700">
                        <th className="px-3 py-2 font-semibold text-[#6B7280] dark:text-slate-400">Field</th>
                        <th className="px-3 py-2 font-semibold text-[#6B7280] dark:text-slate-400">Type</th>
                        <th className="px-3 py-2 font-semibold text-[#6B7280] dark:text-slate-400">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.fields.map((f) => (
                        <tr key={f.name} className="border-b border-[#E5E7EB] dark:border-slate-700 last:border-0">
                          <td className="px-3 py-2 font-mono text-[#111827] dark:text-slate-200">{f.name}</td>
                          <td className="px-3 py-2 font-mono text-[#059669] dark:text-emerald-400">{f.type}</td>
                          <td className="px-3 py-2 text-[#6B7280] dark:text-slate-400">{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Choices */}
                <div>
                  <span className="text-[12px] font-semibold text-[#9CA3AF] dark:text-slate-500 uppercase tracking-wider">
                    Choices
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.choices.map((choice) => (
                      <span
                        key={choice}
                        className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] dark:bg-slate-700 text-[12px] font-mono text-[#374151] dark:text-slate-300"
                      >
                        {choice}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CIP-0056 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          CIP-0056 Compliance
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Roil&rsquo;s token handling follows the Canton Improvement Proposal 0056 (CIP-0056) standard
          for fungible token settlements. This ensures interoperability with other Canton applications
          and DEXes that implement the same standard.
        </p>
        <div className="bg-[#EFF6FF] dark:bg-blue-900/20 border border-[#BFDBFE] dark:border-blue-800 rounded-xl p-5">
          <h3 className="text-[14px] font-semibold text-[#1E40AF] dark:text-blue-300 mb-2">
            CIP-0056 Key Concepts
          </h3>
          <ul className="space-y-2 text-[14px] text-[#374151] dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0" />
              <span><strong>Instrument:</strong> Defines a token type (e.g. CC, USDCx, CBTC) with its admin party and metadata.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0" />
              <span><strong>Holding:</strong> Represents ownership of an amount of an instrument by a party.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0" />
              <span><strong>TransferPreapproval:</strong> Allows a party to pre-approve incoming transfers, enabling atomic settlement.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0" />
              <span><strong>Settlement:</strong> Atomic multi-leg settlement of transfers between parties.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Featured App Rewards */}
      <section>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Featured App Rewards
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Roil participates in Canton Network&rsquo;s Featured App Rewards program. This program
          distributes CC (Canton Coin) rewards to applications based on their ledger activity volume.
          The rewards flow from Canton &rarr; Roil Platform &rarr; Users through the RewardTracker system.
        </p>
        <div className="bg-[#1E293B] rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`-- Reward flow
Canton Network App Rewards
  → Roil platform party receives CC allocation
    → RewardTracker.DistributeReward choice
      → RewardPayout contract created per eligible user
        → User receives CC based on tier rebate %

-- Monthly distribution cycle
1. Canton distributes app rewards (based on ledger TX volume)
2. Roil calculates per-user rebates from RewardTracker data
3. DistributeReward creates RewardPayout contracts
4. Users can query payouts via GET /api/rewards/:party/history`}
          </pre>
        </div>
      </section>
    </div>
  );
}
