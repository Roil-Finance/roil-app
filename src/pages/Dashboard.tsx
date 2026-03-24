import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw, TrendingUp, Trophy, Activity, Repeat2,
} from 'lucide-react';
import {
  ResponsiveContainer, Tooltip, Area, AreaChart, XAxis, YAxis,
  CartesianGrid, BarChart, Bar, Cell,
} from 'recharts';
import { TOKEN_LOGOS, ASSET_COLORS } from '@/config';
import { useParty } from '@/context/PartyContext';
import { usePortfolio, useDrift, usePerformance, useRebalance } from '@/hooks/usePortfolio';
import { useDCASchedules } from '@/hooks/useDCA';
import { useRewards } from '@/hooks/useRewards';
import { useMarketPrices } from '@/hooks/useMarket';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Format a number as USD currency string */
function fmtUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/** Format a number with commas and up to 4 decimal places */
function fmtAmount(n: number): string {
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

/** Drift severity label */
function driftLabel(drift: number): { text: string; className: string } {
  if (drift < 2) return { text: 'On target', className: 'bg-green-100 text-green-700' };
  if (drift < 5) return { text: 'Near threshold', className: 'bg-amber-100 text-amber-700' };
  return { text: 'Above threshold', className: 'bg-red-100 text-red-700' };
}

/** Reward tier color */
function tierColor(tier: string): string {
  switch (tier) {
    case 'Platinum': return '#7C3AED';
    case 'Gold': return '#D97706';
    case 'Silver': return '#6B7280';
    default: return '#B45309';
  }
}

/* ------------------------------------------------------------------ */
/* Skeleton pulse component                                            */
/* ------------------------------------------------------------------ */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type TimeTab = '1W' | '1M' | '1Y' | 'ALL';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TimeTab>('1W');
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);

  // ---- Get party from context ----
  const { party } = useParty();

  // ---- Fetch real data via hooks ----
  const { portfolio, portfolios, isLoading: portfolioLoading, refetch: refetchPortfolio } = usePortfolio(party);
  const { drift } = useDrift(portfolio);
  const { schedules, isLoading: dcaLoading } = useDCASchedules(party);
  const { stats: rewardStats, isLoading: rewardsLoading } = useRewards(party);
  const { priceMap, isLoading: pricesLoading } = useMarketPrices();
  const { data: perfData, isLoading: perfLoading } = usePerformance(party);
  const { mutate: triggerRebalance, isLoading: rebalancing } = useRebalance();

  // ---- Derived: total portfolio value in USD ----
  const totalValueUsd = useMemo(() => {
    if (!portfolio?.holdings) return 0;
    return portfolio.holdings.reduce((sum, h) => {
      const price = priceMap.get(h.asset.symbol) ?? 1;
      return sum + h.amount * price;
    }, 0);
  }, [portfolio, priceMap]);

  // ---- Derived: 24h change estimate from performance data ----
  const change24h = useMemo(() => {
    if (perfData?.summary?.change24h != null) {
      // change24h is a percentage; calculate dollar amount
      const changePct = perfData.summary.change24h;
      const dollarChange = (changePct / 100) * totalValueUsd;
      return { pct: changePct, usd: dollarChange };
    }
    return { pct: 0, usd: 0 };
  }, [perfData, totalValueUsd]);

  // ---- Derived: active DCA count ----
  const activeDcaCount = useMemo(() => {
    return schedules.filter((s) => s.isActive).length;
  }, [schedules]);

  // ---- Derived: allocation segments for donut chart ----
  const allocationSegments = useMemo(() => {
    if (!portfolio?.holdings || portfolio.holdings.length === 0) return [];
    const holdingsWithUsd = portfolio.holdings.map((h) => {
      const price = priceMap.get(h.asset.symbol) ?? 1;
      const usd = h.amount * price;
      return { symbol: h.asset.symbol, amount: h.amount, usd };
    });
    const total = holdingsWithUsd.reduce((s, h) => s + h.usd, 0);
    if (total === 0) return [];

    // Map of fallback colors for tokens
    const fallbackColors = ['#059669', '#06B6D4', '#6366F1', '#D97706', '#EC4899', '#F43F5E', '#8B5CF6', '#14B8A6', '#F59E0B'];

    return holdingsWithUsd.map((h, i) => ({
      token: h.symbol,
      pct: Math.round((h.usd / total) * 100),
      color: ASSET_COLORS[h.symbol] ?? fallbackColors[i % fallbackColors.length],
      amount: `${fmtAmount(h.amount)} ${h.symbol}`,
      usd: fmtUsd(h.usd),
    }));
  }, [portfolio, priceMap]);

  // ---- Derived: performance chart data ----
  const performanceChartData = useMemo(() => {
    if (perfData?.history && perfData.history.length > 0) {
      return perfData.history.map((snap) => {
        const d = new Date(snap.timestamp);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        return { day: label, value: snap.totalValueCc };
      });
    }
    // Use summary data as single-point fallback with synthetic week
    const current = perfData?.summary?.current ?? totalValueUsd;
    const change7d = perfData?.summary?.change7d ?? 0;
    const baseValue = current / (1 + change7d / 100);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      value: Math.round(baseValue + ((current - baseValue) * (i + 1)) / 7),
    }));
  }, [perfData, totalValueUsd]);

  // ---- Derived: volume chart data (from performance history deltas) ----
  const volumeChartData = useMemo(() => {
    if (perfData?.history && perfData.history.length > 1) {
      return perfData.history.map((snap, i, arr) => {
        const d = new Date(snap.timestamp);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const vol = i > 0 ? Math.abs(snap.totalValueCc - arr[i - 1].totalValueCc) : 0;
        return { day: label, vol };
      });
    }
    // Synthetic volume bars
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      vol: Math.round((totalValueUsd * 0.005 * (i + 1)) / 7) || (i + 1) * 10,
    }));
  }, [perfData, totalValueUsd]);

  // ---- Loading state ----
  const isMainLoading = portfolioLoading || pricesLoading;

  // ---- No portfolio state ----
  const hasNoPortfolio = !portfolioLoading && portfolios.length === 0;

  // ---- Drift severity ----
  const driftInfo = driftLabel(drift);
  const rewardTier = rewardStats.tier;
  const rewardRebate = rewardStats.feeRebatePct;
  const rewardColor = tierColor(rewardTier);

  if (hasNoPortfolio) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 font-['DM_Sans']">
        <div className="text-center">
          <h1 className="text-[26px] font-bold text-[#111827] dark:text-slate-100 mb-2">No Portfolio Yet</h1>
          <p className="text-[#6B7280] dark:text-slate-400 text-sm max-w-md">
            Create your first portfolio to start tracking performance, managing allocations, and earning rewards.
          </p>
        </div>
        <Link
          to="/create"
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-md"
        >
          Create Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full font-['DM_Sans']">
      {/* ---- Header row ---- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] dark:text-slate-100 leading-tight">
            Portfolio Overview
          </h1>
        </div>
        <button
          onClick={() => triggerRebalance({ id: party })}
          disabled={rebalancing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${rebalancing ? 'animate-spin' : ''}`} />
          {rebalancing ? 'Rebalancing...' : 'Rebalance Now'}
        </button>
      </div>

      {/* ---- 4 Stat cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Value"
          value={isMainLoading ? <Skeleton className="h-8 w-32" /> : fmtUsd(totalValueUsd)}
          sub={
            isMainLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className={`text-sm font-semibold ${change24h.usd >= 0 ? 'text-[#059669]' : 'text-[#E11D48]'}`}>
                {change24h.usd >= 0 ? '+' : ''}{fmtUsd(change24h.usd)} (24h)
              </span>
            )
          }
          icon={<TrendingUp className="w-5 h-5 text-[#059669]" />}
          iconBg="bg-[#E0F5EA]"
        />
        <StatCard
          label="Active DCA"
          value={dcaLoading ? <Skeleton className="h-8 w-12" /> : String(activeDcaCount)}
          sub={
            <div>
              <span className="text-sm text-[#6B7280] dark:text-slate-400">schedules</span>
              <div className="mt-1">
                <Link to="/dca" className="text-sm font-semibold text-[#059669] hover:underline">
                  View all &rarr;
                </Link>
              </div>
            </div>
          }
          icon={<Repeat2 className="w-5 h-5 text-[#6366F1]" />}
          iconBg="bg-[#E0E7FF]"
        />
        <StatCard
          label="Reward Tier"
          value={
            rewardsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span style={{ color: rewardColor }}>{rewardTier.toUpperCase()}</span>
            )
          }
          sub={
            rewardsLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <div>
                <span className="text-sm text-[#6B7280] dark:text-slate-400">{rewardRebate}% rebate</span>
                <div className="mt-1">
                  <Link to="/rewards" className="text-sm font-semibold hover:underline" style={{ color: rewardColor }}>
                    View rewards &rarr;
                  </Link>
                </div>
              </div>
            )
          }
          icon={<Trophy className="w-5 h-5 text-[#D97706]" />}
          iconBg="bg-[#FEF3C7]"
        />
        <StatCard
          label="Portfolio Drift"
          value={portfolioLoading ? <Skeleton className="h-8 w-16" /> : `${drift}%`}
          sub={
            portfolioLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${driftInfo.className}`}>
                {driftInfo.text}
              </span>
            )
          }
          icon={<Activity className="w-5 h-5 text-[#E11D48]" />}
          iconBg="bg-[#FFE4E6]"
        />
      </div>

      {/* ---- Content row: chart + allocation ---- */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* Performance chart */}
        <div className="flex-1 bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5 flex flex-col min-h-[350px]">
          {/* Chart header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100">Performance</h2>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded-lg p-1">
              {(['1W', '1M', '1Y', 'ALL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-[#059669] text-white'
                      : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Area chart */}
          <div className="flex-1 min-h-0">
            {perfLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#DDDEE6" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #D6D9E3',
                      borderRadius: '10px',
                      fontSize: '13px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#perfGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Volume bars */}
          <div className="h-[50px] mt-2">
            {perfLoading ? (
              <Skeleton className="h-full w-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="day" tick={false} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="vol" radius={[3, 3, 0, 0]}>
                    {volumeChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === volumeChartData.length - 1 ? '#059669' : '#D1D5DB'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Allocation panel */}
        <div className="w-full lg:w-[360px] bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5 flex flex-col">
          <h2 className="text-lg font-bold text-[#111827] dark:text-slate-100 mb-4">Allocation</h2>

          {isMainLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-[170px] h-[170px] rounded-full" />
              <div className="w-full flex flex-col gap-2.5">
                {[1, 2, 3].map((k) => (
                  <Skeleton key={k} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : allocationSegments.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <p className="text-[#6B7280] dark:text-slate-400 text-sm">No holdings yet</p>
            </div>
          ) : (
            <>
              {/* Donut chart — interactive hover */}
              <div className="flex justify-center mb-5">
                <div className="relative w-[170px] h-[170px]">
                  <div
                    className="w-full h-full rounded-full transition-all duration-200"
                    style={{
                      background: (() => {
                        let cursor = 0;
                        return `conic-gradient(${allocationSegments.map((a) => {
                          const start = cursor;
                          cursor += a.pct;
                          if (hoveredToken && hoveredToken !== a.token) {
                            const r = parseInt(a.color.slice(1, 3), 16);
                            const g = parseInt(a.color.slice(3, 5), 16);
                            const b = parseInt(a.color.slice(5, 7), 16);
                            return `rgba(${r},${g},${b},0.3) ${start}% ${cursor}%`;
                          }
                          return `${a.color} ${start}% ${cursor}%`;
                        }).join(', ')})`;
                      })(),
                    }}
                  />
                  {/* Mouse angle detection overlay */}
                  <div
                    className="absolute inset-0 rounded-full cursor-pointer"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left - rect.width / 2;
                      const y = e.clientY - rect.top - rect.height / 2;
                      const dist = Math.sqrt(x * x + y * y);
                      if (dist < 50 || dist > rect.width / 2) { setHoveredToken(null); return; }
                      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                      if (angle < 0) angle += 360;
                      let cum = 0;
                      for (const seg of allocationSegments) {
                        cum += seg.pct;
                        if ((angle / 360) * 100 <= cum) { setHoveredToken(seg.token); return; }
                      }
                    }}
                    onMouseLeave={() => setHoveredToken(null)}
                  />
                  {/* Center hole */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[100px] h-[100px] rounded-full bg-[#F3F4F9] dark:bg-slate-800 flex flex-col items-center justify-center">
                      {hoveredToken ? (
                        <>
                          <span className="text-[22px] font-[800] text-[#111827] dark:text-slate-100 leading-none">
                            {allocationSegments.find((s) => s.token === hoveredToken)?.pct}%
                          </span>
                          <span className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-0.5">{hoveredToken}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[28px] font-[800] text-[#111827] dark:text-slate-100 leading-none">{allocationSegments.length}</span>
                          <span className="text-xs text-[#6B7280] dark:text-slate-400">Assets</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset list */}
              <div className="flex flex-col gap-2.5 mt-1">
                {allocationSegments.map((a) => (
                  <div
                    key={a.token}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 transition-colors cursor-pointer"
                    style={{ backgroundColor: hoveredToken === a.token ? '#E8EBF2' : 'transparent' }}
                    onMouseEnter={() => setHoveredToken(a.token)}
                    onMouseLeave={() => setHoveredToken(null)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={TOKEN_LOGOS[a.token]}
                        alt={a.token}
                        className="w-[16px] h-[16px] rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-[#111827] dark:text-slate-100">
                        {a.token}
                      </span>
                      <span className="text-xs text-[#6B7280] dark:text-slate-400">
                        {a.amount} &middot; {a.usd}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: a.color }}
                    >
                      {a.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat Card                                                           */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ label, value, sub, icon, iconBg }: StatCardProps) {
  return (
    <div className="relative bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
      {/* Icon — top-right */}
      <div
        className={`absolute top-4 right-4 w-[42px] h-[42px] rounded-[10px] flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>

      <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-1">{label}</p>
      <p className="text-[28px] font-[800] text-[#111827] dark:text-slate-100 leading-tight">{value}</p>
      <div className="mt-1">{sub}</div>
    </div>
  );
}
