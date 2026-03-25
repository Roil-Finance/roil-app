import { Link } from 'react-router-dom';
import { Wallet, PieChart, TrendingUp, Gift, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Wallet,
    title: 'Create Your Wallet',
    description: 'Roil supports four authentication methods. Choose the one that fits your security preferences:',
    details: [
      { method: 'Passkey (WebAuthn)', desc: 'Biometric authentication via your device\'s fingerprint sensor or Face ID. Most secure option with no password to remember.' },
      { method: 'Google OAuth', desc: 'Sign in with your existing Google account. Fast setup with familiar two-factor authentication.' },
      { method: 'Email + OTP', desc: 'Enter your email and verify with a one-time code. No password required, secure via email ownership proof.' },
      { method: 'Email + Password', desc: 'Traditional email/password combination. Password is client-side hashed with PBKDF2 before transmission.' },
    ],
  },
  {
    number: '02',
    icon: PieChart,
    title: 'Create Your First Portfolio',
    description: 'Choose from pre-built templates or build a fully custom allocation:',
    details: [
      { method: 'Templates', desc: 'BTC-ETH Maxi, Crypto Basket, Stablecoin Yield, and more. Each comes with pre-configured asset allocations and drift thresholds.' },
      { method: 'Build Your Own', desc: 'Select from 4 available assets (CC, USDCx, CBTC, ETHx), set individual allocation percentages using sliders, and configure your preferred trigger mode (Manual, Drift Threshold, or Price Condition).' },
    ],
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Set Up DCA',
    description: 'Automate recurring purchases to dollar-cost average into your target assets:',
    details: [
      { method: 'Pick a Pair', desc: 'Select source asset (e.g. USDCx) and target asset (e.g. CBTC). Source and target must be different.' },
      { method: 'Set Amount & Frequency', desc: 'Choose from quick-select amounts ($50, $100, $200, $500) or enter a custom amount. Schedule Hourly, Daily, Weekly, or Monthly executions.' },
      { method: 'Review & Confirm', desc: 'See projected investment totals for 1 month, 3 months, and 1 year before confirming the schedule.' },
    ],
  },
  {
    number: '04',
    icon: Gift,
    title: 'Monitor & Earn Rewards',
    description: 'Track your portfolio performance and earn fee rebates based on activity:',
    details: [
      { method: 'Dashboard', desc: 'Interactive donut chart showing allocation, performance graph with 24h/7d/30d views, drift tracking, and stat cards for total value, active DCA count, and reward tier.' },
      { method: 'Reward Tiers', desc: 'Bronze (0+ tx, 0.5% rebate), Silver (50+ tx, 1.0%), Gold (200+ tx, 2.0%), Platinum (500+ tx, 3.0%). Tier upgrades automatically based on monthly transaction count.' },
      { method: 'Referrals', desc: 'Share your referral link to earn 10% of referred users\' trading fees. Track active referrals and bonus payouts in the Rewards page.' },
    ],
  },
];

export default function QuickStart() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Quick Start Guide
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[600px]">
        Go from zero to a fully automated portfolio in under 5 minutes. Follow these four steps
        to get started with Roil.
      </p>

      {/* Info box */}
      <div className="bg-[#EFF6FF] dark:bg-blue-900/20 border border-[#BFDBFE] dark:border-blue-800 rounded-xl p-5 mb-10">
        <p className="text-[14px] text-[#1E40AF] dark:text-blue-300 leading-relaxed">
          <strong>Prerequisites:</strong> A modern web browser (Chrome, Firefox, Safari, or Edge) with
          JavaScript enabled. For Passkey authentication, your device must support WebAuthn (most devices
          manufactured after 2019).
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-10">
        {STEPS.map((step) => (
          <div key={step.number} className="relative">
            {/* Step header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] flex items-center justify-center shrink-0 shadow-sm">
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#059669] dark:text-emerald-400 tracking-wider mb-0.5">
                  STEP {step.number}
                </div>
                <h2 className="text-xl font-bold text-[#111827] dark:text-slate-100">
                  {step.title}
                </h2>
              </div>
            </div>

            <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4 ml-16">
              {step.description}
            </p>

            {/* Detail cards */}
            <div className="ml-16 space-y-3">
              {step.details.map((d) => (
                <div
                  key={d.method}
                  className="p-4 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50"
                >
                  <h4 className="text-[14px] font-semibold text-[#111827] dark:text-slate-100 mb-1">
                    {d.method}
                  </h4>
                  <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Next CTA */}
      <div className="mt-12">
        <Link
          to="/docs/create-wallet"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#059669] to-[#10B981] text-white text-[15px] font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          Next: Create Your Wallet
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
