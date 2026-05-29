-- ============================================================
-- 003_message_status_timestamps.sql
--
-- Adds per-status timestamp columns to messages so the frontend
-- can show accurate delivery timelines and agents can see exactly
-- when each status transition occurred.
--
-- Five status timestamps mirror the five lifecycle states:
--   queued_at    — message created and enqueued for delivery
--   sent_at      — provider confirmed acceptance
--   delivered_at — device confirmed receipt
--   read_at      — recipient opened (terminal success)
--   failed_at    — delivery failed (may be retried → queued)
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS queued_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at     TIMESTAMPTZ;

-- ── Backfill existing rows ────────────────────────────────────
-- Use created_at / updated_at as best-effort approximations for
-- rows that existed before this migration.

UPDATE messages SET queued_at = created_at WHERE queued_at IS NULL;

UPDATE messages
  SET sent_at = updated_at
  WHERE sent_at IS NULL
    AND status IN ('sent', 'delivered', 'read');

UPDATE messages
  SET delivered_at = updated_at
  WHERE delivered_at IS NULL
    AND status IN ('delivered', 'read');

UPDATE messages
  SET read_at = updated_at
  WHERE read_at IS NULL
    AND status = 'read';

UPDATE messages
  SET failed_at = updated_at
  WHERE failed_at IS NULL
    AND status = 'failed';

-- ── Make queued_at non-nullable with a server default ─────────
-- All new inserts will get the current timestamp automatically.

ALTER TABLE messages
  ALTER COLUMN queued_at SET NOT NULL,
  ALTER COLUMN queued_at SET DEFAULT NOW();

-- ── Index: efficient "unread since" queries ───────────────────
CREATE INDEX IF NOT EXISTS idx_messages_read_at
  ON messages (conversation_id, read_at)
  WHERE read_at IS NULL AND sender_type = 'contact';
