-- ============================================================
-- Migration: 02_automation_tables.sql
-- Creates: automation_state, automation_logs
-- Schema derived from:
--   src/app/api/cron/importer/route.ts
--   src/app/api/admin/automation/route.ts
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLE: automation_state  (singleton row, id = 'singleton')
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_state (
  -- Identity
  id                       TEXT        PRIMARY KEY DEFAULT 'singleton',

  -- Runtime status: 'running' | 'paused' | 'stopped'
  status                   TEXT        NOT NULL DEFAULT 'stopped'
                           CHECK (status IN ('running', 'paused', 'stopped')),

  -- Current position in the import cycle
  current_section_id       TEXT        REFERENCES public.sections(id) ON DELETE SET NULL,
  current_page             INTEGER     NOT NULL DEFAULT 1,
  section_products_imported INTEGER    NOT NULL DEFAULT 0,

  -- Scheduling: Worker reads next_run_at and skips if now < next_run_at
  next_run_at              TIMESTAMPTZ NULL,
  last_run_at              TIMESTAMPTZ NULL,

  -- Distributed lock: set to NOW() when a Worker is executing,
  -- cleared to NULL on completion. Stale locks older than 10 min
  -- are overridden by the Worker automatically.
  locked_at                TIMESTAMPTZ NULL,

  -- Lifetime counters
  total_imported           INTEGER     NOT NULL DEFAULT 0,
  total_skipped            INTEGER     NOT NULL DEFAULT 0,
  total_failed             INTEGER     NOT NULL DEFAULT 0,

  -- Audit
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce singleton: only one row may ever exist
-- (PRIMARY KEY on 'singleton' already prevents extra rows,
--  but this constraint makes the intent explicit)
ALTER TABLE public.automation_state
  ADD CONSTRAINT automation_state_singleton
  CHECK (id = 'singleton');

-- Index: not needed on a single-row table, but keep for FK lookup
CREATE INDEX IF NOT EXISTS idx_automation_state_status
  ON public.automation_state (status);


-- ────────────────────────────────────────────────────────────
-- TABLE: automation_logs  (append-only event log)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_logs (
  -- Identity
  id                       BIGSERIAL   PRIMARY KEY,

  -- Log level: 'info' | 'success' | 'warning' | 'error'
  level                    TEXT        NOT NULL DEFAULT 'info'
                           CHECK (level IN ('info', 'success', 'warning', 'error')),

  -- Human-readable message
  message                  TEXT        NOT NULL,

  -- Optional context
  section_id               TEXT        REFERENCES public.sections(id) ON DELETE SET NULL,
  asin                     TEXT        NULL,

  -- Timestamp (used for ORDER BY in admin UI)
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: admin UI orders by created_at DESC LIMIT 50
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at
  ON public.automation_logs (created_at DESC);

-- Optional: auto-purge logs older than 30 days to avoid table bloat
-- (Enable only if pg_cron is available on your Supabase plan)
-- SELECT cron.schedule('purge-automation-logs', '0 3 * * *',
--   $$DELETE FROM public.automation_logs WHERE created_at < NOW() - INTERVAL '30 days'$$);


-- ────────────────────────────────────────────────────────────
-- SINGLETON ROW: insert only if it doesn't exist yet
-- ────────────────────────────────────────────────────────────
INSERT INTO public.automation_state (
  id,
  status,
  current_section_id,
  current_page,
  section_products_imported,
  next_run_at,
  last_run_at,
  locked_at,
  total_imported,
  total_skipped,
  total_failed,
  updated_at
)
VALUES (
  'singleton',
  'stopped',
  NULL,
  1,
  0,
  NULL,
  NULL,
  NULL,
  0,
  0,
  0,
  NOW()
)
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Both tables: blocked for anon/authenticated public users.
-- Only the service_role key (supabaseAdmin) can read/write.
-- ────────────────────────────────────────────────────────────

-- automation_state
ALTER TABLE public.automation_state ENABLE ROW LEVEL SECURITY;

-- Block all public access (anon + authenticated)
-- supabaseAdmin uses service_role which bypasses RLS entirely.
CREATE POLICY "automation_state: no public access"
  ON public.automation_state
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- automation_logs
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_logs: no public access"
  ON public.automation_logs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- ────────────────────────────────────────────────────────────
-- GRANT: ensure service_role has full access (default in Supabase,
-- but explicit for clarity)
-- ────────────────────────────────────────────────────────────
GRANT ALL ON public.automation_state TO service_role;
GRANT ALL ON public.automation_logs  TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.automation_logs_id_seq TO service_role;
