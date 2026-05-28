-- ============================================================
-- 005_followups_appointments.sql
-- Follow-up tasks and booking appointments
-- ============================================================

-- ============================================================
-- followups — task / reminder tied to a contact
-- ============================================================

CREATE TABLE followups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations (id) ON DELETE SET NULL,
  assigned_to       UUID REFERENCES users (id) ON DELETE SET NULL,
  created_by        UUID REFERENCES users (id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  notes             TEXT,
  due_at            TIMESTAMPTZ NOT NULL,
  status            followup_status NOT NULL DEFAULT 'pending',
  priority          task_priority NOT NULL DEFAULT 'medium',
  completed_at      TIMESTAMPTZ,
  snoozed_until     TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_followups_workspace    ON followups (workspace_id);
CREATE INDEX idx_followups_contact      ON followups (contact_id);
CREATE INDEX idx_followups_assigned     ON followups (workspace_id, assigned_to);
CREATE INDEX idx_followups_due          ON followups (workspace_id, due_at) WHERE status = 'pending' AND deleted_at IS NULL;

CREATE TRIGGER trg_followups_updated_at
  BEFORE UPDATE ON followups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- appointments — bookings / scheduled meetings
-- ============================================================

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  assigned_to       UUID REFERENCES users (id) ON DELETE SET NULL,
  created_by        UUID REFERENCES users (id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ NOT NULL,
  timezone          TEXT NOT NULL DEFAULT 'UTC',
  location          TEXT,
  meeting_url       TEXT,
  status            appointment_status NOT NULL DEFAULT 'scheduled',
  reminder_sent_at  TIMESTAMPTZ,
  -- For external calendar sync (Google, Outlook event IDs)
  external_cal_id   TEXT,
  external_cal_type TEXT,                         -- 'google' | 'outlook' | 'ical'
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT appointments_time_order CHECK (end_at > start_at)
);

CREATE INDEX idx_appointments_workspace   ON appointments (workspace_id);
CREATE INDEX idx_appointments_contact     ON appointments (contact_id);
CREATE INDEX idx_appointments_assigned    ON appointments (workspace_id, assigned_to);
CREATE INDEX idx_appointments_start       ON appointments (workspace_id, start_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_status      ON appointments (workspace_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
