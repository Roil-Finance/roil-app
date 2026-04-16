import { Eye, WifiOff } from 'lucide-react';

export type BannerReason = 'unauth' | 'disconnected' | null;

interface DemoBannerProps {
  reason: BannerReason;
}

/**
 * Persistent banner clarifying the source of the data on screen.
 *
 *   - reason="disconnected" — the backend is unreachable; hooks are serving
 *     cached sample data. High-contrast red banner so the user cannot miss it.
 *   - reason="unauth" — the user hasn't connected a wallet yet, so the
 *     portfolio/DCA views are showing marketing-style demo data. Soft indigo
 *     banner with a connect-wallet CTA.
 *   - reason=null — real authenticated user on a live backend; no banner.
 */
export default function DemoBanner({ reason }: DemoBannerProps) {
  if (!reason) return null;

  if (reason === 'disconnected') {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm font-medium"
      >
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Backend unreachable — showing cached sample data</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 text-sm font-medium"
    >
      <Eye className="w-4 h-4 shrink-0" />
      <span>
        Demo Preview —{' '}
        <a href="/login" className="underline underline-offset-2 font-semibold">
          Connect wallet
        </a>{' '}
        to see your live Canton TestNet portfolio. Numbers below are sample data.
      </span>
    </div>
  );
}
