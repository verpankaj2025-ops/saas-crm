-- ============================================================
-- 001_workspaces.sql
-- Multi-tenant root: workspaces and membership
-- ============================================================

CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,           -- URL-safe identifier e.g. "acme-corp"
  plan            workspace_plan NOT NULL DEFAULT 'free',
  owner_id        UUID,                           -- FK to users; set after user creation
  settings        JSONB NOT NULL DEFAULT '{}',    -- theme, timezone, locale, notification prefs
  metadata        JSONB NOT NULL DEFAULT '{}',    -- billing metadata, trial info
  trial_ends_at   TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ                     -- soft delete
);

-- Enforce lowercase slug
ALTER TABLE workspaces ADD CONSTRAINT workspaces_slug_format
  CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{2,62}[a-z0-9]$');

CREATE INDEX idx_workspaces_slug        ON workspaces (slug);
CREATE INDEX idx_workspaces_owner_id    ON workspaces (owner_id);
CREATE INDEX idx_workspaces_deleted_at  ON workspaces (deleted_at) WHERE deleted_at IS NULL;


-- ============================================================
-- workspace_members — user ↔ workspace with role
-- ============================================================

CREATE TABLE workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,                    -- FK to users (added after users table)
  role          member_role NOT NULL DEFAULT 'agent',
  invited_by    UUID,                             -- FK to users
  accepted_at   TIMESTAMPTZ,                      -- NULL = invite pending
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members (workspace_id);
CREATE INDEX idx_workspace_members_user      ON workspace_members (user_id);


-- ============================================================
-- channels — communication channels per workspace
-- ============================================================

CREATE TABLE channels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  type          channel_type NOT NULL,
  name          TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',      -- phone, API token (encrypted at app layer)
  webhook_url   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_channels_workspace    ON channels (workspace_id);
CREATE INDEX idx_channels_type         ON channels (workspace_id, type) WHERE deleted_at IS NULL;


-- ============================================================
-- Automatic updated_at trigger (reused across all tables)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
