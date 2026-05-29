-- ============================================================
-- 004_contact_normalized_phone.sql
--
-- Replaces the ILIKE '%number%' phone lookup with an exact-match
-- B-tree index lookup on a dedicated normalized_phone column.
--
-- Problem:
--   ILIKE with a leading wildcard ("%919876543210") cannot use any
--   B-tree index — PostgreSQL must scan every contact row in the
--   workspace on every inbound WhatsApp message.
--
-- Solution:
--   normalized_phone stores only digits (no "+", no spaces, no dashes).
--   A unique partial index on (workspace_id, normalized_phone) WHERE
--   deleted_at IS NULL serves dual purpose:
--     1. O(log n) exact-match lookup — replaces the full table scan
--     2. Uniqueness enforcement — replaces the old phone constraint for
--        the webhook-driven findOrCreate path
--
-- Normalization rule:
--   phone "+91 98765 43210" → normalized_phone "919876543210"
--   phone "+1 (555) 234-5678" → normalized_phone "15552345678"
--   phone NULL → normalized_phone NULL
-- ============================================================


-- ── 1. Add column ─────────────────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS normalized_phone TEXT;


-- ── 2. Trigger function: auto-sync normalized_phone from phone ─
--
-- Fires BEFORE INSERT OR UPDATE OF phone so the computed value is
-- always in sync. Application code writes only `phone`; the trigger
-- maintains `normalized_phone` transparently.

CREATE OR REPLACE FUNCTION sync_contact_normalized_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    NEW.normalized_phone := NULL;
  ELSE
    -- Strip every non-digit character (spaces, dashes, parentheses, "+")
    NEW.normalized_phone := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
    -- Treat an all-whitespace phone that left no digits as NULL
    IF NEW.normalized_phone = '' THEN
      NEW.normalized_phone := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contacts_normalize_phone
  BEFORE INSERT OR UPDATE OF phone ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_normalized_phone();


-- ── 3. Backfill existing rows ──────────────────────────────────
--
-- Apply the same normalization to all pre-migration contacts.
-- Touch only the normalized_phone column; the trigger does not fire
-- on direct UPDATE of normalized_phone, so we compute inline.

UPDATE contacts
SET normalized_phone = CASE
  WHEN phone IS NULL OR phone = ''
    THEN NULL
  WHEN regexp_replace(phone, '[^0-9]', '', 'g') = ''
    THEN NULL
  ELSE regexp_replace(phone, '[^0-9]', '', 'g')
END
WHERE normalized_phone IS NULL;


-- ── 4. Unique partial index ────────────────────────────────────
--
-- One active contact per normalized phone per workspace.
-- Partial (WHERE deleted_at IS NULL) so soft-deleted contacts
-- do not block re-use of the same number.
--
-- This index IS the primary lookup path for findOrCreateByPhone —
-- no separate lookup index needed.

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_normalized_phone
  ON contacts (workspace_id, normalized_phone)
  WHERE deleted_at IS NULL;
