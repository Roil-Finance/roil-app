import { useMemo } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type { BridgeHistoryEntry } from '@/hooks/useBridgeHistory';

/**
 * BridgeHistory — past xReserve deposits + withdrawals for this user,
 * merged and sorted newest first. Status badges colour-code at a glance;
 * an external link to Etherscan is rendered when a burn/release tx hash
 * is available.
 */

interface Props {
  entries: BridgeHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

type Tone = 'pending' | 'success' | 'failure' | 'action';

function statusTone(status: string): Tone {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'failure';
  if (status === 'attested') return 'action';
  return 'pending';
}

function statusLabel(direction: 'deposit' | 'withdraw', status: string): string {
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Failed';
  if (status === 'attested') return 'Ready to claim';
  if (direction === 'deposit') {
    switch (status) {
      case 'pending_approval':
        return 'Approving';
      case 'burning':
        return 'Locking';
      case 'awaiting_finality':
        return 'Awaiting finality';
      case 'awaiting_attestation':
        return 'Awaiting attestation';
      case 'claiming':
        return 'Minting';
      default:
        return status;
    }
  }
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'burning':
      return 'Burning';
    case 'released':
      return 'Released';
    default:
      return status;
  }
}

const TONE_CLASS: Record<Tone, string> = {
  pending: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  success:
    'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  failure: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  action:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

function formatAmount(weiStr: string): string {
  // USDC = 6 decimals. Wei strings up to 24 chars stay in Number range
  // for display formatting (we never use this value for math).
  try {
    const wei = BigInt(weiStr);
    const whole = wei / 1_000_000n;
    const frac = (wei % 1_000_000n).toString().padStart(6, '0').slice(0, 2);
    return `${whole.toString()}.${frac}`;
  } catch {
    return weiStr;
  }
}

function shortenAddress(addr: string): string {
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const ms = now - d.getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function etherscanUrl(hash: string): string {
  // Sepolia testnet — production xReserve uses mainnet Ethereum.
  // Without an explicit chain id from the entry we default to Sepolia so
  // testnet flows are usable; this can be made configurable per environment.
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export default function BridgeHistory({
  entries,
  isLoading,
  error,
  onRefresh,
}: Props) {
  const hasEntries = entries.length > 0;

  // Slice for compact view; older items live behind a future paginator.
  const visible = useMemo(() => entries.slice(0, 25), [entries]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-[#D6D9E3] dark:border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6D9E3] dark:border-slate-700">
        <div>
          <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">
            Recent transfers
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Deposits and withdrawals on this account
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh history"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-[#6B7280] dark:text-slate-400 hover:bg-[#F3F4F9] dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-950/40 text-xs text-[#E11D48] dark:text-red-300 border-b border-red-100 dark:border-red-900/60">
          {error}
        </div>
      )}

      {!hasEntries && !isLoading && !error && (
        <div className="px-6 py-16 text-center">
          <Clock className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#6B7280] dark:text-slate-400">
            No transfers yet
          </p>
          <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mt-1">
            Your bridge history will appear here once you deposit or withdraw.
          </p>
        </div>
      )}

      {hasEntries && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#6B7280] dark:text-slate-400 bg-[#F8F9FB] dark:bg-slate-900/40">
                <th className="px-6 py-3 font-medium">Direction</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Counter-address</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">When</th>
                <th className="px-6 py-3 font-medium text-right">Link</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => {
                const isDeposit = entry.direction === 'deposit';
                const tone = statusTone(entry.status);
                const txHash = entry.burnTxHash ?? entry.releaseTxHash;

                return (
                  <tr
                    key={`${entry.direction}-${entry.id}`}
                    className="border-t border-[#EEF0F4] dark:border-slate-700"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-full ${
                            isDeposit
                              ? 'bg-green-50 text-[#059669] dark:bg-green-950/40'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpFromLine className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <span className="text-[#111827] dark:text-slate-100 font-medium">
                          {isDeposit ? 'Deposit' : 'Withdraw'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[#111827] dark:text-slate-100 font-medium">
                      {formatAmount(entry.amount)} USDC
                    </td>
                    <td className="px-6 py-3 text-[#6B7280] dark:text-slate-400 font-mono text-xs">
                      {shortenAddress(entry.evmAddress)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md ${TONE_CLASS[tone]}`}
                      >
                        {statusLabel(entry.direction, entry.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[#6B7280] dark:text-slate-400 text-xs">
                      {relativeTime(entry.createdAt)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {txHash ? (
                        <a
                          href={etherscanUrl(txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#059669] hover:underline"
                        >
                          Etherscan
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
