-- supabase_setup.sql
-- ============================================================================
-- Defense-in-depth hardening for the ApplyBoard database.
-- Run this in the Supabase SQL editor (or psql as an admin) ONCE, online only.
--
-- Two independent parts:
--   PART A — Row Level Security (RLS): protects the table from access via the
--            PUBLIC anon key (PostgREST), since that key ships in the frontend.
--   PART B — A least-privilege login role for the backend, so a leaked
--            DATABASE_URL can't drop tables or touch the rest of the database.
--
-- IMPORTANT: the FastAPI backend already enforces per-user isolation in code
-- (every query filters by the user_id from the verified JWT). RLS here is a
-- second wall, mainly against direct anon-key access — not a replacement.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PART A — Row Level Security
-- ---------------------------------------------------------------------------
-- Turn RLS on. With RLS enabled and no permissive policy, the anon and
-- authenticated roles (i.e. anyone using the public anon key against the
-- auto-generated REST API) are denied access to every row by default.
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Optional: if you ever DO want to read rows directly via Supabase/PostgREST
-- with a user's JWT (the dashboard currently goes through the backend instead),
-- this policy scopes each user to only their own rows. Safe to keep regardless.
DROP POLICY IF EXISTS "users read own applications" ON public.job_applications;
CREATE POLICY "users read own applications"
    ON public.job_applications
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users modify own applications" ON public.job_applications;
CREATE POLICY "users modify own applications"
    ON public.job_applications
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);


-- ---------------------------------------------------------------------------
-- PART B — Least-privilege backend role
-- ---------------------------------------------------------------------------
-- Replace the placeholder password before running, then point the backend's
-- DATABASE_URL at THIS role instead of the postgres superuser.
--
--   1. CREATE the role with only the privileges the app needs.
--   2. The backend filters by user_id itself, so it must not be blocked by the
--      RLS above -> grant BYPASSRLS. (This is still far weaker than postgres:
--      no DDL, no access to any other table.)

CREATE ROLE applyboard_app LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD' BYPASSRLS;

GRANT CONNECT ON DATABASE postgres TO applyboard_app;
GRANT USAGE  ON SCHEMA public       TO applyboard_app;

-- CRUD on the one table the app owns — nothing else.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO applyboard_app;

-- The integer primary key uses a sequence; the role needs it for INSERTs.
GRANT USAGE, SELECT ON SEQUENCE public.job_applications_id_seq TO applyboard_app;


-- ---------------------------------------------------------------------------
-- AFTER RUNNING
-- ---------------------------------------------------------------------------
--   • Update DATABASE_URL (Render env var + your local backend/.env) to:
--       postgresql://applyboard_app:CHANGE_ME_STRONG_PASSWORD@HOST:5432/postgres
--   • ROTATE the old postgres password (it has been exposed) in
--       Supabase -> Settings -> Database -> Reset database password.
--   • Verify the app still creates/reads/updates/deletes applications.
-- ---------------------------------------------------------------------------
