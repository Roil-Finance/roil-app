import type { ReactNode } from 'react';
import { Sun, Moon } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ProfileDropdown from '@/components/ProfileDropdown';
import DemoBanner, { type BannerReason } from '@/components/DemoBanner';
import NetworkBadge from '@/components/NetworkBadge';
import WalletConnect from '@/components/WalletConnect';
import { useBackendStatus } from '@/hooks/useApi';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuth } from '@/context/AuthContext';

/**
 * Banner priority:
 *   1. Backend unreachable → red "disconnected" banner
 *   2. No authenticated session → indigo "demo preview" banner
 *   3. Authenticated + backend up → no banner (silent real-data mode)
 */
function computeBanner(
  status: string,
  isAuthenticated: boolean,
  isLoading: boolean,
): BannerReason {
  if (status === 'disconnected') return 'disconnected';
  if (!isLoading && !isAuthenticated) return 'unauth';
  return null;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useBackendStatus();
  const { isDark, toggle } = useDarkMode();
  const { isAuthenticated, isLoading } = useAuth();

  const banner = computeBanner(status, isAuthenticated, isLoading);

  return (
    <div className="flex h-screen dark:bg-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-0 md:ml-[72px] mb-16 md:mb-0">
        {/* Persistent banner explaining the source of on-screen data */}
        <DemoBanner reason={banner} />

        {/* Top bar */}
        <header className="flex items-center justify-end gap-3 px-4 md:px-8 shrink-0 h-16">
          {/* Network indicator — always visible on non-mainnet */}
          <NetworkBadge />

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-[#F3F4F9] dark:hover:bg-slate-600 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <Moon className="w-4 h-4 text-[#6B7280]" />
            )}
          </button>
          <WalletConnect />
          <ProfileDropdown />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto px-4 md:px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}
