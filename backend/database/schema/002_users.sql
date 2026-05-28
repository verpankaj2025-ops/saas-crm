-- ============================================================
-- 002_users.sql
-- User profiles — extends Supabase auth.users via user_id FK
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- When using Supabase Auth, this mirrors auth.users.id:
  -- REFERENCES auth.users (id) ON DELETE CASCADE
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  avatar_url      TEXT,
  phone           TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  locale          TEXT NOT NULL DEFAULT 'en',
  metadata        JSONB NOT NULL DEFAULT '{}',    -- onboarding state, preferences
  last_login_at   TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ                     -- soft delete; keeps FK integrity
);

CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_deleted_at  ON users (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- Add FK constraints that required users to exist first
-- ============================================================

ALTER TABLE workspaces
  ADD CONSTRAINT fk_workspaces_owner
  FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE workspace_members
  ADD CONSTRAINT fk_workspace_members_user
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE workspace_members
  ADD CONSTRAINT fk_workspace_members_invited_by
  FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE SET NULL;
