require('dotenv').config({ path: '.env.local' });
// Next.js Supabase client doesn't run raw SQL. 
// We will create the tables using supabase-js REST api if possible, or print the SQL.
// Supabase REST API can't CREATE TABLE. 
console.log(`
Please run the following SQL in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS automation_state (
  id TEXT PRIMARY KEY CHECK (id = 'singleton'),
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'paused', 'stopped')),
  current_section_id TEXT,
  current_page INTEGER NOT NULL DEFAULT 1,
  section_products_imported INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  total_imported INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  message TEXT NOT NULL,
  product_id TEXT,
  section_id TEXT,
  asin TEXT,
  run_id TEXT
);

INSERT INTO automation_state (id, status, current_page, section_products_imported)
VALUES ('singleton', 'stopped', 1, 0)
ON CONFLICT (id) DO NOTHING;
`);
