-- ============================================================
-- 004_conversations.sql
-- Conversations (inbox threads) and messages
-- ============================================================

CREATE TABLE conversations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  contact_id            UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  channel_id            UUID REFERENCES channels (id) ON DELETE SET NULL,
  assigned_to           UUID REFERENCES users (id) ON DELETE SET NULL,
  status                conversation_status NOT NULL DEFAULT 'open',
  subject               TEXT,
  -- Denormalized for fast inbox queries (updated by trigger/app)
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  unread_count          INT NOT NULL DEFAULT 0,
  -- AI context snapshot for this conversation thread
  ai_context            JSONB NOT NULL DEFAULT '{}',
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_conversations_workspace        ON conversations (workspace_id);
CREATE INDEX idx_conversations_contact          ON conversations (contact_id);
CREATE INDEX idx_conversations_assigned         ON conversations (workspace_id, assigned_to);
CREATE INDEX idx_conversations_status           ON conversations (workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_last_message     ON conversations (workspace_id, last_message_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- messages
-- ============================================================

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_type     message_sender_type NOT NULL,
  sender_id       UUID REFERENCES users (id) ON DELETE SET NULL, -- NULL when sender_type = 'contact' | 'bot'
  content         TEXT,
  content_type    message_content_type NOT NULL DEFAULT 'text',
  status          message_status NOT NULL DEFAULT 'sent',
  -- For media messages
  attachment_url      TEXT,
  attachment_metadata JSONB,                      -- {filename, size, mime_type, duration}
  -- Internal notes visible only to agents
  is_internal     BOOLEAN NOT NULL DEFAULT FALSE,
  -- Provider message ID for deduplication (WhatsApp, email msgid)
  external_id     TEXT,
  -- Raw provider payload for debugging
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No soft delete on messages — use conversation delete instead
);

CREATE INDEX idx_messages_conversation  ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_workspace     ON messages (workspace_id);
CREATE INDEX idx_messages_sender        ON messages (sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX idx_messages_external_id   ON messages (workspace_id, external_id) WHERE external_id IS NOT NULL;

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- conversation_participants — for group/team chats
-- ============================================================

CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at         TIMESTAMPTZ,

  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON conversation_participants (user_id);
