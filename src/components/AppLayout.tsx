import type { ReactNode } from 'react';
import { Sun, Moon } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ProfileDropdown from '@/components/ProfileDropdown';
import DemoBanner from '@/components/DemoBanner';
import WalletConnect from '@/components/WalletConnect';
import { useBackendStatus } from '@/hooks/useApi';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useBackendStatus();
  const isDemo = status === 'disconnected';
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="flex h-screen dark:bg-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-0 md:ml-[72px] mb-16 md:mb-0">
        {/* Demo mode banner */}
        <DemoBanner visible={isDemo} />

        {/* Top bar */}
        <header className="flex items-center justify-end gap-3 px-4 md:px-8 shrink-0 h-16">
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
        <main className="flex-1 overflow-auto px-4 md:px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
