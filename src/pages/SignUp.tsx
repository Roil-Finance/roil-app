import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Wallet, AtSign, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isGoogleAuthEnabled } from '@/lib/google-auth';

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string,
  termsAccepted: boolean,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!firstName.trim()) errors.firstName = 'First name is required';
  if (!lastName.trim()) errors.lastName = 'Last name is required';

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!termsAccepted) {
    errors.terms = 'You must accept the Terms of Service';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();
  const googleEnabled = isGoogleAuthEnabled();

  const handleGoogleSignUp = async () => {
    setServerError(null);
    setIsGoogleLoading(true);
    try {
      await auth.loginWithGoogle();
      navigate('/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Google sign-up failed — please try again');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Run validation
    const errors = validate(firstName, lastName, email, password, confirmPassword, termsAccepted);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await auth.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        username: username.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed — please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear field error when user starts typing
  const clearError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  /** Tailwind ring class for inputs with errors */
  const inputErr = 'border-red-400 focus:border-red-500 focus:ring-red-500';
  const inputOk = 'border-[#D6D9E3] dark:border-slate-600 focus:border-[#059669] focus:ring-[#059669]';

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#E8EBF2,#F0F1F6,#ECEEF4)] dark:bg-[linear-gradient(160deg,#0F172A,#1E293B,#0F172A)]">
      {/* Decorative radial orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(5,150,105,0.08)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 flex w-full flex-col items-center px-4 py-10">
        {/* Floating logo */}
        <img
          src="/logo.jpg"
          alt="Roil"
          className="mb-5 h-16 w-16 rounded-2xl shadow-lg"
        />

        {/* Card */}
        <div className="w-full max-w-[620px] rounded-3xl border border-[#D6D9E3] dark:border-slate-700 bg-[#F3F4F9] dark:bg-slate-800 px-6 md:px-10 py-9">
          {/* Header */}
          <h1 className="text-center text-[28px] font-[800] text-[#111827] dark:text-slate-100">
            Create your account
          </h1>
          <p className="mt-1.5 text-center text-sm text-[#6B7280] dark:text-slate-400">
            Start managing your private treasury on Canton Network
          </p>

          {/* Server error banner */}
          {serverError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* First Name + Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-first" className="mb-1.5 block text-sm font-medium text-[#111827] dark:text-slate-200">
                  First Name
                </label>
                <input
                  id="signup-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearError('firstName'); }}
                  placeholder="Jane"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-white dark:bg-slate-700 px-[18px] py-[14px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 disabled:opacity-60 ${fieldErrors.firstName ? inputErr : inputOk}`}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-last" className="mb-1.5 block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Last Name
                </label>
                <input
                  id="signup-last"
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearError('lastName'); }}
                  placeholder="Doe"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-white dark:bg-slate-700 px-[18px] py-[14px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 disabled:opacity-60 ${fieldErrors.lastName ? inputErr : inputOk}`}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-[#111827] dark:text-slate-200">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6B7280]" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-white dark:bg-slate-700 py-[14px] pl-11 pr-[18px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 disabled:opacity-60 ${fieldErrors.email ? inputErr : inputOk}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-[#111827] dark:text-slate-200">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  placeholder="Min 8 characters"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-white dark:bg-slate-700 px-[18px] py-[14px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 disabled:opacity-60 ${fieldErrors.password ? inputErr : inputOk}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                >
                  {showPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-medium text-[#111827] dark:text-slate-200">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                  placeholder="Re-enter your password"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-white dark:bg-slate-700 px-[18px] py-[14px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 disabled:opacity-60 ${fieldErrors.confirmPassword ? inputErr : inputOk}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                >
                  {showConfirmPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Username (optional) */}
            <div>
              <label htmlFor="signup-username" className="mb-1.5 block text-sm font-medium text-[#111827] dark:text-slate-200">
                Username <span className="font-normal text-[#9CA3AF]">(optional)</span>
              </label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6B7280]" />
                <input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 py-[14px] pl-11 pr-[18px] text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500 focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); clearError('terms'); }}
                  disabled={isSubmitting}
                  className="mt-0.5 h-4 w-4 rounded border-[#D6D9E3] text-[#059669] focus:ring-[#059669]"
                />
                <span className="text-sm text-[#6B7280] dark:text-slate-400">
                  I agree to the{' '}
                  <span className="font-medium text-[#059669] hover:text-[#047857] cursor-pointer">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="font-medium text-[#059669] hover:text-[#047857] cursor-pointer">
                    Privacy Policy
                  </span>
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 ml-7 text-xs text-red-600">{fieldErrors.terms}</p>
              )}
            </div>

            {/* Create Account button */}
            <button
              type="submit"
              disabled={isSubmitting || !termsAccepted}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] py-[14px] text-sm font-semibold text-white shadow-[0_4px_16px_#05966930] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
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
              title={googleEnabled ? 'Sign up with Google' : 'Set VITE_GOOGLE_CLIENT_ID to enable'}
              onClick={handleGoogleSignUp}
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

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-[#6B7280] dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#059669] hover:text-[#047857]">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
