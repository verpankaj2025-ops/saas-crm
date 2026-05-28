-- ============================================================
-- 003_contacts.sql
-- Contacts, tags, notes — core CRM entities
-- ============================================================

CREATE TABLE contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  first_name          TEXT NOT NULL,
  last_name           TEXT,
  email               TEXT,
  phone               TEXT,
  company             TEXT,
  job_title           TEXT,
  avatar_url          TEXT,
  status              contact_status NOT NULL DEFAULT 'active',
  source              contact_source NOT NULL DEFAULT 'manual',
  assigned_to         UUID REFERENCES users (id) ON DELETE SET NULL,
  created_by          UUID REFERENCES users (id) ON DELETE SET NULL,
  -- Flexible fields: stored as {"field_name": value}
  custom_fields       JSONB NOT NULL DEFAULT '{}',
  -- AI-ready: plain-text summary auto-generated/updated by AI layer
  ai_summary          TEXT,
  last_contacted_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  -- One phone/email per workspace (soft-delete aware)
  UNIQUE NULLS NOT DISTINCT (workspace_id, email, deleted_at),
  UNIQUE NULLS NOT DISTINCT (workspace_id, phone, deleted_at)
);

CREATE INDEX idx_contacts_workspace         ON contacts (workspace_id);
CREATE INDEX idx_contacts_assigned_to       ON contacts (assigned_to);
CREATE INDEX idx_contacts_status            ON contacts (workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_last_contacted    ON contacts (workspace_id, last_contacted_at DESC);
CREATE INDEX idx_contacts_email             ON contacts (workspace_id, lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_phone             ON contacts (workspace_id, phone) WHERE deleted_at IS NULL;
-- Trigram index for fast name search
CREATE INDEX idx_contacts_name_trgm         ON contacts USING gin ((first_name || ' ' || COALESCE(last_name, '')) gin_trgm_ops);

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- tags
-- ============================================================

CREATE TABLE tags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#6366f1',  -- hex color for UI
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (workspace_id, lower(name))
);

CREATE INDEX idx_tags_workspace ON tags (workspace_id);


-- ============================================================
-- contact_tags — junction
-- ============================================================

CREATE TABLE contact_tags (
  contact_id    UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  tag_id        UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  tagged_by     UUID REFERENCES users (id) ON DELETE SET NULL,
  tagged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX idx_contact_tags_tag ON contact_tags (tag_id);


-- ============================================================
-- contact_notes — freeform notes; AI can read and write these
-- ============================================================

CREATE TABLE contact_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  contact_id    UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  author_id     UUID REFERENCES users (id) ON DELETE SET NULL,
  content       TEXT NOT NULL,
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  source        TEXT NOT NULL DEFAULT 'manual',   -- 'manual' | 'ai' | 'import'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_contact_notes_contact   ON contact_notes (contact_id);
CREATE INDEX idx_contact_notes_workspace ON contact_notes (workspace_id);

CREATE TRIGGER trg_contact_notes_updated_at
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
