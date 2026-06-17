import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

/**
 * POST /api/waitlist
 * Body: { email: string, referral?: string, source?: string, website?: string }
 *
 * Stores pre-mainnet waitlist signups in Neon Postgres. The `website` field is a
 * honeypot — real browsers leave it empty; bots tend to fill every field.
 *
 * Set DATABASE_URL (Neon / Vercel Postgres) in the project's env vars.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONNECTION_STRING = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// Module-scoped flag: warm serverless invocations reuse the same container, so we
// only need to run the idempotent CREATE TABLE once per cold start.
let schemaReady = false;

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

    // Bot trap: silently accept so scrapers don't learn the field is checked.
    if (honeypot) {
      return res.status(200).json({ ok: true, alreadyJoined: false });
    }

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
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

    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      ?.split(',')[0]
      ?.trim() || null;
    const userAgent = String(req.headers['user-agent'] ?? '').slice(0, 300) || null;

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
