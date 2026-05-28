-- ============================================================
-- 001_initial_schema.sql
-- Run this single file against a fresh Supabase/PostgreSQL DB
-- to apply the full CRM SaaS schema in dependency order.
--
-- Usage (psql):
--   psql $DATABASE_URL -f migrations/001_initial_schema.sql
--
-- Usage (Supabase):
--   Paste into SQL Editor, or use supabase db push with
--   supabase/migrations/20240101000000_initial_schema.sql
-- ============================================================

\echo 'Applying 000_extensions...'
\ir ../schema/000_extensions.sql

\echo 'Applying 001_workspaces...'
\ir ../schema/001_workspaces.sql

\echo 'Applying 002_users...'
\ir ../schema/002_users.sql

\echo 'Applying 003_contacts...'
\ir ../schema/003_contacts.sql

\echo 'Applying 004_conversations...'
\ir ../schema/004_conversations.sql

\echo 'Applying 005_followups_appointments...'
\ir ../schema/005_followups_appointments.sql

\echo 'Applying 006_templates...'
\ir ../schema/006_templates.sql

\echo 'Applying 007_automation...'
\ir ../schema/007_automation.sql

\echo 'Applying 008_ai_memory...'
\ir ../schema/008_ai_memory.sql

\echo 'Applying 009_appointment_reminders...'
\ir ../schema/009_appointment_reminders.sql

\echo 'Schema applied successfully.'
