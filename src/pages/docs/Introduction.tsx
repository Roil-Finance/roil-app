import { Link } from 'react-router-dom';
import { Rocket, Layers, Code2, Shield, TrendingUp, RefreshCw, Gift, PieChart, Network } from 'lucide-react';

const FEATURE_CARDS = [
  {
    icon: Rocket,
    title: 'Quick Start',
    description: 'Create a wallet and set up your first portfolio in under 5 minutes.',
    path: '/docs/quick-start',
    color: 'bg-[#059669]',
  },
  {
    icon: Layers,
    title: 'Architecture',
    description: 'Understand how Roil connects to Canton Network and Daml smart contracts.',
    path: '/docs/canton',
    color: 'bg-[#2563EB]',
  },
  {
    icon: Code2,
    title: 'API Reference',
    description: 'Full REST API documentation for integrating with the Roil backend.',
    path: '/docs/api',
    color: 'bg-[#7C3AED]',
  },
];

const KEY_FEATURES = [
  {
    icon: PieChart,
    title: 'Portfolio Management',
    desc: 'Create portfolios from 8 pre-built templates or build custom allocations across 9 tokenized assets including BTC, ETH, SOL, Gold, Silver, Bonds, Stablecoins, and Canton Coin.',
  },
  {
    icon: RefreshCw,
    title: 'Auto-Rebalancing',
    desc: 'Set drift thresholds (e.g. 5%) and Roil automatically rebalances your portfolio when allocations deviate. Smart Router picks the best DEX (Cantex AMM or Temple CLOB) for each swap.',
  },
  {
    icon: TrendingUp,
    title: 'DCA Strategies',
    desc: 'Schedule recurring buys at Hourly, Daily, Weekly, or Monthly intervals. Pause, resume, or cancel anytime. Track execution history per schedule.',
  },
  {
    icon: Gift,
    title: 'Reward Tiers & Referrals',
    desc: 'Earn fee rebates from 0.5% (Bronze) to 3.0% (Platinum) based on monthly transaction volume. Refer friends for additional 10% bonus on their fees.',
  },
  {
    icon: Shield,
    title: 'Privacy-First Security',
    desc: 'Ed25519 keypairs with AES-256-GCM encryption. WebAuthn/Passkey support. Canton Network sub-transaction privacy ensures portfolio details stay confidential.',
  },
  {
    icon: Network,
    title: 'Canton Network Native',
    desc: 'Built on Digital Asset\'s Canton Network with Daml smart contracts, CIP-0056 token standard, and Featured App Rewards integration.',
  },
];

export default function Introduction() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-[32px] lg:text-[40px] font-bold text-[#111827] dark:text-slate-100 leading-tight">
          Welcome to Roil Finance
        </h1>
        <p className="mt-3 text-[17px] text-[#6B7280] dark:text-slate-400 leading-relaxed max-w-[640px]">
          Automated portfolio rebalancing, DCA strategies, and reward tracking &mdash;
          powered by Canton Network&rsquo;s privacy-first blockchain.
        </p>
      </div>

      {/* Quick-link cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
        {FEATURE_CARDS.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="group rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-5 hover:border-[#059669] dark:hover:border-emerald-500 hover:shadow-sm transition-all bg-white dark:bg-slate-800"
          >
            <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 group-hover:text-[#059669] dark:group-hover:text-emerald-400 transition-colors">
              {card.title}
            </h3>
            <p className="mt-1 text-[13px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* What is Roil Finance */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          What is Roil Finance?
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Roil Finance is a private treasury management platform built on the Canton Network. It allows
          individuals and institutions to create diversified portfolios of tokenized assets, automate
          rebalancing based on configurable drift thresholds, and execute dollar-cost averaging strategies
          &mdash; all while maintaining sub-transaction privacy through Canton&rsquo;s unique architecture.
        </p>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          The platform supports 9 tokenized assets: Canton Coin (CC), USDCx, CBTC (tokenized Bitcoin),
          ETHx (tokenized Ethereum), SOLx (tokenized Solana), XAUt (tokenized Gold), XAGt (tokenized Silver),
          USTb (US Treasury Bonds), and MMF (Money Market Fund). Portfolios are represented as Daml contracts
          on the Canton ledger, with all trades routed through either Cantex (an AMM DEX) or Temple (a
          central-limit order book), selected automatically by Roil&rsquo;s Smart Router for best execution.
        </p>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed">
          A tiered reward system (Bronze through Platinum) incentivizes active management, distributing
          fee rebates monthly based on transaction volume. The referral program provides an additional
          10% bonus on referred users&rsquo; trading fees.
        </p>
      </section>

      {/* Key Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-6">
          Key Features
        </h2>
        <div className="space-y-5">
          {KEY_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="flex gap-4 p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-800/50"
            >
              <div className="w-10 h-10 rounded-lg bg-[#E0F5EA] dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <feat.icon className="w-5 h-5 text-[#059669] dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#111827] dark:text-slate-100 mb-1">
                  {feat.title}
                </h3>
                <p className="text-[14px] text-[#6B7280] dark:text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Canton? */}
      <section>
        <h2 className="text-2xl font-bold text-[#111827] dark:text-slate-100 mb-4">
          Why Canton Network?
        </h2>
        <p className="text-[15px] text-[#374151] dark:text-slate-300 leading-relaxed mb-4">
          Canton Network is Digital Asset&rsquo;s institutional-grade blockchain designed for regulated financial
          applications. It processes $4T+ per month in transaction volume and is backed by DTCC, Goldman Sachs,
          and Circle. Its unique sub-transaction privacy model means that only the parties involved in a
          specific contract interaction can see the details, unlike public blockchains where all data is visible.
        </p>
        <div className="bg-[#F0FDF4] dark:bg-emerald-900/20 border border-[#BBF7D0] dark:border-emerald-800 rounded-xl p-5">
          <h3 className="text-[14px] font-semibold text-[#059669] dark:text-emerald-400 mb-2">
            Canton Network Advantages
          </h3>
          <ul className="space-y-2 text-[14px] text-[#374151] dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <span><strong>Sub-transaction privacy:</strong> Portfolio holdings, trade details, and balances are only visible to authorized parties.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <span><strong>Daml smart contracts:</strong> Type-safe, composable contracts with built-in authorization and atomic multi-party transactions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <span><strong>Featured App Rewards:</strong> Canton&rsquo;s App Rewards program distributes incentives to apps based on ledger activity.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <span><strong>CIP-0056 token standard:</strong> Interoperable token holding and transfer standard across the Canton ecosystem.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <span><strong>JSON Ledger API v2:</strong> Modern HTTP/JSON interface for reading and writing to the ledger, replacing the older gRPC API.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
