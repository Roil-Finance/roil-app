import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

/**
 * POST /api/waitlist
 * Body: { email: string, referral?: string, source?: string, website?: string, turnstileToken?: string }
 *
 * Stores pre-mainnet waitlist signups in Neon Postgres. Anti-spam layers, in order:
 *   1. Honeypot (`website`) — real browsers leave it empty; bots tend to fill it.
 *   2. Email format check.
 *   3. Blocked-domain list — silently drops known abuse/disposable domains.
 *   4. Cloudflare Turnstile — verified server-side when TURNSTILE_SECRET_KEY is set
 *      (soft no-op when unset, so the form keeps working until keys are added).
 *   5. Per-IP rate limit — caps signups per network per hour.
 *   6. UNIQUE(email) — dedupe.
 *
 * Env: DATABASE_URL (Neon). Optional: TURNSTILE_SECRET_KEY, BLOCKED_EMAIL_DOMAINS (comma list).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONNECTION_STRING = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || '';
const MAX_PER_IP_PER_HOUR = Number(process.env.WAITLIST_MAX_PER_IP_PER_HOUR || 5);

// Known abuse / disposable domains. Extend live via BLOCKED_EMAIL_DOMAINS env (comma-separated)
// without a redeploy.
const DEFAULT_BLOCKED = [
  'uhuyzz.my.id', 'xsend.org', 'sendnow.win',
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
  'maildrop.cc', 'mohmal.com', 'fakeinbox.com', 'throwawaymail.com', 'mintemail.com',
];
const BLOCKED_DOMAINS = new Set([
  ...DEFAULT_BLOCKED,
  ...(process.env.BLOCKED_EMAIL_DOMAINS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
]);

// Warm serverless invocations reuse the container, so CREATE TABLE runs once per cold start.
let schemaReady = false;

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // not configured → soft no-op
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    const data = (await r.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CONNECTION_STRING) {
    console.error('[waitlist] DATABASE_URL / POSTGRES_URL is not configured');
    return res.status(500).json({ error: 'Waitlist is not configured yet.' });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});

    const email = String(body.email ?? '').trim().toLowerCase();
    const referral = body.referral ? String(body.referral).slice(0, 64) : null;
    const source = body.source ? String(body.source).slice(0, 64) : 'landing';
    const honeypot = String(body.website ?? '');
    const turnstileToken = String(body.turnstileToken ?? '');

    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      ?.split(',')[0]
      ?.trim() || null;
    const userAgent = String(req.headers['user-agent'] ?? '').slice(0, 300) || null;

    // 1. Honeypot — silently accept so scrapers don't learn the field is checked.
    if (honeypot) {
      return res.status(200).json({ ok: true, alreadyJoined: false });
    }

    // 2. Email format.
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // 3. Blocked domains — silently accept (same anti-adaptation logic as the honeypot)
    //    so the flood keeps "succeeding" from the bot's view while nothing is written.
    const domain = email.slice(email.lastIndexOf('@') + 1);
    if (BLOCKED_DOMAINS.has(domain)) {
      return res.status(200).json({ ok: true, alreadyJoined: false });
    }

    // 4. Turnstile (enforced only when TURNSTILE_SECRET_KEY is set).
    const human = await verifyTurnstile(turnstileToken, ip);
    if (!human) {
      return res.status(400).json({ error: 'Verification failed. Please try again.' });
    }

    const sql = neon(CONNECTION_STRING);

    if (!schemaReady) {
      await sql`
        CREATE TABLE IF NOT EXISTS waitlist (
          id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          email      TEXT NOT NULL UNIQUE,
          referral   TEXT,
          source     TEXT,
          ip         TEXT,
          user_agent TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      schemaReady = true;
    }

    // 5. Per-IP rate limit.
    if (ip) {
      const [{ recent }] = await sql`
        SELECT count(*)::int AS recent
        FROM waitlist
        WHERE ip = ${ip} AND created_at > now() - interval '1 hour'
      `;
      if (recent >= MAX_PER_IP_PER_HOUR) {
        return res.status(429).json({ error: 'Too many signups from your network. Please try again later.' });
      }
    }

    // 6. Insert (UNIQUE(email) dedupes).
    const rows = await sql`
      INSERT INTO waitlist (email, referral, source, ip, user_agent)
      VALUES (${email}, ${referral}, ${source}, ${ip}, ${userAgent})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    const alreadyJoined = rows.length === 0;
    return res.status(alreadyJoined ? 200 : 201).json({ ok: true, alreadyJoined });
  } catch (err) {
    console.error('[waitlist] error', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
