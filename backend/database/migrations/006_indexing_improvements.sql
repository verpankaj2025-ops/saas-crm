-- ============================================================
-- 006_indexing_improvements.sql
--
-- Production indexing audit — adds missing indexes identified by
-- cross-referencing every repository query pattern against the
-- existing schema indexes. All CREATE INDEX statements use
-- CONCURRENTLY so they can run on a live database without locking
-- writes. Remove CONCURRENTLY if running inside a transaction.
--
-- Execution order matters: pg_trgm must be enabled (000_extensions).
-- ============================================================


-- ============================================================
-- 1. CONVERSATIONS — Inbox composite (CRITICAL)
--
-- Problem:
--   findAll() always orders by last_message_at DESC. When a status
--   filter is added (the most common case: status='open'), the planner
--   must choose between idx_conversations_status (good filter, needs
--   sort) or idx_conversations_last_message (good sort, needs filter).
--   Either way, a secondary pass is required — at scale this degrades
--   every single inbox page load.
--
-- Fix:
--   A single composite index covering workspace + status + sort column
--   lets PostgreSQL do one ordered index scan with no re-sort.
--
-- Query served:
--   WHERE workspace_id = $1 AND status = $2 AND deleted_at IS NULL
--   ORDER BY last_message_at DESC NULLS LAST
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_inbox
  ON conversations (workspace_id, status, last_message_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;


-- ============================================================
-- 2. CONVERSATIONS — Assigned-to inbox (HIGH)
--
-- Problem:
--   idx_conversations_assigned covers (workspace_id, assigned_to) but
--   has no last_message_at. Every assigned-agent inbox query scans all
--   conversations assigned to the agent then sorts the results —
--   O(n log n) instead of O(log n).
--
-- Fix:
--   Extend with the sort column. The old index can be dropped after
--   verifying no queries depend on it without the sort.
--
-- Query served:
--   WHERE workspace_id = $1 AND assigned_to = $2 AND deleted_at IS NULL
--   ORDER BY last_message_at DESC NULLS LAST
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_assigned_inbox
  ON conversations (workspace_id, assigned_to, last_message_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;

-- Old index (no sort column) can be dropped once traffic confirms the
-- new index is being used:
--   DROP INDEX CONCURRENTLY idx_conversations_assigned;


-- ============================================================
-- 3. CONVERSATIONS — Channel filter (HIGH)
--
-- Problem:
--   findAll() supports filter.channel_id but there is no index on
--   channel_id — zero index coverage, full workspace scan.
--
-- Query served:
--   WHERE workspace_id = $1 AND channel_id = $2 AND deleted_at IS NULL
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_channel
  ON conversations (workspace_id, channel_id)
  WHERE deleted_at IS NULL;


-- ============================================================
-- 4. FOLLOWUPS — cancelByConversation (CRITICAL — hot path)
--
-- Problem:
--   cancelByConversation() fires on EVERY inbound WhatsApp message.
--   The query filters by workspace_id + conversation_id + status but
--   no index covers conversation_id on followups. PostgreSQL must
--   scan every followup in the workspace on every message receipt.
--
-- Fix:
--   Partial index covering the two active statuses only. Since
--   conversation_id has high cardinality (one per conversation),
--   this index will be very selective.
--
-- Query served:
--   WHERE workspace_id = $1 AND conversation_id = $2
--     AND status IN ('pending','snoozed') AND deleted_at IS NULL
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_conversation_active
  ON followups (workspace_id, conversation_id)
  WHERE status IN ('pending', 'snoozed') AND deleted_at IS NULL;


-- ============================================================
-- 5. MESSAGES — Unique external_id constraint (HIGH)
--
-- Problem:
--   idx_messages_external_id is a non-unique index. findByExternalId()
--   and updateStatusByExternalId() rely on external_id being unique
--   per workspace, but the DB does not enforce this. Two concurrent
--   inserts with the same external_id can both succeed, and the index
--   scan does not guarantee a single-row stop.
--
-- Fix:
--   Promote to a UNIQUE index. This also serves as the last-resort
--   dedup guard when the Redis idempotency lock is unavailable.
--
-- ⚠️  PREREQUISITE: Run this query first to check for existing
--   duplicates that would block the unique index creation:
--
--   SELECT workspace_id, external_id, count(*)
--   FROM messages
--   WHERE external_id IS NOT NULL
--   GROUP BY workspace_id, external_id
--   HAVING count(*) > 1;
--
--   If duplicates exist, deduplicate before running this migration.
-- ============================================================

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_external_id_unique
  ON messages (workspace_id, external_id)
  WHERE external_id IS NOT NULL;

-- Old non-unique index can be dropped after the unique one is confirmed:
--   DROP INDEX CONCURRENTLY idx_messages_external_id;


-- ============================================================
-- 6. MESSAGES — Stable compound ordering index (HIGH)
--
-- Problem:
--   findByConversation now orders by (created_at DESC, id DESC) to
--   eliminate same-timestamp instability. The existing index:
--     idx_messages_conversation (conversation_id, created_at DESC)
--   does not include `id`, so PostgreSQL adds a sort step for
--   tie-breaking. With high message volume this adds measurable cost.
--
-- Fix:
--   Replace with a composite covering both sort columns. PostgreSQL
--   can then serve the full ORDER BY from the index with no extra sort.
--
-- Query served:
--   WHERE conversation_id = $1
--   ORDER BY created_at DESC, id DESC
--   LIMIT N
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_stable
  ON messages (conversation_id, created_at DESC, id DESC);

-- Drop the old index after confirming the new one is used:
--   DROP INDEX CONCURRENTLY idx_messages_conversation;


-- ============================================================
-- 7. MESSAGES — Outbound status lookup (MEDIUM)
--
-- Problem:
--   No index supports "find all failed outbound messages for a
--   workspace" (dead-letter review, retry dashboard). The workspace
--   index alone forces a full workspace scan filtered by status.
--
-- Query served:
--   WHERE workspace_id = $1 AND status = 'failed'
--     AND sender_type != 'contact'
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_outbound_status
  ON messages (workspace_id, status)
  WHERE sender_type IN ('agent', 'bot');


-- ============================================================
-- 7. CONTACTS — Sort by created_at (MEDIUM)
--
-- Problem:
--   findAll() defaults to ORDER BY created_at DESC. The workspace
--   index covers the workspace_id filter but not the sort column,
--   forcing a sort of all contacts in the workspace.
--
-- Query served:
--   WHERE workspace_id = $1 AND deleted_at IS NULL
--   ORDER BY created_at DESC
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_created_at
  ON contacts (workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;


-- ============================================================
-- 8. CONTACTS — Email trigram search (MEDIUM)
--
-- Problem:
--   findAll() search uses email.ilike.%${s}% but there is no trigram
--   GIN index on email — only a btree on lower(email). ILIKE with a
--   leading wildcard cannot use a btree index.
--
-- ⚠️  Requires pg_trgm extension (already enabled in 000_extensions).
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_email_trgm
  ON contacts USING gin (lower(email) gin_trgm_ops)
  WHERE deleted_at IS NULL AND email IS NOT NULL;


-- ============================================================
-- 9. CONTACTS — Company trigram search (MEDIUM)
--
-- Problem:
--   findAll() search includes company.ilike.%${s}% with no GIN index.
--   Full workspace scan for every company name search.
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_company_trgm
  ON contacts USING gin (lower(company) gin_trgm_ops)
  WHERE deleted_at IS NULL AND company IS NOT NULL;


-- ============================================================
-- 10. CONTACT NOTES — Partial index excluding soft-deleted (LOW)
--
-- Problem:
--   idx_contact_notes_contact covers (contact_id) without a
--   deleted_at IS NULL predicate. Every note lookup scans deleted
--   notes too and applies the filter at runtime.
--
-- Query served:
--   WHERE contact_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_notes_active
  ON contact_notes (contact_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Old unfiltered indexes can be dropped after confirming usage:
--   DROP INDEX CONCURRENTLY idx_contact_notes_contact;
--   DROP INDEX CONCURRENTLY idx_contact_notes_workspace;
