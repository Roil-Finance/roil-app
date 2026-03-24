import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isGoogleAuthEnabled } from '@/lib/google-auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();
  const googleEnabled = isGoogleAuthEnabled();

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await auth.loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed — please try again');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed — please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#E8EBF2,#F0F1F6,#ECEEF4)] dark:bg-[linear-gradient(160deg,#0F172A,#1E293B,#0F172A)]">
      {/* Decorative radial orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(5,150,105,0.08)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 flex w-full flex-col items-center px-4">
        {/* Floating logo */}
        <img
          src="/logo.jpg"
          alt="Roil"
          className="mb-5 h-16 w-16 rounded-2xl shadow-lg"
        />

        {/* Card */}
        <div className="w-full max-w-[520px] rounded-3xl border border-[#D6D9E3] dark:border-slate-700 bg-[#F3F4F9] dark:bg-slate-800 px-6 md:px-10 py-9">
          {/* Header */}
          <h1 className="text-center text-[28px] font-[800] text-[#111827] dark:text-slate-100">
            Welcome to Roil
          </h1>
          <p className="mt-1.5 text-center text-sm text-[#6B7280] dark:text-slate-400">
            Private treasury management on Canton Network
          </p>

          {/* Error banner */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-[#111827] dark:text-slate-200">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6B7280]" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 py-[14px] pl-11 pr-[18px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-[#111827] dark:text-slate-200">
                  Password
                </label>
                <button type="button" className="text-sm font-medium text-[#059669] hover:text-[#047857]">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 px-[18px] py-[14px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669] disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                >
                  {showPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] py-[14px] text-sm font-semibold text-white shadow-[0_4px_16px_#05966930] transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D6D9E3] dark:bg-slate-700" />
            <span className="text-xs text-[#6B7280] dark:text-slate-500">or</span>
            <div className="h-px flex-1 bg-[#D6D9E3] dark:bg-slate-700" />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 py-[12px] text-sm font-medium text-[#111827] dark:text-slate-200 transition hover:bg-[#F3F4F9] dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="h-[18px] w-[18px]" />
              Wallet
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#111827] dark:bg-slate-600 py-[12px] text-sm font-medium text-white transition hover:bg-[#1f2937] dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base font-bold leading-none">&#120143;</span>
            </button>
            <button
              type="button"
              disabled={!googleEnabled || isGoogleLoading || isSubmitting}
              title={googleEnabled ? 'Sign in with Google' : 'Set VITE_GOOGLE_CLIENT_ID to enable'}
              onClick={handleGoogleSignIn}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 py-[12px] text-sm font-medium text-[#111827] dark:text-slate-200 transition hover:bg-[#F3F4F9] dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Google
            </button>
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-[#6B7280] dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-[#059669] hover:text-[#047857]">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
