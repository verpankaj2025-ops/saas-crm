-- ============================================================
-- 000_extensions.sql
-- Enable PostgreSQL extensions and define shared enums
-- Supabase: run once per project, requires superuser
-- ============================================================

-- Core extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram full-text search on contacts
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for AI embeddings (Supabase AI)

-- ============================================================
-- Shared ENUM types
-- ============================================================

CREATE TYPE workspace_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');

CREATE TYPE member_role AS ENUM ('owner', 'admin', 'agent', 'viewer');

CREATE TYPE contact_status AS ENUM ('active', 'inactive', 'archived');

CREATE TYPE contact_source AS ENUM ('whatsapp', 'email', 'sms', 'web', 'instagram', 'manual', 'import', 'api');

CREATE TYPE channel_type AS ENUM ('whatsapp', 'email', 'sms', 'instagram', 'web_chat');

CREATE TYPE conversation_status AS ENUM ('open', 'pending', 'resolved', 'archived');

CREATE TYPE message_sender_type AS ENUM ('contact', 'agent', 'bot', 'system');

CREATE TYPE message_content_type AS ENUM ('text', 'image', 'audio', 'video', 'document', 'location', 'template', 'sticker');

CREATE TYPE message_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');

CREATE TYPE followup_status AS ENUM ('pending', 'completed', 'cancelled', 'snoozed');

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show');

CREATE TYPE template_category AS ENUM ('greeting', 'followup', 'appointment', 'payment', 'custom');

CREATE TYPE automation_trigger AS ENUM (
  'contact_created', 'contact_updated', 'tag_added', 'tag_removed',
  'message_received', 'conversation_opened', 'conversation_resolved',
  'appointment_scheduled', 'appointment_cancelled',
  'followup_due', 'form_submitted', 'custom'
);

CREATE TYPE execution_status AS ENUM ('running', 'completed', 'failed', 'skipped');

CREATE TYPE ai_memory_type AS ENUM ('summary', 'preference', 'fact', 'instruction', 'context');
