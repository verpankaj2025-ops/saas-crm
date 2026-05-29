-- ============================================================
-- 002_conversation_uniqueness.sql
--
-- Fixes the race condition in WhatsApp inbound message processing
-- where concurrent webhook events can create duplicate conversations
-- for the same contact + channel.
--
-- Strategy: DB-enforced partial unique index so that even if two
-- application processes race past the application-level check, the
-- second INSERT fails at the DB level with error code 23505, which
-- the application catches and recovers from by fetching the winner.
-- ============================================================


-- ── 1. Partial unique index: one open/pending conversation per
--       contact+channel per workspace (status = 'open' | 'pending').
--
--  When a conversation is resolved/archived, the index entry is
--  dropped automatically, allowing a new open conversation to be
--  created for the same pair in the future.
-- ──────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_active
  ON conversations (workspace_id, contact_id, channel_id)
  WHERE status IN ('open', 'pending')
    AND deleted_at IS NULL;


-- ── 2. Atomic unread counter increment + last-message metadata.
--
--  Replaces the read-modify-write pattern in the application layer
--  (SELECT unread_count → UPDATE unread_count + 1) which is not
--  safe under concurrent message processing. A single UPDATE using
--  column = column + 1 is atomic at the row level in Postgres.
-- ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_conversation_unread(
  p_conversation_id UUID,
  p_workspace_id    UUID,
  p_preview         TEXT,
  p_last_at         TIMESTAMPTZ
) RETURNS VOID
  LANGUAGE SQL
  SECURITY INVOKER
AS $$
  UPDATE conversations
  SET
    unread_count         = unread_count + 1,
    last_message_at      = p_last_at,
    last_message_preview = p_preview,
    updated_at           = NOW()
  WHERE id           = p_conversation_id
    AND workspace_id = p_workspace_id;
$$;
