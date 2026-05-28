# CRM SaaS — Database Architecture

PostgreSQL 15+ · Supabase compatible · pgvector ready

## Directory Structure

```
database/
  schema/
    000_extensions.sql         — Extensions (uuid-ossp, pgcrypto, pg_trgm, vector) + all ENUMs
    001_workspaces.sql         — workspaces, workspace_members, channels
    002_users.sql              — users + deferred FK constraints back to workspaces
    003_contacts.sql           — contacts, tags, contact_tags, contact_notes
    004_conversations.sql      — conversations, messages, conversation_participants
    005_followups_appointments.sql — followups, appointments
    006_templates.sql          — templates, broadcasts
    007_automation.sql         — automation_rules, automation_executions
    008_ai_memory.sql          — ai_memories (pgvector) + search_ai_memories()
  migrations/
    001_initial_schema.sql     — Runs all schema files in dependency order
  ERD.md                       — Entity relationships, design decisions, naming conventions
  README.md                    — This file
```

## Quick Start

### Supabase (recommended)
1. Create a new Supabase project
2. Enable the **Vector** extension in Dashboard → Extensions
3. Open SQL Editor and run `migrations/001_initial_schema.sql`
4. Configure RLS policies (see ERD.md)

### Local PostgreSQL
```bash
# Requires PostgreSQL 15+ with pgvector installed
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### Docker (local dev)
```yaml
# docker-compose.yml
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: crm_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
```

```bash
docker-compose up -d
psql postgresql://postgres:postgres@localhost:5432/crm_dev \
  -f migrations/001_initial_schema.sql
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Table Count: 16 tables across 8 domains

| Domain | Tables |
|---|---|
| Tenancy | workspaces, workspace_members, channels |
| Identity | users |
| CRM Core | contacts, tags, contact_tags, contact_notes |
| Inbox | conversations, messages, conversation_participants |
| Tasks | followups, appointments |
| Messaging | templates, broadcasts |
| Automation | automation_rules, automation_executions |
| AI | ai_memories |

## Next Steps (backend)

- [ ] Add Supabase RLS policies per table
- [ ] Seed script for development workspace + demo data
- [ ] Set up `pg_cron` job for ai_memory relevance score decay
- [ ] Add `supabase/migrations/` symlinks for Supabase CLI workflow
- [ ] Write Zod schemas mirroring DB types for the API layer
