import { Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Landing from '@/pages/Landing';
import LandingV2 from '@/pages/LandingV2';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import ChooseStrategy from '@/pages/ChooseStrategy';
import PickTemplate from '@/pages/PickTemplate';
import BuildYourOwn from '@/pages/BuildYourOwn';
import DCA from '@/pages/DCA';
import NewDCA from '@/pages/NewDCA';
import Rewards from '@/pages/Rewards';
import Settings from '@/pages/Settings';
import History from '@/pages/History';
import Portfolio from '@/pages/Portfolio';
import AdminDashboard from '@/pages/AdminDashboard';
import Wallet from '@/pages/Wallet';
import Swap from '@/pages/Swap';
import Whitelist from '@/pages/Whitelist';
import Slides from '@/pages/Slides';
import DocsLayout from '@/pages/docs/DocsLayout';
import Introduction from '@/pages/docs/Introduction';
import QuickStart from '@/pages/docs/QuickStart';
import CreateWallet from '@/pages/docs/CreateWallet';
import PortfolioManagement from '@/pages/docs/PortfolioManagement';
import AutoRebalance from '@/pages/docs/AutoRebalance';
import DCAStrategies from '@/pages/docs/DCAStrategies';
import RewardsReferrals from '@/pages/docs/RewardsReferrals';
import WalletSecurity from '@/pages/docs/WalletSecurity';
import DamlContracts from '@/pages/docs/DamlContracts';
import CantonIntegration from '@/pages/docs/CantonIntegration';
import APIReference from '@/pages/docs/APIReference';
import Roadmap from '@/pages/docs/Roadmap';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
import { PartyProvider } from '@/context/PartyContext';
import { AuthProvider } from '@/context/AuthContext';

function ReferralRedirect() {
  const { code } = useParams();
  // Sanitize referral code: alphanumeric only, max 32 chars
  if (code && /^[a-zA-Z0-9]{1,32}$/.test(code)) {
    localStorage.setItem('referralCode', code);
  }
  return <Navigate to="/rewards" replace />;
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold text-ink mb-2">404</h1>
      <p className="text-ink-secondary mb-6">Page not found</p>
      <Link to="/" className="btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <AppLayout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<ChooseStrategy />} />
          <Route path="/create/templates" element={<PickTemplate />} />
          <Route path="/create/build" element={<BuildYourOwn />} />
          <Route path="/dca" element={<DCA />} />
          <Route path="/dca/new" element={<NewDCA />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/history" element={<History />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/invite" element={<Whitelist />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/ref/:code" element={<ReferralRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PartyProvider>
        <ToastProvider>
          <Routes>
            <Route path="/home" element={<Landing />} />
            <Route path="/v2" element={<LandingV2 />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/slides" element={<Slides />} />
            <Route path="/docs" element={<DocsLayout />}>
              <Route index element={<Introduction />} />
              <Route path="quick-start" element={<QuickStart />} />
              <Route path="create-wallet" element={<CreateWallet />} />
              <Route path="portfolio" element={<PortfolioManagement />} />
              <Route path="rebalance" element={<AutoRebalance />} />
              <Route path="dca" element={<DCAStrategies />} />
              <Route path="rewards" element={<RewardsReferrals />} />
              <Route path="security" element={<WalletSecurity />} />
              <Route path="contracts" element={<DamlContracts />} />
              <Route path="canton" element={<CantonIntegration />} />
              <Route path="api" element={<APIReference />} />
              <Route path="roadmap" element={<Roadmap />} />
            </Route>
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </ToastProvider>
      </PartyProvider>
    </AuthProvider>
  );
}
