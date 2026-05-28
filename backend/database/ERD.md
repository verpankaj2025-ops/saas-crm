# CRM SaaS — Entity Relationship Document

## Relationship Map

```
workspaces
  ├── workspace_members ──→ users
  ├── channels
  ├── contacts
  │     ├── contact_tags ──→ tags
  │     ├── contact_notes
  │     ├── followups
  │     ├── appointments
  │     └── conversations
  │           ├── messages
  │           ├── conversation_participants ──→ users
  │           └── followups (optional link)
  ├── templates
  ├── broadcasts ──→ templates
  ├── automation_rules
  │     └── automation_executions
  └── ai_memories
```

## Table Inventory

| Table | Rows est. | Tenant col | Soft delete | Notes |
|---|---|---|---|---|
| `workspaces` | Low | — | ✅ | Root entity |
| `workspace_members` | Low | `workspace_id` | ❌ | Unique per user+workspace |
| `users` | Low | — | ✅ | Auth profile; 1 user → N workspaces |
| `channels` | Low | `workspace_id` | ✅ | WhatsApp, email, etc. |
| `contacts` | High | `workspace_id` | ✅ | Core CRM entity |
| `tags` | Low | `workspace_id` | ❌ | Shared label store |
| `contact_tags` | Medium | — | ❌ | Junction; cascades with contact |
| `contact_notes` | Medium | `workspace_id` | ✅ | Human + AI authored |
| `conversations` | High | `workspace_id` | ✅ | Inbox threads |
| `messages` | Very high | `workspace_id` | ❌ | Append-only; archive via conversation |
| `conversation_participants` | Medium | — | ❌ | Agent team assignment |
| `followups` | Medium | `workspace_id` | ✅ | Task/reminder per contact |
| `appointments` | Medium | `workspace_id` | ✅ | Bookings with calendar sync |
| `templates` | Low | `workspace_id` | ✅ | WhatsApp HSM + email |
| `broadcasts` | Low | `workspace_id` | ✅ | Bulk campaigns |
| `automation_rules` | Low | `workspace_id` | ✅ | Trigger → conditions → actions |
| `automation_executions` | High | `workspace_id` | ❌ | Append-only audit log |
| `ai_memories` | High | `workspace_id` | ❌ | Vector store + structured facts |

## Key Design Decisions

### Multi-tenancy
Every table scoped to a workspace has `workspace_id UUID NOT NULL`. Supabase Row Level Security (RLS) policies enforce this at the DB layer:
```sql
CREATE POLICY "workspace_isolation" ON contacts
  USING (workspace_id = (current_setting('app.workspace_id'))::UUID);
```

### Soft Deletes
Tables with `deleted_at TIMESTAMPTZ` use partial indexes `WHERE deleted_at IS NULL` to keep active queries fast. Hard deletes are reserved for GDPR erasure requests via a separate purge job.

### JSONB Usage
| Column | Purpose |
|---|---|
| `contacts.custom_fields` | Arbitrary CRM fields without schema migrations |
| `automation_rules.conditions` | Flexible rule DSL: `[{"field":"contact.source","op":"eq","value":"whatsapp"}]` |
| `automation_rules.actions` | Action pipeline: `[{"type":"send_template","template_id":"..."}]` |
| `messages.raw_payload` | Vendor webhook preservation for debugging |
| `workspaces.settings` | Per-workspace config: timezone, locale, branding |

### AI Memory Layer
`ai_memories` stores both vector embeddings (for semantic search) and structured `attributes` (for deterministic rule matching). The `entity_type` + `entity_id` pair links memories to any entity without separate junction tables. The `relevance_score` supports a decay job that deprioritizes stale memories.

### Indexes Strategy
- **Lookup**: `(workspace_id, status)` composite indexes on all high-read tables
- **Time-series**: `(workspace_id, created_at DESC)` / `last_message_at` for inbox sorting
- **Search**: `gin_trgm_ops` on contact name for fast `ILIKE` queries
- **Vector**: `ivfflat` on `ai_memories.embedding` — rebuild with `CONCURRENTLY` after bulk import
- **Partial**: All soft-delete indexes filtered `WHERE deleted_at IS NULL`

## Naming Conventions

| Convention | Example |
|---|---|
| Tables | `snake_case`, plural | 
| PKs | `id UUID` |
| FKs | `{table_singular}_id` |
| Indexes | `idx_{table}_{column(s)}` |
| Triggers | `trg_{table}_{action}` |
| Functions | `verb_noun()` |
| Enums | `{domain}_{concept}` e.g. `contact_status` |
| JSONB fields | Suffix `_config`, `_metadata`, `_context`, `_filter` |
