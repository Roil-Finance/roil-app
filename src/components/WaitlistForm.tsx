import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pre-mainnet email capture. Posts to the same-origin /api/waitlist function
 * (covered by CSP connect-src 'self', so no header change needed).
 */
export default function WaitlistForm({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const referral =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('referralCode') ?? undefined
          : undefined;

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, referral, source, website }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong. Please try again.');
      }

      setStatus('success');
      setMessage(
        data?.alreadyJoined
          ? "You're already on the list. We'll be in touch!"
          : "You're on the list! We'll email you the moment mainnet goes live.",
      );
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto max-w-[480px] rounded-2xl border border-[#D4C93A]/40 bg-[#D4C93A]/10 px-6 py-5 text-center"
      >
        <div className="text-[28px] leading-none">&#x2713;</div>
        <p className="mt-2 text-[15px] font-medium text-[#EDE84A]">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[480px]" noValidate>
      {/* Honeypot: visually hidden, off the tab order. Bots fill it, humans don't. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          disabled={status === 'loading'}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-[16px] text-white placeholder-[#6B7280] transition-colors focus:border-[#D4C93A]/60 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-xl bg-gradient-to-r from-[#EDE84A] to-[#D4C93A] px-8 py-4 text-[16px] font-semibold text-[#0A0A0F] shadow-[0_0_40px_rgba(237,232,74,0.3)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
        </button>
      </div>

      <p aria-live="polite" className="min-h-[20px] pt-3 text-[14px]">
        {status === 'error' ? (
          <span className="text-red-400">{message}</span>
        ) : (
          <span className="text-[#6B7280]">No spam, just your invite when we launch.</span>
        )}
      </p>
    </form>
  );
}
