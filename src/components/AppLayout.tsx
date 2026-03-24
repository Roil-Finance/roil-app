import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import ProfileDropdown from '@/components/ProfileDropdown';
import DemoBanner from '@/components/DemoBanner';
import WalletConnect from '@/components/WalletConnect';
import { useBackendStatus } from '@/hooks/useApi';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useBackendStatus();
  const isDemo = status === 'disconnected';

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col" style={{ marginLeft: 72 }}>
        {/* Demo mode banner */}
        <DemoBanner visible={isDemo} />

        {/* Top bar */}
        <header className="flex items-center justify-end gap-3 px-8 shrink-0" style={{ height: 64 }}>
          <WalletConnect />
          <ProfileDropdown />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
