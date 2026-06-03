-- ============================================================
-- 007_leads.sql
--
-- Phase 6.5 Lead Management. Adds the `leads` table plus the
-- `lead_status` and `lead_source` enums. A lead is a sales
-- opportunity tied to a contact (many leads per contact) with
-- spa/clinic fields: source, package, amounts, status, agent.
--
-- Additive only — creates two new enum types and one new table.
-- No existing table or enum is altered; no backfill required.
--
-- Usage (psql):
--   psql $DATABASE_URL -f migrations/007_leads.sql
--
-- Usage (Supabase):
--   Paste into the SQL Editor and run.
--
-- Safe to run inside a single transaction (no CONCURRENTLY).
-- ============================================================

-- Lead lifecycle status (spa/clinic workflow).
CREATE TYPE lead_status AS ENUM
  ('new', 'contacted', 'qualified', 'booked', 'paid', 'lost');

-- Where the lead originated. Separate from contact_source so lead
-- source reporting can evolve independently.
CREATE TYPE lead_source AS ENUM
  ('whatsapp', 'meta_ads', 'website', 'google_business', 'manual', 'referral', 'other');


CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces (id)    ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts (id)      ON DELETE CASCADE,
  conversation_id UUID          REFERENCES conversations (id) ON DELETE SET NULL,
  channel_id      UUID          REFERENCES channels (id)      ON DELETE SET NULL,
  source          lead_source NOT NULL DEFAULT 'manual',
  package         TEXT,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Always consistent; overpayment/credit allowed (may be negative).
  balance_amount  NUMERIC(12,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  status          lead_status NOT NULL DEFAULT 'new',
  assigned_agent  UUID REFERENCES users (id) ON DELETE SET NULL,
  notes           TEXT,
  created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT leads_amount_nonneg CHECK (amount >= 0),
  CONSTRAINT leads_paid_nonneg   CHECK (paid_amount >= 0)
);

CREATE INDEX idx_leads_workspace ON leads (workspace_id)                  WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_contact   ON leads (contact_id);
CREATE INDEX idx_leads_status    ON leads (workspace_id, status)          WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_agent     ON leads (workspace_id, assigned_agent);
CREATE INDEX idx_leads_source    ON leads (workspace_id, source)          WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_created   ON leads (workspace_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
