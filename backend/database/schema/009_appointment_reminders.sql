-- ============================================================
-- 009_appointment_reminders.sql
-- Appointment reminders with status tracking
-- ============================================================

-- Add conversation_id to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_conversation ON appointments (conversation_id);

-- ============================================================
-- appointment_reminders — individual reminder tracking
-- ============================================================

CREATE TYPE reminder_status AS ENUM ('scheduled', 'sent', 'completed', 'cancelled', 'failed');

CREATE TABLE appointment_reminders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  appointment_id    UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  reminder_type     TEXT NOT NULL, -- '24h' | '2h'
  status            reminder_status NOT NULL DEFAULT 'scheduled',
  scheduled_for     TIMESTAMPTZ NOT NULL,
  sent_at           TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  failed_reason     TEXT,
  retry_count       INTEGER NOT NULL DEFAULT 0,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT appointment_reminders_unique UNIQUE (appointment_id, reminder_type)
);

CREATE INDEX idx_appointment_reminders_workspace   ON appointment_reminders (workspace_id);
CREATE INDEX idx_appointment_reminders_appointment ON appointment_reminders (appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled   ON appointment_reminders (scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_appointment_reminders_status      ON appointment_reminders (workspace_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_appointment_reminders_updated_at
  BEFORE UPDATE ON appointment_reminders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
