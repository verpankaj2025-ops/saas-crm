-- ============================================================
-- 007_automation.sql
-- Automation rules and execution logs
-- ============================================================

CREATE TABLE automation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users (id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  trigger_type    automation_trigger NOT NULL,
  -- Trigger-specific config: e.g. {"channel_id": "...", "keyword": "hello"}
  trigger_config  JSONB NOT NULL DEFAULT '{}',
  -- Array of condition objects: [{"field": "contact.tags", "op": "contains", "value": "vip"}]
  conditions      JSONB NOT NULL DEFAULT '[]',
  -- Array of action objects: [{"type": "assign_agent", "agent_id": "..."}, {"type": "send_template", ...}]
  actions         JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  -- Lower number = higher priority when multiple rules match
  priority        INT NOT NULL DEFAULT 100,
  -- Execution stats (denormalized)
  run_count       INT NOT NULL DEFAULT 0,
  last_run_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_automation_rules_workspace ON automation_rules (workspace_id);
CREATE INDEX idx_automation_rules_trigger   ON automation_rules (workspace_id, trigger_type) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_automation_rules_priority  ON automation_rules (workspace_id, priority) WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE TRIGGER trg_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- automation_executions — immutable audit log per rule run
-- ============================================================

CREATE TABLE automation_executions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  rule_id               UUID NOT NULL REFERENCES automation_rules (id) ON DELETE CASCADE,
  -- The entity that fired the trigger
  trigger_entity_type   TEXT NOT NULL,            -- 'contact' | 'conversation' | 'message'
  trigger_entity_id     UUID NOT NULL,
  status                execution_status NOT NULL DEFAULT 'running',
  -- Step-level results for debugging: [{"action": "send_template", "status": "ok"}, ...]
  steps_log             JSONB NOT NULL DEFAULT '[]',
  error_message         TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  duration_ms           INT
  -- No updated_at — this is an append-only audit log
);

CREATE INDEX idx_automation_exec_workspace ON automation_executions (workspace_id);
CREATE INDEX idx_automation_exec_rule      ON automation_executions (rule_id);
CREATE INDEX idx_automation_exec_entity    ON automation_executions (trigger_entity_type, trigger_entity_id);
CREATE INDEX idx_automation_exec_status    ON automation_executions (workspace_id, status) WHERE status = 'running';
