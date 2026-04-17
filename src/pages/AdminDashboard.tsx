import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Server, Database, Wifi, WifiOff, Shield, ShieldAlert, ShieldOff,
  RefreshCw, Zap, BarChart3, Users, Repeat2, Gift, TrendingUp, TrendingDown,
  Clock, AlertTriangle, CheckCircle2, XCircle, Loader2, Globe, Layers,
} from 'lucide-react';
import { useQuery } from '@/hooks/useApi';

/* ------------------------------------------------------------------ */
/* Types for backend responses                                         */
/* ------------------------------------------------------------------ */

interface HealthCheck {
  status: string;
  timestamp: string;
  network: string;
  checks: {
    server: { status: string; uptime?: number };
    ledger: { status: string; latency?: number };
    cantex: { status: string; latency?: number };
  };
}

interface Metrics {
  dcaExecuted: number;
  rewardDistributed: number;
  rebalanceAttempted: number;
  activePortfolios: number;
  activeDcaSchedules: number;
  circuitBreakerState: string;
}

interface TokenPrice {
  symbol: string;
  priceUsd: number;
  change24h: number;
  volume24h?: number;
  confidence: string;
}

interface DexInfo {
  name: string;
  status: string;
  latency?: number;
  pairs?: number;
}

interface LeaderboardEntry {
  rank: number;
  anonymousId: string;
  txCount: number;
  tier: string;
}

interface NetworkInfo {
  openRounds: number;
  featuredApps: number;
  connectivity: string;
}

/* ------------------------------------------------------------------ */
/* Auto-refresh hook                                                    */
/* ------------------------------------------------------------------ */

function useAutoRefresh(intervalMs: number) {
  const [tick, setTick] = useState(0);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    Math.floor(intervalMs / 1000),
  );

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          setTick((t) => t + 1);
          return Math.floor(intervalMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [intervalMs]);

  return { tick, secondsUntilRefresh };
}

/* ------------------------------------------------------------------ */
/* Helper components                                                    */
/* ------------------------------------------------------------------ */

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-[#E5E7EB] animate-pulse rounded ${className ?? ''}`} />
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'healthy' || status === 'ok' || status === 'connected' || status === 'Closed'
      ? 'bg-[#16A34A]'
      : status === 'degraded' || status === 'Half-Open' || status === 'slow'
        ? 'bg-[#D97706]'
        : 'bg-[#DC2626]';
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}
      />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

function formatUptime(seconds?: number): string {
  if (!seconds) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getOverallStatus(health: HealthCheck | null): 'Healthy' | 'Degraded' | 'Down' {
  if (!health) return 'Down';
  const checks = health.checks;
  const statuses = [checks.server?.status, checks.ledger?.status, checks.cantex?.status];
  if (statuses.every((s) => s === 'ok' || s === 'healthy' || s === 'connected')) return 'Healthy';
  if (statuses.some((s) => s === 'ok' || s === 'healthy' || s === 'connected')) return 'Degraded';
  return 'Down';
}

/* ------------------------------------------------------------------ */
/* Main Component                                                       */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const { tick, secondsUntilRefresh } = useAutoRefresh(10_000);

  // Queries — all re-fetch when tick changes (every 10s)
  const healthQuery = useQuery<HealthCheck>('/health', [tick]);
  const metricsQuery = useQuery<Metrics>('/metrics/json', [tick]);
  const pricesQuery = useQuery<TokenPrice[]>('/api/market/prices', [tick]);
  const dexQuery = useQuery<DexInfo[]>('/api/market/dexes', [tick]);
  const leaderboardQuery = useQuery<LeaderboardEntry[]>('/api/rewards/leaderboard', [tick]);
  const networkQuery = useQuery<NetworkInfo>('/api/market/network', [tick]);

  const health = healthQuery.data;
  const metrics = metricsQuery.data;
  const prices = pricesQuery.data;
  const dexes = dexQuery.data;
  const leaderboard = leaderboardQuery.data;
  const network = networkQuery.data;

  const overallStatus = getOverallStatus(health);

  const isAnyLoading =
    healthQuery.isLoading &&
    metricsQuery.isLoading &&
    !health &&
    !metrics;

  const handleRefreshAll = useCallback(() => {
    healthQuery.refetch();
    metricsQuery.refetch();
    pricesQuery.refetch();
    dexQuery.refetch();
    leaderboardQuery.refetch();
    networkQuery.refetch();
  }, [healthQuery, metricsQuery, pricesQuery, dexQuery, leaderboardQuery, networkQuery]);

  return (
    <div className="space-y-6 font-['DM_Sans']">
      {/* ---------------------------------------------------------- */}
      {/* Header                                                      */}
      {/* ---------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] leading-tight">
            Admin Dashboard
          </h1>
          <p className="text-[15px] text-[#6B7280] mt-1">
            Platform metrics, system health, and operational data
          </p>
        </div>

        {/* Auto-refresh indicator + manual refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
            <Clock className="w-3.5 h-3.5" />
            <span>Refresh in {secondsUntilRefresh}s</span>
          </div>
          <button
            onClick={handleRefreshAll}
            disabled={isAnyLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#059669] to-[#10B981] hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 1. System Health Banner                                      */}
      {/* ---------------------------------------------------------- */}
      <div
        className={`rounded-[14px] border p-5 ${
          overallStatus === 'Healthy'
            ? 'bg-[#F0FDF4] border-[#BBF7D0]'
            : overallStatus === 'Degraded'
              ? 'bg-[#FFFBEB] border-[#FDE68A]'
              : 'bg-[#FEF2F2] border-[#FECACA]'
        }`}
      >
        {healthQuery.isLoading && !health ? (
          <div className="flex items-center gap-4">
            <SkeletonBlock className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="w-40 h-5" />
              <SkeletonBlock className="w-72 h-4" />
            </div>
          </div>
        ) : healthQuery.error && !health ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center">
                <XCircle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#DC2626]">System Unreachable</p>
                <p className="text-[13px] text-[#9CA3AF] mt-0.5">
                  Cannot connect to backend — {healthQuery.error}
                </p>
              </div>
            </div>
            <button
              onClick={() => healthQuery.refetch()}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-white border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Status label */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  overallStatus === 'Healthy'
                    ? 'bg-[#DCFCE7]'
                    : overallStatus === 'Degraded'
                      ? 'bg-[#FEF3C7]'
                      : 'bg-[#FEE2E2]'
                }`}
              >
                {overallStatus === 'Healthy' ? (
                  <Shield className="w-5 h-5 text-[#16A34A]" />
                ) : overallStatus === 'Degraded' ? (
                  <ShieldAlert className="w-5 h-5 text-[#D97706]" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-[#DC2626]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <StatusDot status={overallStatus === 'Healthy' ? 'ok' : overallStatus === 'Degraded' ? 'degraded' : 'down'} />
                  <p
                    className={`text-[16px] font-bold ${
                      overallStatus === 'Healthy'
                        ? 'text-[#16A34A]'
                        : overallStatus === 'Degraded'
                          ? 'text-[#D97706]'
                          : 'text-[#DC2626]'
                    }`}
                  >
                    System {overallStatus}
                  </p>
                </div>
                <p className="text-[13px] text-[#6B7280] mt-0.5">
                  Network: {health?.network ?? 'Unknown'} | Last check:{' '}
                  {health?.timestamp
                    ? new Date(health.timestamp).toLocaleTimeString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Individual checks */}
            <div className="flex items-center gap-5">
              {/* Server */}
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#6B7280]" />
                <div>
                  <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">Server</p>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={health?.checks?.server?.status ?? 'down'} />
                    <span className="text-[13px] font-medium text-[#111827]">
                      {formatUptime(health?.checks?.server?.uptime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ledger */}
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6B7280]" />
                <div>
                  <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">Ledger</p>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={health?.checks?.ledger?.status ?? 'down'} />
                    <span className="text-[13px] font-medium text-[#111827]">
                      {health?.checks?.ledger?.latency != null
                        ? `${health.checks.ledger.latency}ms`
                        : health?.checks?.ledger?.status ?? 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cantex */}
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6B7280]" />
                <div>
                  <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">Cantex</p>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={health?.checks?.cantex?.status ?? 'down'} />
                    <span className="text-[13px] font-medium text-[#111827]">
                      {health?.checks?.cantex?.latency != null
                        ? `${health.checks.cantex.latency}ms`
                        : health?.checks?.cantex?.status ?? 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 2. Key Metrics Cards                                         */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricsQuery.isLoading && !metrics ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5"
            >
              <SkeletonBlock className="w-20 h-3 mb-3" />
              <SkeletonBlock className="w-14 h-7 mb-2" />
              <SkeletonBlock className="w-24 h-3" />
            </div>
          ))
        ) : metricsQuery.error && !metrics ? (
          <div className="col-span-full bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] p-5 text-center">
            <AlertTriangle className="w-6 h-6 text-[#D97706] mx-auto mb-2" />
            <p className="text-[14px] text-[#6B7280]">Failed to load metrics</p>
            <button
              onClick={() => metricsQuery.refetch()}
              className="mt-2 text-[13px] font-medium text-[#059669] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <MetricCard
              label="Active Portfolios"
              value={metrics?.activePortfolios ?? 0}
              icon={<BarChart3 className="w-5 h-5 text-[#6366F1]" />}
              iconBg="bg-[#E0E7FF]"
            />
            <MetricCard
              label="Active DCA Schedules"
              value={metrics?.activeDcaSchedules ?? 0}
              icon={<Repeat2 className="w-5 h-5 text-[#059669]" />}
              iconBg="bg-[#E0F5EA]"
            />
            <MetricCard
              label="DCA Executed"
              value={metrics?.dcaExecuted ?? 0}
              icon={<Zap className="w-5 h-5 text-[#D97706]" />}
              iconBg="bg-[#FEF3C7]"
            />
            <MetricCard
              label="Rewards Distributed"
              value={metrics?.rewardDistributed ?? 0}
              icon={<Gift className="w-5 h-5 text-[#EC4899]" />}
              iconBg="bg-[#FCE7F3]"
            />
            <MetricCard
              label="Rebalances"
              value={metrics?.rebalanceAttempted ?? 0}
              icon={<RefreshCw className="w-5 h-5 text-[#06B6D4]" />}
              iconBg="bg-[#CFFAFE]"
            />
            <CircuitBreakerCard state={metrics?.circuitBreakerState ?? 'Unknown'} />
          </>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 3. DEX Status + 6. Canton Network (side by side)             */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* DEX Status */}
        <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
          <h2 className="text-lg font-bold text-[#111827] mb-4">DEX Status</h2>
          {dexQuery.isLoading && !dexes ? (
            <div className="space-y-3">
              <SkeletonBlock className="w-full h-16" />
              <SkeletonBlock className="w-full h-16" />
            </div>
          ) : dexQuery.error && !dexes ? (
            <ErrorRetry message="Failed to load DEX status" onRetry={() => dexQuery.refetch()} />
          ) : dexes && dexes.length > 0 ? (
            <div className="space-y-3">
              {dexes.map((dex) => (
                <div
                  key={dex.name}
                  className="flex items-center justify-between bg-white rounded-xl border border-[#D6D9E3] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        dex.status === 'connected' || dex.status === 'ok' || dex.status === 'available'
                          ? 'bg-[#E0F5EA]'
                          : 'bg-[#FFE4E6]'
                      }`}
                    >
                      {dex.status === 'connected' || dex.status === 'ok' || dex.status === 'available' ? (
                        <Wifi className="w-4 h-4 text-[#059669]" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-[#E11D48]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#111827]">{dex.name}</p>
                      {dex.latency != null && (
                        <p className="text-[12px] text-[#9CA3AF]">Latency: {dex.latency}ms</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      dex.status === 'connected' || dex.status === 'ok' || dex.status === 'available'
                        ? 'bg-[#E0F5EA] text-[#059669]'
                        : 'bg-[#FFE4E6] text-[#E11D48]'
                    }`}
                  >
                    {dex.status === 'connected' || dex.status === 'ok' || dex.status === 'available'
                      ? 'Connected'
                      : 'Disconnected'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Fallback: show Cantex and Temple with unknown status */}
              {['Cantex', 'Temple'].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between bg-white rounded-xl border border-[#D6D9E3] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F3F4F6]">
                      <WifiOff className="w-4 h-4 text-[#9CA3AF]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#111827]">{name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#9CA3AF]">
                    Unknown
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Canton Network */}
        <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
          <h2 className="text-lg font-bold text-[#111827] mb-4">Canton Network</h2>
          {networkQuery.isLoading && !network ? (
            <div className="space-y-3">
              <SkeletonBlock className="w-full h-16" />
              <SkeletonBlock className="w-full h-16" />
              <SkeletonBlock className="w-full h-16" />
            </div>
          ) : networkQuery.error && !network ? (
            <ErrorRetry
              message="Failed to load network data"
              onRetry={() => networkQuery.refetch()}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white rounded-xl border border-[#D6D9E3] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#E0E7FF]">
                    <Activity className="w-4 h-4 text-[#6366F1]" />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9CA3AF]">Open Rounds</p>
                    <p className="text-[18px] font-bold text-[#111827]">
                      {network?.openRounds ?? '--'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-xl border border-[#D6D9E3] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FEF3C7]">
                    <Layers className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9CA3AF]">Featured Apps</p>
                    <p className="text-[18px] font-bold text-[#111827]">
                      {network?.featuredApps ?? '--'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-xl border border-[#D6D9E3] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      network?.connectivity === 'connected' || network?.connectivity === 'ok'
                        ? 'bg-[#E0F5EA]'
                        : 'bg-[#FFE4E6]'
                    }`}
                  >
                    <Globe
                      className={`w-4 h-4 ${
                        network?.connectivity === 'connected' || network?.connectivity === 'ok'
                          ? 'text-[#059669]'
                          : 'text-[#E11D48]'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9CA3AF]">Connectivity</p>
                    <p className="text-[14px] font-semibold text-[#111827] capitalize">
                      {network?.connectivity ?? '--'}
                    </p>
                  </div>
                </div>
                <StatusDot
                  status={
                    network?.connectivity === 'connected' || network?.connectivity === 'ok'
                      ? 'ok'
                      : 'down'
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 4. Token Prices Table                                        */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#111827]">Token Prices</h2>
          {pricesQuery.isLoading && prices && (
            <Loader2 className="w-4 h-4 text-[#9CA3AF] animate-spin" />
          )}
        </div>

        {pricesQuery.isLoading && !prices ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <SkeletonBlock className="w-8 h-4" />
                <SkeletonBlock className="w-20 h-4" />
                <SkeletonBlock className="w-16 h-4 ml-auto" />
                <SkeletonBlock className="w-16 h-4" />
                <SkeletonBlock className="w-16 h-4" />
              </div>
            ))}
          </div>
        ) : pricesQuery.error && !prices ? (
          <ErrorRetry
            message="Failed to load token prices"
            onRetry={() => pricesQuery.refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[13px] text-[#9CA3AF] border-b border-[#D6D9E3]">
                  <th className="text-left font-medium pb-3 pr-4">Token</th>
                  <th className="text-right font-medium pb-3 pr-4">Price (USD)</th>
                  <th className="text-right font-medium pb-3 pr-4">24h Change</th>
                  <th className="text-right font-medium pb-3 pr-4">Volume</th>
                  <th className="text-right font-medium pb-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {(prices ?? []).map((token) => {
                  const isUp = token.change24h >= 0;
                  return (
                    <tr
                      key={token.symbol}
                      className="border-b border-[#D6D9E3]/50 last:border-0 hover:bg-[#ECEEF4] transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span className="text-[14px] font-semibold text-[#111827]">
                          {token.symbol}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-[14px] font-medium text-[#111827]">
                          ${token.priceUsd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUp ? (
                            <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />
                          )}
                          <span
                            className={`text-[13px] font-medium ${
                              isUp ? 'text-[#16A34A]' : 'text-[#DC2626]'
                            }`}
                          >
                            {isUp ? '+' : ''}
                            {token.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-[13px] text-[#6B7280]">
                          {token.volume24h != null
                            ? `$${token.volume24h.toLocaleString()}`
                            : '--'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <ConfidenceBadge confidence={token.confidence} />
                      </td>
                    </tr>
                  );
                })}
                {(!prices || prices.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <p className="text-[14px] text-[#9CA3AF]">No price data available</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 5. Leaderboard Table                                         */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Leaderboard</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">
              Top 20 users by transaction count (anonymized)
            </p>
          </div>
          {leaderboardQuery.isLoading && leaderboard && (
            <Loader2 className="w-4 h-4 text-[#9CA3AF] animate-spin" />
          )}
        </div>

        {leaderboardQuery.isLoading && !leaderboard ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2.5">
                <SkeletonBlock className="w-8 h-4" />
                <SkeletonBlock className="w-32 h-4" />
                <SkeletonBlock className="w-16 h-4 ml-auto" />
                <SkeletonBlock className="w-14 h-4" />
              </div>
            ))}
          </div>
        ) : leaderboardQuery.error && !leaderboard ? (
          <ErrorRetry
            message="Failed to load leaderboard"
            onRetry={() => leaderboardQuery.refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[13px] text-[#9CA3AF] border-b border-[#D6D9E3]">
                  <th className="text-left font-medium pb-3 pr-4 w-16">Rank</th>
                  <th className="text-left font-medium pb-3 pr-4">Party ID</th>
                  <th className="text-left font-medium pb-3 pr-4">Tier</th>
                  <th className="text-right font-medium pb-3">TX Count</th>
                </tr>
              </thead>
              <tbody>
                {(leaderboard ?? []).map((entry) => (
                  <tr
                    key={entry.rank}
                    className="border-b border-[#D6D9E3]/50 last:border-0 hover:bg-[#ECEEF4] transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <span
                        className={`text-[14px] font-bold ${
                          entry.rank === 1
                            ? 'text-[#D97706]'
                            : entry.rank === 2
                              ? 'text-[#9CA3AF]'
                              : entry.rank === 3
                                ? 'text-[#B45309]'
                                : 'text-[#111827]'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-[13px] text-[#6B7280]">
                        {entry.anonymousId.length > 8
                          ? `${entry.anonymousId.slice(0, 8)}...`
                          : entry.anonymousId}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <TierBadge tier={entry.tier} />
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="text-[14px] font-semibold text-[#111827]">
                        {entry.txCount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!leaderboard || leaderboard.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <Users className="w-6 h-6 text-[#D6D9E3] mx-auto mb-2" />
                      <p className="text-[14px] text-[#9CA3AF]">
                        Leaderboard data will appear as users interact
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="relative bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
      <div className={`absolute top-4 right-4 w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <p className="text-[12px] text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-[28px] font-[800] text-[#111827] leading-tight mt-1">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function CircuitBreakerCard({ state }: { state: string }) {
  const normalized = state.toLowerCase();
  const isClosed = normalized === 'closed';
  const isOpen = normalized === 'open';
  const isHalfOpen = normalized === 'half-open' || normalized === 'halfopen';

  const color = isClosed
    ? { bg: 'bg-[#E0F5EA]', text: 'text-[#16A34A]', borderColor: 'border-[#BBF7D0]' }
    : isOpen
      ? { bg: 'bg-[#FFE4E6]', text: 'text-[#DC2626]', borderColor: 'border-[#FECACA]' }
      : isHalfOpen
        ? { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', borderColor: 'border-[#FDE68A]' }
        : { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', borderColor: 'border-[#D6D9E3]' };

  return (
    <div className="relative bg-[#F3F4F9] border border-[#D6D9E3] rounded-[14px] shadow-[0_2px_8px_#0000000A] p-5">
      <div className={`absolute top-4 right-4 w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${color.bg}`}>
        {isClosed ? (
          <CheckCircle2 className={`w-5 h-5 ${color.text}`} />
        ) : isOpen ? (
          <XCircle className={`w-5 h-5 ${color.text}`} />
        ) : (
          <AlertTriangle className={`w-5 h-5 ${color.text}`} />
        )}
      </div>
      <p className="text-[12px] text-[#9CA3AF] uppercase tracking-wide">Circuit Breaker</p>
      <p className={`text-[20px] font-[800] leading-tight mt-1 ${color.text}`}>
        {state || 'Unknown'}
      </p>
      <p className="text-[11px] text-[#9CA3AF] mt-1">
        {isClosed ? 'All systems normal' : isOpen ? 'Requests blocked' : isHalfOpen ? 'Testing recovery' : 'State unknown'}
      </p>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const normalized = confidence.toLowerCase();
  const styles =
    normalized === 'high'
      ? 'bg-[#E0F5EA] text-[#059669]'
      : normalized === 'medium'
        ? 'bg-[#FEF3C7] text-[#D97706]'
        : 'bg-[#FFE4E6] text-[#E11D48]';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles}`}>
      {confidence}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles =
    tier === 'Platinum'
      ? 'bg-[#EDE9FE] text-[#7C3AED]'
      : tier === 'Gold'
        ? 'bg-[#FEF3C7] text-[#D97706]'
        : tier === 'Silver'
          ? 'bg-[#F3F4F6] text-[#6B7280]'
          : 'bg-[#FFF7ED] text-[#C2410C]';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${styles}`}>
      {tier}
    </span>
  );
}

function ErrorRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <AlertTriangle className="w-6 h-6 text-[#D97706] mb-2" />
      <p className="text-[14px] text-[#6B7280] mb-2">{message}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-white border border-[#D6D9E3] text-[#059669] hover:border-[#059669] transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
