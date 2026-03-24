import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Wallet, AtSign, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

  const auth = useAuth();
  const navigate = useNavigate();

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

          {/* Social buttons — disabled / coming soon */}
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
              disabled
              title="Coming soon"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D6D9E3] dark:border-slate-600 bg-white dark:bg-slate-700 py-[12px] text-sm font-medium text-[#111827] dark:text-slate-200 transition hover:bg-[#F3F4F9] dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base font-bold text-[#4285F4]">G</span>
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
