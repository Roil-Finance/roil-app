import { useState, useEffect, useRef, type FormEvent } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Public Turnstile site key. When unset, the widget is skipped (soft mode) and the
// backend's other anti-spam layers still apply.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/**
 * Pre-mainnet email capture. Posts to the same-origin /api/waitlist function.
 * Cloudflare Turnstile (invisible) gates the submit when VITE_TURNSTILE_SITE_KEY is set.
 */
export default function WaitlistForm({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // Load + render the Turnstile widget once, only when a site key is configured.
  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    function render() {
      const ts = (window as unknown as { turnstile?: any }).turnstile;
      if (cancelled || !ts || !widgetRef.current || widgetId.current !== null) return;
      widgetId.current = ts.render(widgetRef.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    }

    if ((window as unknown as { turnstile?: any }).turnstile) {
      render();
    } else {
      const existing = document.querySelector('script[data-turnstile]');
      if (existing) {
        existing.addEventListener('load', render);
      } else {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.defer = true;
        s.setAttribute('data-turnstile', '1');
        s.onload = render;
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  function resetWidget() {
    const ts = (window as unknown as { turnstile?: any }).turnstile;
    if (ts && widgetId.current !== null) {
      ts.reset(widgetId.current);
    }
    setToken('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    if (SITE_KEY && !token) {
      setStatus('error');
      setMessage('Please complete the verification and try again.');
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
        body: JSON.stringify({ email: trimmed, referral, source, website, turnstileToken: token }),
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
      resetWidget();
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

      {/* Turnstile widget mounts here when a site key is configured. */}
      {SITE_KEY && <div ref={widgetRef} className="mt-3 flex justify-center" />}

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
