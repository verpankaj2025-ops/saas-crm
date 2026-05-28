-- ============================================================
-- 006_templates.sql
-- Message templates (WhatsApp HSM, email, SMS)
-- ============================================================

CREATE TABLE templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  category        template_category NOT NULL DEFAULT 'custom',
  channel_type    channel_type NOT NULL,
  language        TEXT NOT NULL DEFAULT 'en',
  subject         TEXT,                           -- email subject line
  body            TEXT NOT NULL,
  -- List of variable names extracted from {{variable}} placeholders
  variables       JSONB NOT NULL DEFAULT '[]',    -- e.g. ["first_name", "booking_date"]
  -- WhatsApp Business API approval
  is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
  external_id     TEXT,                           -- WhatsApp template name or email template ID
  preview_url     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count     INT NOT NULL DEFAULT 0,         -- denormalized for sorting by popularity
  last_used_at    TIMESTAMPTZ,                   -- track recently used templates
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  UNIQUE NULLS NOT DISTINCT (workspace_id, name, channel_type, deleted_at)
);

CREATE INDEX idx_templates_workspace  ON templates (workspace_id);
CREATE INDEX idx_templates_channel    ON templates (workspace_id, channel_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_category   ON templates (workspace_id, category) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- broadcasts — bulk message campaigns
-- ============================================================

CREATE TABLE broadcasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  template_id     UUID REFERENCES templates (id) ON DELETE SET NULL,
  channel_id      UUID REFERENCES channels (id) ON DELETE SET NULL,
  created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  -- Filter criteria used to select recipients (stored as JSON query)
  audience_filter JSONB NOT NULL DEFAULT '{}',
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft | scheduled | sending | sent | failed | cancelled
  -- Delivery counters (updated in real-time by job)
  total_count     INT NOT NULL DEFAULT 0,
  sent_count      INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  failed_count    INT NOT NULL DEFAULT 0,
  read_count      INT NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_broadcasts_workspace  ON broadcasts (workspace_id);
CREATE INDEX idx_broadcasts_status     ON broadcasts (workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_broadcasts_scheduled  ON broadcasts (workspace_id, scheduled_at) WHERE status = 'scheduled';

CREATE TRIGGER trg_broadcasts_updated_at
  BEFORE UPDATE ON broadcasts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
