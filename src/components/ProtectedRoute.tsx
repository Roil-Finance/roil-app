import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * If true, unauthenticated visitors are redirected to /login with a
   * `returnTo` query param. Defaults to false so marketing-style pages
   * (Dashboard, Swap preview) still render demo data.
   */
  requireAuth?: boolean;
}

/**
 * Guards routes that depend on auth state. While the AuthContext is
 * still hydrating (token verification on mount), renders a lightweight
 * loading state instead of flashing authenticated UI.
 *
 * If requireAuth is true and the user is unauthenticated, redirects to
 * /login preserving the attempted destination.
 */
export default function ProtectedRoute({
  children,
  requireAuth = false,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#D6D9E3] dark:border-slate-600 border-t-[#059669] animate-spin" />
        <div className="text-sm text-[#6B7280] dark:text-slate-400">
          Checking session…
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
