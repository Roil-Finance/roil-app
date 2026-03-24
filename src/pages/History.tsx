import { useState, useCallback } from 'react';
import {
  ArrowUpRight, ArrowDownLeft, Repeat, Repeat2, RefreshCw, Gift,
  Search, Filter, Download, Loader2,
} from 'lucide-react';
import { TOKEN_LOGOS, config } from '@/config';
import { useQuery, getAuthToken } from '@/hooks/useApi';
import { useParty } from '@/context/PartyContext';

type TxType = 'Deposit' | 'Withdraw' | 'Swap' | 'DCA Buy' | 'Rebalance' | 'Reward';

interface HistoryEntry {
  id: number;
  type: TxType;
  token: string;
  amount: string;
  usd: string;
  date: string;
  status: 'Completed' | 'Pending';
}

/** Shape returned by GET /api/transfers/:party/history */
interface ApiHistoryEntry {
  type: string;
  timestamp: string;
  details: string;
  amount: number;
  asset: string;
  status: string;
}

const TX_ICON: Record<TxType, React.ComponentType<{ className?: string; color?: string }>> = {
  'Deposit': ArrowDownLeft,
  'Withdraw': ArrowUpRight,
  'Swap': Repeat,
  'DCA Buy': Repeat2,
  'Rebalance': RefreshCw,
  'Reward': Gift,
};

const TX_COLOR: Record<TxType, { bg: string; text: string }> = {
  'Deposit': { bg: '#E0F5EA', text: '#059669' },
  'Withdraw': { bg: '#FFE4E6', text: '#E11D48' },
  'Swap': { bg: '#DBEAFE', text: '#2563EB' },
  'DCA Buy': { bg: '#E0F5EA', text: '#059669' },
  'Rebalance': { bg: '#FEF3C7', text: '#D97706' },
  'Reward': { bg: '#EDE9FE', text: '#7C3AED' },
};

// ---------------------------------------------------------------------------
// Fallback demo data — used when backend is unavailable
// ---------------------------------------------------------------------------

const DEMO_HISTORY: HistoryEntry[] = [
  { id: 1, type: 'DCA Buy', token: 'CBTC', amount: '+0.0023 CBTC', usd: '$200.00', date: 'Mar 22, 2026 09:15', status: 'Completed' },
  { id: 2, type: 'Rebalance', token: 'ETHx → CC', amount: '0.8 ETHx → 412 CC', usd: '$1,840.00', date: 'Mar 21, 2026 14:30', status: 'Completed' },
  { id: 3, type: 'Reward', token: 'USDCx', amount: '+32.10 USDCx', usd: '$32.10', date: 'Mar 20, 2026 00:00', status: 'Completed' },
  { id: 4, type: 'DCA Buy', token: 'ETHx', amount: '+0.073 ETHx', usd: '$150.00', date: 'Mar 19, 2026 09:15', status: 'Completed' },
  { id: 5, type: 'Deposit', token: 'USDCx', amount: '+5,000 USDCx', usd: '$5,000.00', date: 'Mar 18, 2026 11:42', status: 'Completed' },
  { id: 6, type: 'Swap', token: 'USDCx → XAUt', amount: '2,000 USDCx → 0.82 XAUt', usd: '$2,000.00', date: 'Mar 17, 2026 16:05', status: 'Completed' },
  { id: 7, type: 'DCA Buy', token: 'CBTC', amount: '+0.0023 CBTC', usd: '$200.00', date: 'Mar 15, 2026 09:15', status: 'Completed' },
  { id: 8, type: 'Withdraw', token: 'USDCx', amount: '-1,200 USDCx', usd: '$1,200.00', date: 'Mar 14, 2026 10:20', status: 'Completed' },
  { id: 9, type: 'Rebalance', token: 'CBTC → USDCx', amount: '0.015 CBTC → 1,310 USDCx', usd: '$1,310.00', date: 'Mar 12, 2026 14:30', status: 'Completed' },
  { id: 10, type: 'Deposit', token: 'USDCx', amount: '+10,000 USDCx', usd: '$10,000.00', date: 'Mar 10, 2026 08:00', status: 'Completed' },
  { id: 11, type: 'DCA Buy', token: 'SOLx', amount: '+0.71 SOLx', usd: '$100.00', date: 'Mar 8, 2026 09:15', status: 'Completed' },
  { id: 12, type: 'Swap', token: 'CC → ETHx', amount: '500 CC → 0.12 ETHx', usd: '$280.00', date: 'Mar 6, 2026 13:22', status: 'Completed' },
  { id: 13, type: 'Reward', token: 'USDCx', amount: '+28.40 USDCx', usd: '$28.40', date: 'Mar 1, 2026 00:00', status: 'Completed' },
  { id: 14, type: 'DCA Buy', token: 'CBTC', amount: '+0.0022 CBTC', usd: '$200.00', date: 'Feb 28, 2026 09:15', status: 'Completed' },
  { id: 15, type: 'Deposit', token: 'USDCx', amount: '+3,000 USDCx', usd: '$3,000.00', date: 'Feb 25, 2026 14:10', status: 'Completed' },
  { id: 16, type: 'Rebalance', token: 'XAUt → CC', amount: '0.1 XAUt → 580 CC', usd: '$240.00', date: 'Feb 22, 2026 14:30', status: 'Completed' },
  { id: 17, type: 'DCA Buy', token: 'ETHx', amount: '+0.075 ETHx', usd: '$150.00', date: 'Feb 20, 2026 09:15', status: 'Completed' },
  { id: 18, type: 'Withdraw', token: 'CBTC', amount: '-0.05 CBTC', usd: '$4,350.00', date: 'Feb 15, 2026 11:00', status: 'Completed' },
  { id: 19, type: 'Swap', token: 'USDCx → CBTC', amount: '5,000 USDCx → 0.057 CBTC', usd: '$5,000.00', date: 'Feb 10, 2026 10:45', status: 'Completed' },
  { id: 20, type: 'Deposit', token: 'USDCx', amount: '+20,000 USDCx', usd: '$20,000.00', date: 'Feb 1, 2026 09:00', status: 'Completed' },
];

const VALID_TX_TYPES: TxType[] = ['Deposit', 'Withdraw', 'Swap', 'DCA Buy', 'Rebalance', 'Reward'];
const FILTER_TYPES: TxType[] = VALID_TX_TYPES;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isTxType(s: string): s is TxType {
  return (VALID_TX_TYPES as string[]).includes(s);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function mapApiToHistory(items: ApiHistoryEntry[]): HistoryEntry[] {
  return items.map((item, idx) => {
    const type: TxType = isTxType(item.type) ? item.type : 'Swap';
    return {
      id: idx + 1,
      type,
      token: item.asset,
      amount: item.details,
      usd: formatUsd(item.amount),
      date: formatDate(item.timestamp),
      status: item.status === 'Pending' ? 'Pending' : 'Completed',
    };
  });
}

function getTokenLogo(token: string): string | null {
  const symbol = token.split(' → ')[0].split(' ')[0];
  return TOKEN_LOGOS[symbol] || null;
}

// ---------------------------------------------------------------------------
// Skeleton row for loading state
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr className="border-b border-[#D6D9E3]/50 last:border-0">
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#E5E7EB] animate-pulse" />
          <div className="w-16 h-4 rounded bg-[#E5E7EB] animate-pulse" />
        </div>
      </td>
      <td className="py-3.5 pr-4">
        <div className="w-14 h-4 rounded bg-[#E5E7EB] animate-pulse" />
      </td>
      <td className="py-3.5 pr-4">
        <div className="w-32 h-4 rounded bg-[#E5E7EB] animate-pulse" />
      </td>
      <td className="py-3.5 pr-4 text-right">
        <div className="w-20 h-4 rounded bg-[#E5E7EB] animate-pulse ml-auto" />
      </td>
      <td className="py-3.5 pr-4 text-right">
        <div className="w-28 h-4 rounded bg-[#E5E7EB] animate-pulse ml-auto" />
      </td>
      <td className="py-3.5 text-right">
        <div className="w-16 h-4 rounded-full bg-[#E5E7EB] animate-pulse ml-auto" />
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-5">
      <div className="w-24 h-4 rounded bg-[#E5E7EB] dark:bg-slate-700 animate-pulse" />
      <div className="w-16 h-8 rounded bg-[#E5E7EB] dark:bg-slate-700 animate-pulse mt-2" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function History() {
  const { party } = useParty();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<TxType | 'All'>('All');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch transaction history from backend
  const {
    data: apiData,
    isLoading,
    error,
    isFromBackend,
  } = useQuery<ApiHistoryEntry[]>(
    party ? `/api/transfers/${encodeURIComponent(party)}/history` : null,
    [party],
  );

  // Map API data or fall back to demo data
  const allHistory: HistoryEntry[] = isFromBackend && apiData
    ? mapApiToHistory(apiData)
    : DEMO_HISTORY;

  // Filter + search
  const filtered = allHistory.filter((tx) => {
    if (activeFilter !== 'All' && tx.type !== activeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.type.toLowerCase().includes(q) ||
        tx.token.toLowerCase().includes(q) ||
        tx.amount.toLowerCase().includes(q) ||
        tx.usd.toLowerCase().includes(q) ||
        tx.date.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Summary stats — computed from active dataset
  const totalDeposits = allHistory.filter((t) => t.type === 'Deposit').length;
  const totalSwaps = allHistory.filter((t) => t.type === 'Swap' || t.type === 'DCA Buy').length;
  const totalRewards = allHistory.filter((t) => t.type === 'Reward')
    .reduce((s, t) => s + parseFloat(t.usd.replace(/[$,]/g, '')), 0);

  // CSV export handler
  const handleExportCsv = useCallback(async () => {
    if (!party || isExporting) return;
    setIsExporting(true);
    try {
      const url = `${config.backendUrl}/api/transfers/${encodeURIComponent(party)}/export`;
      const token = getAuthToken();
      const res = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        // If backend export fails, generate CSV from current data as fallback
        const csvHeader = 'Type,Token,Details,Amount (USD),Date,Status\n';
        const csvRows = allHistory.map((tx) =>
          `"${tx.type}","${tx.token}","${tx.amount}","${tx.usd}","${tx.date}","${tx.status}"`
        ).join('\n');
        const csvContent = csvHeader + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `roil-history-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        return;
      }

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `roil-history-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // Network error — generate CSV from local data as fallback
      const csvHeader = 'Type,Token,Details,Amount (USD),Date,Status\n';
      const csvRows = allHistory.map((tx) =>
        `"${tx.type}","${tx.token}","${tx.amount}","${tx.usd}","${tx.date}","${tx.status}"`
      ).join('\n');
      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `roil-history-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setIsExporting(false);
    }
  }, [party, isExporting, allHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#111827] dark:text-slate-100">Wallet History</h1>
        <p className="text-[15px] text-[#6B7280] dark:text-slate-400 mt-1">
          All your transactions, swaps, DCA buys, and rewards in one place.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-5">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">Total Transactions</p>
              <p className="text-[28px] font-bold text-[#111827] dark:text-slate-100 mt-1">{allHistory.length}</p>
            </div>
            <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-5">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">Deposits & Swaps</p>
              <p className="text-[28px] font-bold text-[#111827] dark:text-slate-100 mt-1">{totalDeposits + totalSwaps}</p>
            </div>
            <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-5">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">Total Rewards Earned</p>
              <p className="text-[28px] font-bold text-[#059669] mt-1">${totalRewards.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>

      {/* Backend status indicator */}
      {!isLoading && error && !isFromBackend && (
        <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          Showing demo data — backend unavailable
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 md:max-w-[360px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
          />
        </div>

        {/* CSV Export button */}
        <button
          onClick={handleExportCsv}
          disabled={isExporting || isLoading}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-800 text-[13px] font-medium text-[#6B7280] dark:text-slate-300 hover:border-[#059669] hover:text-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export CSV"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Type filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-[#9CA3AF] mr-1" />
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
              activeFilter === 'All'
                ? 'bg-[#059669] text-white'
                : 'bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-600 text-[#6B7280] dark:text-slate-300 hover:border-[#059669]'
            }`}
          >
            All
          </button>
          {FILTER_TYPES.map((type) => {
            const colors = TX_COLOR[type];
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(activeFilter === type ? 'All' : type)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                  activeFilter === type
                    ? 'text-white'
                    : 'bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-600 text-[#6B7280] dark:text-slate-300 hover:border-[#059669]'
                }`}
                style={activeFilter === type ? { backgroundColor: colors.text } : undefined}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction table */}
      <div className="bg-[#F3F4F9] dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-[14px] p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[13px] text-[#9CA3AF] dark:text-slate-500 border-b border-[#D6D9E3] dark:border-slate-700">
                <th className="text-left font-medium pb-3 pr-4">Type</th>
                <th className="text-left font-medium pb-3 pr-4">Token</th>
                <th className="text-left font-medium pb-3 pr-4">Details</th>
                <th className="text-right font-medium pb-3 pr-4">Amount</th>
                <th className="text-right font-medium pb-3 pr-4">Date</th>
                <th className="text-right font-medium pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#E5E7EB] flex items-center justify-center">
                        <Search className="w-5 h-5 text-[#9CA3AF]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-[#6B7280]">
                          {allHistory.length === 0 ? 'No transactions yet' : 'No transactions found'}
                        </p>
                        <p className="text-[13px] text-[#9CA3AF] mt-0.5">
                          {allHistory.length === 0
                            ? 'Your transaction history will appear here once you make your first deposit.'
                            : 'Try adjusting your search or filters.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const Icon = TX_ICON[tx.type];
                  const colors = TX_COLOR[tx.type];
                  const logo = getTokenLogo(tx.token);
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-[#D6D9E3]/50 dark:border-slate-700/50 last:border-0 hover:bg-[#ECEEF4] dark:hover:bg-slate-700 transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <Icon className="w-[18px] h-[18px]" color={colors.text} />
                          </div>
                          <span className="text-[14px] font-semibold text-[#111827] dark:text-slate-100">{tx.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          {logo && (
                            <img src={logo} alt={tx.token} className="w-5 h-5 rounded-full object-cover" />
                          )}
                          <span className="text-[13px] font-medium text-[#111827] dark:text-slate-200">{tx.token}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-[13px] text-[#374151] dark:text-slate-300">{tx.amount}</span>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <span
                          className="text-[14px] font-semibold"
                          style={{
                            color: tx.type === 'Withdraw' ? '#E11D48'
                              : tx.type === 'Deposit' || tx.type === 'Reward' ? '#059669'
                              : '#111827',
                          }}
                        >
                          {tx.type === 'Withdraw' ? '-' : tx.type === 'Deposit' || tx.type === 'Reward' ? '+' : ''}{tx.usd}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <span className="text-[13px] text-[#6B7280] dark:text-slate-400">{tx.date}</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            tx.status === 'Pending'
                              ? 'bg-[#FEF3C7] text-[#D97706]'
                              : 'bg-[#E0F5EA] text-[#059669]'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
