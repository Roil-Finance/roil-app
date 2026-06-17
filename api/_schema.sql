-- Waitlist storage schema (Neon / Vercel Postgres).
-- The /api/waitlist function creates this automatically on first write,
-- but you can also run it by hand from the Neon SQL editor.

CREATE TABLE IF NOT EXISTS waitlist (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  referral   TEXT,
  source     TEXT,
  ip         TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- View signups in order (newest first):
--   SELECT id, email, referral, source, created_at FROM waitlist ORDER BY created_at DESC;

-- Total count:
--   SELECT count(*) FROM waitlist;

-- Export to CSV from the Neon dashboard, or:
--   \copy (SELECT email, created_at FROM waitlist ORDER BY created_at) TO 'waitlist.csv' CSV HEADER;
