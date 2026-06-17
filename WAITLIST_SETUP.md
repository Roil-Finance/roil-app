# Waitlist Setup

Pre-mainnet email capture on `roil.app/home`. Emails are stored in **Neon Postgres**
(one row per signup) via a Vercel serverless function.

## Pieces

| File | Role |
| --- | --- |
| `src/components/WaitlistForm.tsx` | Email form (validation, honeypot, success/error states). Posts to `/api/waitlist`. |
| `src/pages/Landing.tsx` | Bottom `#waitlist` section + hero/navbar links point to it. |
| `api/waitlist.ts` | Serverless function: validates, dedupes, inserts into Postgres. |
| `api/_schema.sql` | Reference schema + export queries. |

## One-time provisioning (Vercel + Neon)

1. **Vercel dashboard** → project **`ui`** → **Storage** → **Create Database** →
   **Neon (Postgres)**. Connect it to the `ui` project for **Production** (and Preview).
2. Neon's integration auto-injects **`DATABASE_URL`** into the project's env vars.
   The function also accepts `POSTGRES_URL` if that's what's set.
3. **Redeploy** (push to `main`, or `vercel --prod`). The table is created automatically
   on the first signup — no migration step needed.

No CSP change is required: the form posts to the same origin (`connect-src 'self'`).

## Local development

Plain `vite dev` does **not** run `/api` functions. To test the full flow locally:

```bash
vercel dev          # serves the SPA + /api/waitlist together
```

Set `DATABASE_URL` in `.env.local` (a free Neon dev branch works) before running.

## Viewing / exporting signups

From the **Neon SQL editor** (or any `psql` connected to `DATABASE_URL`):

```sql
-- Newest first
SELECT id, email, referral, source, created_at
FROM waitlist
ORDER BY created_at DESC;

-- Total
SELECT count(*) FROM waitlist;
```

Export to CSV from the Neon dashboard (Tables → waitlist → Export), or:

```sql
\copy (SELECT email, created_at FROM waitlist ORDER BY created_at) TO 'waitlist.csv' CSV HEADER;
```

When mainnet launches, export this list and import it into your email tool to
notify everyone.

## Notes

- Duplicate emails are ignored (`ON CONFLICT DO NOTHING`) — re-submitting shows a
  friendly "already on the list" message.
- A hidden honeypot field (`website`) silently drops bot submissions.
- `referral` is captured from `localStorage.referralCode` if a visitor arrived via a
  `/ref/:code` link, so you can see which invites drove signups.
