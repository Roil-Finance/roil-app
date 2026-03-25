import { Award, Crown, Gem, Users, Calendar, Trophy } from 'lucide-react';

const TIERS = [
  {
    name: 'Bronze',
    icon: Award,
    txReq: '0+',
    rebate: '0.5%',
    color: 'bg-[#FEF3C7] text-[#92400E] dark:bg-amber-900/30 dark:text-amber-400',
    iconBg: 'bg-[#FEF3C7] dark:bg-amber-900/30',
    iconColor: 'text-[#92400E] dark:text-amber-400',
    description: 'Starting tier for all new users. Begin earning fee rebates from your first transaction.',
  },
  {
    name: 'Silver',
    icon: Award,
    txReq: '50+',
    rebate: '1.0%',
    color: 'bg-[#F1F5F9] text-[#64748B] dark:bg-slate-700 dark:text-slate-300',
    iconBg: 'bg-[#F1F5F9] dark:bg-slate-700',
    iconColor: 'text-[#64748B] dark:text-slate-400',
    description: 'Reached after 50 monthly transactions. Double the rebate rate of Bronze.',
  },
  {
    name: 'Gold',
    icon: Crown,
    txReq: '200+',
    rebate: '2.0%',
    color: 'bg-[#FFFBEB] text-[#D97706] dark:bg-amber-900/30 dark:text-amber-400',
    iconBg: 'bg-[#FEF3C7] dark:bg-amber-900/30',
    iconColor: 'text-[#D97706] dark:text-amber-400',
    description: 'Active traders with 200+ monthly transactions. Significant fee savings on every trade.',
  },
  {
    name: 'Platinum',
    icon: Gem,
    txReq: '500+',
    rebate: '3.0%',
    color: 'bg-[#EDE9FE] text-[#7C3AED] dark:bg-violet-900/30 dark:text-violet-400',
    iconBg: 'bg-[#EDE9FE] dark:bg-violet-900/30',
    iconColor: 'text-[#7C3AED] dark:text-violet-400',
    description: 'Top-tier users with maximum fee rebates. Highest priority for new feature access.',
  },
];

export default function RewardsReferrals() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Rewards & Referrals
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        Earn fee rebates based on your monthly transaction activity. Climb the tier ladder from
        Bronze to Platinum and invite friends for bonus rewards.
      </p>

      {/* Tier System */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-6">
          Tier System
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-6">
          Tiers are calculated monthly based on your total transaction count. Each rebalance and DCA
          execution counts as one transaction. Tier upgrades are automatic and take effect immediately.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${tier.iconBg} flex items-center justify-center`}>
                  <tier.icon className={`w-5 h-5 ${tier.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827] dark:text-slate-100">{tier.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${tier.color}`}>
                    {tier.txReq} transactions
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-3">
                {tier.description}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[12px] text-[#9CA3AF] dark:text-slate-500">Fee Rebate</span>
                <span className="text-[16px] font-bold text-[#059669] dark:text-emerald-400">{tier.rebate}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#1E293B] rounded-lg p-4 mt-6 overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre">
{`-- Daml tier calculation (RewardTracker module)
getTier : Int -> RewardTier
getTier txCount
  | txCount >= 500 = Platinum
  | txCount >= 200 = Gold
  | txCount >= 50  = Silver
  | otherwise      = Bronze

-- Fee rebate percentages
getFeeRebatePct : RewardTier -> Decimal
getFeeRebatePct Bronze   = 0.5
getFeeRebatePct Silver   = 1.0
getFeeRebatePct Gold     = 2.0
getFeeRebatePct Platinum = 3.0`}
          </pre>
        </div>
      </section>

      {/* Fee Rebates */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Fee Rebates
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Fee rebates are calculated as a percentage of the platform fee on each transaction.
          For example, if the platform fee is 0.1% and you are Gold tier (2.0% rebate), you get
          back 2.0% of the 0.1% fee on every trade.
        </p>
        <div className="bg-[#EFF6FF] dark:bg-blue-900/20 border border-[#BFDBFE] dark:border-blue-800 rounded-xl p-5">
          <p className="text-[14px] text-[#1E40AF] dark:text-blue-300 leading-relaxed">
            <strong>Example:</strong> You execute a $10,000 swap with a 0.1% platform fee ($10).
            As a Gold tier user with 2.0% rebate, you receive $0.20 back. Over hundreds of trades per
            month, this adds up significantly.
          </p>
        </div>
      </section>

      {/* Monthly Distribution */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Monthly Distribution
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Reward payouts are distributed monthly. The system creates a
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">RewardPayout</code> contract
          for each eligible user at the end of each month.
        </p>

        <div className="flex items-start gap-4 p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
          <Calendar className="w-6 h-6 text-[#2563EB] dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">
              Distribution Timeline
            </h3>
            <ul className="space-y-1.5 text-[14px] text-[#6B7280] dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
                <span>Month closes on the last day at 23:59 UTC</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
                <span>Rebate calculations finalized within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
                <span>RewardPayout contracts created on the ledger</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
                <span>Payout credited to your Canton CC balance</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Referral Program */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Referral Program
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Invite friends to Roil and earn a percentage bonus on their trading fees. The referral
          system is managed through Daml
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">Referral</code> and
          <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">ReferralCredit</code> contracts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <Users className="w-6 h-6 text-[#059669] dark:text-emerald-400 mb-3" />
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-2">How It Works</h3>
            <ul className="space-y-1.5 text-[13px] text-[#6B7280] dark:text-slate-400">
              <li>1. Share your unique referral link</li>
              <li>2. Friend signs up through your link</li>
              <li>3. A Referral contract is created linking you as referrer</li>
              <li>4. You earn 10% of their trading fees as bonus</li>
            </ul>
          </div>
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="bg-[#1E293B] rounded-lg p-3 overflow-x-auto">
              <pre className="text-green-400 font-mono text-[12px] leading-relaxed whitespace-pre">
{`POST /api/rewards/referral

{
  "referrer": "alice::abc...",
  "referee": "bob::def...",
  "referrerBonusPct": 10
}

// List your referrals:
GET /api/rewards/:party/referrals`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Leaderboard
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          The privacy-preserving leaderboard shows the top 20 users by transaction count. Party
          identifiers are anonymized to protect user privacy while still enabling competitive motivation.
        </p>
        <div className="flex items-start gap-4 p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50">
          <Trophy className="w-6 h-6 text-[#D97706] dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] text-[#374151] dark:text-slate-300 leading-relaxed">
              Access the leaderboard via
              <code className="px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-slate-700 text-[#059669] dark:text-emerald-400 text-[13px] font-mono">GET /api/rewards/leaderboard</code>.
              Each entry includes rank, anonymized user ID (base64url-truncated party), tier, and transaction count.
              No real party identifiers are ever exposed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
