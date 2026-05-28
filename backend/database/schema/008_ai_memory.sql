-- ============================================================
-- 008_ai_memory.sql
-- AI memory store — vector embeddings + structured facts
-- Requires: pgvector extension (Supabase AI add-on)
-- ============================================================

CREATE TABLE ai_memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  -- Entity this memory belongs to
  entity_type     TEXT NOT NULL,                  -- 'contact' | 'conversation' | 'workspace'
  entity_id       UUID NOT NULL,
  memory_type     ai_memory_type NOT NULL,
  -- Human-readable memory content
  content         TEXT NOT NULL,
  -- 1536-dim vector for OpenAI text-embedding-3-small
  -- NULL until embedding job processes the row
  embedding       VECTOR(1536),
  -- Source that created this memory
  source          TEXT NOT NULL DEFAULT 'ai',     -- 'ai' | 'agent' | 'system'
  -- Structured attributes: {"sentiment": "positive", "intent": "purchase", "topics": [...]}
  attributes      JSONB NOT NULL DEFAULT '{}',
  -- Relevance score (0-1); decays over time via scheduled job
  relevance_score FLOAT NOT NULL DEFAULT 1.0,
  expires_at      TIMESTAMPTZ,                    -- NULL = permanent
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_memories_workspace    ON ai_memories (workspace_id);
CREATE INDEX idx_ai_memories_entity       ON ai_memories (entity_type, entity_id);
CREATE INDEX idx_ai_memories_type         ON ai_memories (workspace_id, memory_type);
CREATE INDEX idx_ai_memories_expires      ON ai_memories (expires_at) WHERE expires_at IS NOT NULL;
-- IVFFlat index for approximate nearest-neighbor search
-- Build AFTER initial data load: CREATE INDEX CONCURRENTLY ...
-- Adjust lists = rows / 1000, capped at 1000
CREATE INDEX idx_ai_memories_embedding    ON ai_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER trg_ai_memories_updated_at
  BEFORE UPDATE ON ai_memories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- Convenience function: semantic search for an entity
-- Returns top-k memories ordered by cosine similarity
-- ============================================================

CREATE OR REPLACE FUNCTION search_ai_memories(
  p_workspace_id  UUID,
  p_entity_type   TEXT,
  p_entity_id     UUID,
  p_query_vector  VECTOR(1536),
  p_limit         INT DEFAULT 5
)
RETURNS TABLE (
  id            UUID,
  memory_type   ai_memory_type,
  content       TEXT,
  attributes    JSONB,
  similarity    FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    m.id,
    m.memory_type,
    m.content,
    m.attributes,
    1 - (m.embedding <=> p_query_vector) AS similarity
  FROM ai_memories m
  WHERE
    m.workspace_id  = p_workspace_id
    AND m.entity_type = p_entity_type
    AND m.entity_id   = p_entity_id
    AND m.embedding IS NOT NULL
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY m.embedding <=> p_query_vector
  LIMIT p_limit;
$$;
