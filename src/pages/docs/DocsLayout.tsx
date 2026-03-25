import { useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import {
  BookOpen, Rocket, Wallet, PieChart, RefreshCw, TrendingUp,
  Gift, Shield, FileCode, Network, Code2, Map, Search, Menu, X,
  ChevronRight, ArrowLeft, ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Navigation definition                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'GETTING STARTED',
    items: [
      { label: 'Introduction', path: '/docs', icon: BookOpen },
      { label: 'Quick Start', path: '/docs/quick-start', icon: Rocket },
      { label: 'Create Wallet', path: '/docs/create-wallet', icon: Wallet },
    ],
  },
  {
    title: 'CORE FEATURES',
    items: [
      { label: 'Portfolio Management', path: '/docs/portfolio', icon: PieChart },
      { label: 'Auto-Rebalance', path: '/docs/rebalance', icon: RefreshCw },
      { label: 'DCA Strategies', path: '/docs/dca', icon: TrendingUp },
      { label: 'Rewards & Referrals', path: '/docs/rewards', icon: Gift },
    ],
  },
  {
    title: 'TECHNICAL',
    items: [
      { label: 'Wallet Security', path: '/docs/security', icon: Shield },
      { label: 'Daml Contracts', path: '/docs/contracts', icon: FileCode },
      { label: 'Canton Integration', path: '/docs/canton', icon: Network },
      { label: 'API Reference', path: '/docs/api', icon: Code2 },
      { label: 'Roadmap', path: '/docs/roadmap', icon: Map },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

/* ------------------------------------------------------------------ */
/* Helper: breadcrumb from path                                        */
/* ------------------------------------------------------------------ */

function useBreadcrumb() {
  const { pathname } = useLocation();
  const current = ALL_ITEMS.find((i) => i.path === pathname);
  const section = NAV_SECTIONS.find((s) => s.items.some((i) => i.path === pathname));
  return { current, section };
}

/* ------------------------------------------------------------------ */
/* Helper: prev / next navigation                                      */
/* ------------------------------------------------------------------ */

function usePrevNext() {
  const { pathname } = useLocation();
  const idx = ALL_ITEMS.findIndex((i) => i.path === pathname);
  return {
    prev: idx > 0 ? ALL_ITEMS[idx - 1] : null,
    next: idx < ALL_ITEMS.length - 1 ? ALL_ITEMS[idx + 1] : null,
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { current, section } = useBreadcrumb();
  const { prev, next } = usePrevNext();

  const filteredSections = useMemo(() => {
    if (!search.trim()) return NAV_SECTIONS;
    const q = search.toLowerCase();
    return NAV_SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((s) => s.items.length > 0);
  }, [search]);

  /* Sidebar content (shared between desktop and mobile) */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#059669] to-[#10B981] flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="text-[17px] font-bold text-[#111827] dark:text-slate-100">Roil Docs</span>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search docs..."
            className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border border-[#E5E7EB] dark:border-slate-600 bg-white dark:bg-slate-700 text-[#374151] dark:text-slate-200 placeholder-[#9CA3AF] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent"
          />
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {filteredSections.map((sec) => (
          <div key={sec.title} className="mb-5">
            <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-[#9CA3AF] dark:text-slate-500">
              {sec.title}
            </div>
            {sec.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/docs'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#E0F5EA] text-[#059669] dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F3F4F6] dark:hover:bg-slate-700/50 hover:text-[#374151] dark:hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Back to app */}
      <div className="px-4 pb-6 border-t border-[#E5E7EB] dark:border-slate-700 pt-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-[13px] font-medium text-[#9CA3AF] dark:text-slate-500 hover:text-[#059669] dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to App
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] shrink-0 border-r border-[#E5E7EB] dark:border-slate-700 bg-[#F8F9FB] dark:bg-slate-800 h-screen sticky top-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-600 shadow-sm"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5 text-[#374151] dark:text-slate-300" />
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-[280px] bg-[#F8F9FB] dark:bg-slate-800 h-full shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-slate-700"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5 text-[#6B7280] dark:text-slate-400" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 py-8 lg:px-16 lg:py-12">
          {/* Breadcrumb */}
          {current && section && (
            <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF] dark:text-slate-500 mb-6">
              <Link to="/docs" className="hover:text-[#059669] dark:hover:text-emerald-400 transition-colors">
                Docs
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#6B7280] dark:text-slate-400">{section.title}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#374151] dark:text-slate-200 font-medium">{current.label}</span>
            </div>
          )}

          {/* Page content (via Outlet) */}
          <Outlet />

          {/* Prev / Next navigation */}
          <div className="flex items-stretch gap-4 mt-16 pt-8 border-t border-[#E5E7EB] dark:border-slate-700">
            {prev ? (
              <Link
                to={prev.path}
                className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 hover:border-[#059669] dark:hover:border-emerald-500 hover:bg-[#F0FDF4] dark:hover:bg-emerald-900/10 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 text-[#9CA3AF] dark:text-slate-500 group-hover:text-[#059669] dark:group-hover:text-emerald-400" />
                <div>
                  <div className="text-[11px] text-[#9CA3AF] dark:text-slate-500 font-medium">Previous</div>
                  <div className="text-[14px] font-semibold text-[#374151] dark:text-slate-200 group-hover:text-[#059669] dark:group-hover:text-emerald-400">
                    {prev.label}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <Link
                to={next.path}
                className="flex-1 flex items-center justify-end gap-3 p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 hover:border-[#059669] dark:hover:border-emerald-500 hover:bg-[#F0FDF4] dark:hover:bg-emerald-900/10 transition-colors group text-right"
              >
                <div>
                  <div className="text-[11px] text-[#9CA3AF] dark:text-slate-500 font-medium">Next</div>
                  <div className="text-[14px] font-semibold text-[#374151] dark:text-slate-200 group-hover:text-[#059669] dark:group-hover:text-emerald-400">
                    {next.label}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF] dark:text-slate-500 group-hover:text-[#059669] dark:group-hover:text-emerald-400" />
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
