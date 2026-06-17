import { NavLink, useLocation } from 'react-router-dom';
import {
  Wallet,
  Repeat2,
  Trophy,
  Clock,
  PieChart,
  HelpCircle,
  KeyRound,
  ArrowLeftRight,
  Workflow,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/create', icon: Wallet, label: 'Create' },
  { to: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { to: '/swap', icon: ArrowLeftRight, label: 'Swap' },
  { to: '/bridge', icon: Workflow, label: 'Bridge' },
  { to: '/dca', icon: Repeat2, label: 'DCA' },
  { to: '/rewards', icon: Trophy, label: 'Rewards' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/wallet', icon: KeyRound, label: 'Wallet' },
] as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Sidebar() {
  const location = useLocation();

  return (
    <>
      {/* ============ Desktop Sidebar (md+) ============ */}
      <aside
        className="fixed top-0 left-0 h-screen hidden md:flex flex-col items-center bg-white dark:bg-slate-800 border-r border-[#D6D9E3] dark:border-slate-700 z-30 py-5"
        style={{ width: 72 }}
      >
        {/* Logo — click to go home */}
        <NavLink to="/">
          <img
            src="/logo.jpg"
            alt="Roil"
            className="w-10 h-10 rounded-xl object-cover mb-6"
          />
        </NavLink>

        {/* Navigation */}
        <nav className="flex flex-col items-center gap-2 flex-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <NavLink
                key={to}
                to={to}
                title={label}
                aria-label={label}
                className="flex items-center justify-center rounded-xl transition-colors"
                style={{ width: 44, height: 44 }}
              >
                <div
                  className={`flex items-center justify-center w-full h-full rounded-xl transition-colors ${
                    isActive
                      ? 'bg-gradient-to-b from-[#059669] to-[#10B981] text-white'
                      : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#ECEEF4] dark:hover:bg-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom icons — Twitter + Help */}
        <div className="flex flex-col items-center gap-2 mb-1">
          <a
            href="https://x.com/roil_app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-[#111827] dark:hover:text-slate-200 hover:bg-[#ECEEF4] dark:hover:bg-slate-700 transition-colors"
            style={{ width: 44, height: 44 }}
            title="Follow us on X"
          >
            <XIcon className="w-[18px] h-[18px]" />
          </a>
          <a
            href="/docs"
            className="flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-slate-300 hover:bg-[#ECEEF4] dark:hover:bg-slate-700 transition-colors"
            style={{ width: 44, height: 44 }}
            title="Help & Docs"
          >
            <HelpCircle className="w-5 h-5" strokeWidth={2} />
          </a>
        </div>
      </aside>

      {/* ============ Mobile Bottom Nav (<md) ============ */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around bg-white dark:bg-slate-800 border-t border-[#D6D9E3] dark:border-slate-700 z-30 h-16 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className="flex items-center justify-center rounded-xl transition-colors"
              style={{ width: 44, height: 44 }}
            >
              <div
                className={`flex items-center justify-center w-full h-full rounded-xl transition-colors ${
                  isActive
                    ? 'bg-gradient-to-b from-[#059669] to-[#10B981] text-white'
                    : 'text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
