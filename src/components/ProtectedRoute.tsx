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
  /**
   * If true, the authenticated user must additionally hold the platform
   * operator role. Defaults to false. When set, a non-admin authenticated
   * user is redirected to /dashboard (not /login) because admins and
   * regular users share the same auth flow — there is nothing to re-login
   * as.
   */
  requireAdmin?: boolean;
}

/**
 * Guards routes that depend on auth state. While the AuthContext is
 * still hydrating (token verification on mount), renders a lightweight
 * loading state instead of flashing authenticated UI.
 *
 * If requireAuth is true and the user is unauthenticated, redirects to
 * /login preserving the attempted destination.
 *
 * If requireAdmin is true, the user must ALSO have admin privileges as
 * surfaced by AuthContext (`isAdmin` flag, backed by a JWT claim or a
 * `/api/admin/me` check performed at login).
 */
export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
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

  if (requireAdmin && !isAdmin) {
    // Authenticated but not admin — avoid leaking the existence of admin
    // routes beyond the fact that they redirect.
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
