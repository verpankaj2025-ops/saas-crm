-- ============================================================
-- 005_message_conversation_sync_trigger.sql
--
-- Makes message insert + conversation preview update atomic by
-- moving the UPDATE into an AFTER INSERT trigger on messages.
--
-- Problem being solved:
--   The application currently runs two separate queries:
--     1. INSERT INTO messages
--     2. UPDATE conversations SET last_message_at, last_message_preview
--   If the process crashes or the network drops between them, the
--   conversation preview becomes permanently stale — inbox sort order
--   and previews are wrong until something else overwrites them.
--
-- Solution:
--   An AFTER INSERT trigger fires inside the same PostgreSQL transaction
--   as the message insert. If the trigger UPDATE fails, the INSERT also
--   rolls back. The two operations are now a single atomic unit with no
--   application coordination required.
--
-- Scope:
--   - Fires on all non-internal message inserts (outbound, inbound,
--     future bulk imports — every write path is covered automatically)
--   - Internal notes (is_internal = TRUE) are excluded; they are
--     agent-only and should not affect the public inbox preview
--   - Forward-only: only advances last_message_at, never goes backward
--     (prevents out-of-order inserts from overwriting a newer preview)
-- ============================================================


-- ── Trigger function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Internal notes are not visible to contacts; skip inbox sync.
  IF NEW.is_internal THEN
    RETURN NEW;
  END IF;

  UPDATE conversations
  SET
    last_message_at      = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.content, ''), 120),
    updated_at           = NOW()
  WHERE id           = NEW.conversation_id
    AND workspace_id = NEW.workspace_id
    -- Forward-only guard: do not let a back-dated or out-of-order
    -- insert overwrite a more recent message's preview.
    AND (last_message_at IS NULL OR NEW.created_at >= last_message_at);

  RETURN NEW;
END;
$$;


-- ── Attach trigger to messages table ─────────────────────────

CREATE TRIGGER trg_messages_sync_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_conversation_last_message();
