-- ============================================================
-- 010_crm_memory.sql
-- Lightweight CRM Memory Layer - operational intelligence
-- No vector database, no embeddings, simple structured memory
-- ============================================================

-- Lead score type
CREATE TYPE lead_score AS ENUM ('cold', 'warm', 'hot');

-- Customer preferences stored in contacts.custom_fields
-- Structure: {"preferences": {"communication": "email", "timezone": "UTC", "language": "en"}}

-- Conversation summaries stored in ai_memories (without embeddings)
-- memory_type = 'conversation_summary', source = 'system'

-- Interaction summaries stored in ai_memories
-- memory_type = 'interaction_summary', source = 'system'

-- Lead scores stored in contacts.custom_fields
-- Structure: {"lead_score": "hot", "score_updated_at": "2024-01-01T00:00:00Z", "score_reason": "..."}

-- ============================================================
-- Function: Update lead score based on contact activity
-- ============================================================

CREATE OR REPLACE FUNCTION update_lead_score(p_contact_id UUID, p_workspace_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_message_count INTEGER;
  v_last_contacted TIMESTAMPTZ;
  v_appointment_count INTEGER;
  v_lead_score lead_score;
  v_score_reason TEXT;
BEGIN
  -- Count messages in last 30 days
  SELECT COUNT(m.id)
  INTO v_message_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.contact_id = p_contact_id
    AND c.workspace_id = p_workspace_id
    AND m.created_at > NOW() - INTERVAL '30 days';

  -- Get last contacted date
  SELECT last_contacted_at
  INTO v_last_contacted
  FROM contacts
  WHERE id = p_contact_id AND workspace_id = p_workspace_id;

  -- Count upcoming appointments
  SELECT COUNT(a.id)
  INTO v_appointment_count
  FROM appointments a
  WHERE a.contact_id = p_contact_id
    AND a.workspace_id = p_workspace_id
    AND a.status = 'scheduled'
    AND a.scheduled_at > NOW();

  -- Simple lead scoring logic
  IF v_appointment_count > 0 OR v_message_count >= 5 THEN
    v_lead_score := 'hot';
    v_score_reason := 'High engagement: ' || v_appointment_count || ' appointments, ' || v_message_count || ' messages in 30 days';
  ELSIF v_message_count >= 2 OR (v_last_contacted IS NOT NULL AND v_last_contacted > NOW() - INTERVAL '14 days') THEN
    v_lead_score := 'warm';
    v_score_reason := 'Moderate engagement: ' || v_message_count || ' messages in 30 days';
  ELSE
    v_lead_score := 'cold';
    v_score_reason := 'Low engagement: ' || v_message_count || ' messages in 30 days';
  END IF;

  -- Update custom_fields with lead score
  UPDATE contacts
  SET custom_fields = jsonb_set(
    jsonb_set(
      COALESCE(custom_fields, '{}'::jsonb),
      '{lead_score}',
      to_jsonb(v_lead_score::text)
    ),
    '{score_updated_at}',
    to_jsonb(NOW()::text)
  ),
  custom_fields = jsonb_set(
    custom_fields,
    '{score_reason}',
    to_jsonb(v_score_reason)
  )
  WHERE id = p_contact_id AND workspace_id = p_workspace_id;
END;
$$;

-- ============================================================
-- Function: Generate simple conversation summary
-- ============================================================

CREATE OR REPLACE FUNCTION generate_conversation_summary(p_conversation_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_summary TEXT;
  v_message_count INTEGER;
  v_first_message TIMESTAMPTZ;
  v_last_message TIMESTAMPTZ;
BEGIN
  -- Get basic stats
  SELECT 
    COUNT(m.id),
    MIN(m.created_at),
    MAX(m.created_at)
  INTO v_message_count, v_first_message, v_last_message
  FROM messages m
  WHERE m.conversation_id = p_conversation_id;

  -- Generate simple summary
  v_summary := 'Conversation with ' || v_message_count || ' messages';
  
  IF v_first_message IS NOT NULL THEN
    v_summary := v_summary || ', started ' || to_char(v_first_message, 'Mon DD, YYYY');
  END IF;
  
  IF v_last_message IS NOT NULL THEN
    v_summary := v_summary || ', last activity ' || to_char(v_last_message, 'Mon DD, YYYY');
  END IF;

  RETURN v_summary;
END;
$$;
