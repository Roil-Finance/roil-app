import { CheckCircle2, Loader2, Clock, Rocket } from 'lucide-react';

const PHASES = [
  {
    name: 'Phase 1: LocalNet',
    status: 'completed' as const,
    icon: CheckCircle2,
    color: 'text-[#059669] dark:text-emerald-400',
    bg: 'bg-[#E0F5EA] dark:bg-emerald-900/30',
    borderColor: 'border-[#059669] dark:border-emerald-600',
    period: 'Q4 2025',
    description: 'Core platform development and local Canton Network testing.',
    items: [
      { label: 'Daml smart contracts (Portfolio, DCA, RewardTracker, TokenTransfer, Governance)', done: true },
      { label: 'Express backend with JSON Ledger API v2 integration', done: true },
      { label: 'React frontend with 12 pages and full UI', done: true },
      { label: 'Three.js landing page with 3D morphing animations', done: true },
      { label: 'Cantex AMM DEX integration', done: true },
      { label: 'Smart Router (Cantex + Temple DEX aggregation)', done: true },
      { label: 'Reward tier system (Bronze through Platinum)', done: true },
      { label: 'Referral program with Daml contract tracking', done: true },
      { label: '8 portfolio templates with configurable allocations', done: true },
      { label: 'Real-time SSE event stream for portfolio updates', done: true },
      { label: 'Price Oracle with caching and 24h change tracking', done: true },
      { label: 'Auto-compound engine (portfolio-targets, same-asset, usdc-only)', done: true },
      { label: 'Admin dashboard with fee management and emergency controls', done: true },
      { label: 'CIP-0056 compliant token handling', done: true },
    ],
  },
  {
    name: 'Phase 2: DevNet',
    status: 'in-progress' as const,
    icon: Loader2,
    color: 'text-[#2563EB] dark:text-blue-400',
    bg: 'bg-[#DBEAFE] dark:bg-blue-900/30',
    borderColor: 'border-[#2563EB] dark:border-blue-600',
    period: 'Q1 2026',
    description: 'Deploy to Canton DevNet and integrate real authentication.',
    items: [
      { label: 'Deploy Daml contracts to Canton DevNet', done: true },
      { label: 'WebAuthn/Passkey authentication', done: false },
      { label: 'Google OAuth 2.0 integration', done: false },
      { label: 'Email + OTP passwordless flow', done: false },
      { label: 'JWT auth middleware with party-scoped permissions', done: true },
      { label: 'Connect frontend hooks to live backend API', done: false },
      { label: 'Documentation site (you are here)', done: true },
      { label: 'Ed25519 keystore with AES-256-GCM encryption', done: false },
      { label: 'Canton Scan API integration for network stats', done: true },
      { label: 'Vercel deployment with custom domain (roil.app)', done: true },
    ],
  },
  {
    name: 'Phase 3: TestNet',
    status: 'planned' as const,
    icon: Clock,
    color: 'text-[#D97706] dark:text-amber-400',
    bg: 'bg-[#FEF3C7] dark:bg-amber-900/30',
    borderColor: 'border-[#D97706] dark:border-amber-600',
    period: 'Q2 2026',
    description: 'Public testnet launch with community testing and feedback.',
    items: [
      { label: 'Deploy to Canton TestNet (Global Synchronizer)', done: false },
      { label: 'Public beta access with testnet CC tokens', done: false },
      { label: 'Temple CLOB orderbook integration (live)', done: false },
      { label: 'Mobile-responsive PWA', done: false },
      { label: 'Transaction history export (CSV/PDF)', done: false },
      { label: 'Multi-portfolio support per user', done: false },
      { label: 'Advanced charting (candlestick, depth chart)', done: false },
      { label: 'Rate limiting and DDoS protection', done: false },
      { label: 'Security audit by third party', done: false },
      { label: 'Community Discord and support channels', done: false },
    ],
  },
  {
    name: 'Phase 4: MainNet',
    status: 'future' as const,
    icon: Rocket,
    color: 'text-[#7C3AED] dark:text-violet-400',
    bg: 'bg-[#EDE9FE] dark:bg-violet-900/30',
    borderColor: 'border-[#7C3AED] dark:border-violet-600',
    period: 'Q3-Q4 2026',
    description: 'Production launch on Canton MainNet with real assets.',
    items: [
      { label: 'Canton MainNet deployment', done: false },
      { label: 'Featured App Rewards program participation', done: false },
      { label: 'Real tokenized assets (USDC, wBTC, wETH)', done: false },
      { label: 'Institutional onboarding flow', done: false },
      { label: 'Governance token (if applicable)', done: false },
      { label: 'Cross-domain settlement (multi-domain swaps)', done: false },
      { label: 'API rate-limited SDK for third-party integrations', done: false },
      { label: 'Portfolio sharing and social features', done: false },
      { label: 'Advanced DCA strategies (value averaging, smart accumulation)', done: false },
      { label: 'iOS and Android native apps', done: false },
    ],
  },
];

const STATUS_LABELS = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  planned: 'Planned',
  future: 'Future',
};

export default function Roadmap() {
  return (
    <div>
      <h1 className="text-[32px] lg:text-[36px] font-bold text-[#111827] dark:text-slate-100 mb-3">
        Roadmap
      </h1>
      <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-relaxed mb-10 max-w-[640px]">
        Roil Finance development roadmap from local testing through production deployment on
        Canton MainNet.
      </p>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#E5E7EB] dark:bg-slate-700 hidden sm:block" />

        <div className="space-y-10">
          {PHASES.map((phase, phaseIndex) => (
            <div key={phase.name} className="relative">
              {/* Timeline dot */}
              <div className={`absolute left-4 w-5 h-5 rounded-full ${phase.bg} border-2 ${phase.borderColor} hidden sm:flex items-center justify-center z-10`}>
                <div className={`w-2 h-2 rounded-full ${phase.status === 'completed' ? 'bg-[#059669]' : phase.status === 'in-progress' ? 'bg-[#2563EB]' : 'bg-[#9CA3AF]'}`} />
              </div>

              {/* Card */}
              <div className="sm:ml-14">
                <div className={`rounded-xl border ${phase.status === 'in-progress' ? 'border-[#2563EB] dark:border-blue-600' : 'border-[#E5E7EB] dark:border-slate-700'} overflow-hidden`}>
                  {/* Header */}
                  <div className="flex items-center gap-3 p-5 bg-[#F8F9FB] dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-700">
                    <div className={`w-9 h-9 rounded-lg ${phase.bg} flex items-center justify-center`}>
                      <phase.icon className={`w-4 h-4 ${phase.color} ${phase.status === 'in-progress' ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[16px] font-bold text-[#111827] dark:text-slate-100">
                        {phase.name}
                      </h2>
                      <span className="text-[12px] text-[#9CA3AF] dark:text-slate-500">{phase.period}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      phase.status === 'completed'
                        ? 'bg-[#E0F5EA] text-[#059669] dark:bg-emerald-900/30 dark:text-emerald-400'
                        : phase.status === 'in-progress'
                          ? 'bg-[#DBEAFE] text-[#2563EB] dark:bg-blue-900/30 dark:text-blue-400'
                          : phase.status === 'planned'
                            ? 'bg-[#FEF3C7] text-[#D97706] dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-[#EDE9FE] text-[#7C3AED] dark:bg-violet-900/30 dark:text-violet-400'
                    }`}>
                      {STATUS_LABELS[phase.status]}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <p className="text-[14px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
                      {phase.description}
                    </p>

                    {/* Progress bar */}
                    {phase.items.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] text-[#9CA3AF] dark:text-slate-500">Progress</span>
                          <span className="text-[12px] font-medium text-[#374151] dark:text-slate-300">
                            {phase.items.filter((i) => i.done).length}/{phase.items.length}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#E5E7EB] dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              phase.status === 'completed'
                                ? 'bg-[#059669]'
                                : phase.status === 'in-progress'
                                  ? 'bg-[#2563EB]'
                                  : 'bg-[#9CA3AF]'
                            }`}
                            style={{ width: `${(phase.items.filter((i) => i.done).length / phase.items.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2">
                      {phase.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            item.done
                              ? 'border-[#059669] bg-[#059669] dark:border-emerald-500 dark:bg-emerald-500'
                              : 'border-[#D1D5DB] dark:border-slate-600'
                          }`}>
                            {item.done && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-[13px] leading-relaxed ${
                            item.done
                              ? 'text-[#6B7280] dark:text-slate-500 line-through'
                              : 'text-[#374151] dark:text-slate-300'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
