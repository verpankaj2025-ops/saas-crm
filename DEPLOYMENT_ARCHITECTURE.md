# Deployment Architecture Summary

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                          │
│  Next.js 16.2.6 | React 19 | TypeScript | Tailwind v4     │
│  - Static pages (SSG)                                        │
│  - API routes (proxy)                                       │
│  - Socket.io client                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (WebSocket)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Nginx (Reverse Proxy)                       │
│  - SSL termination (Let's Encrypt)                          │
│  - HTTP/2 support                                           │
│  - WebSocket proxy (Socket.io)                              │
│  - Rate limiting                                            │
│  - Security headers                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ localhost:4000
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PM2 (Process Manager)                       │
│  - Process management                                       │
│  - Auto-restart on crash                                    │
│  - Zero-downtime reload                                    │
│  - Log management                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Backend (Express 4)                    │
│  - TypeScript compiled to JavaScript                        │
│  - Socket.io server (realtime)                              │
│  - BullMQ workers (job processing)                          │
│  - Winston logging                                          │
└───────┬─────────────────────────────────┬───────────────────┘
        │                                 │
        ▼                                 ▼
┌──────────────────┐          ┌──────────────────────┐
│   Supabase       │          │      Redis           │
│   PostgreSQL     │          │   (BullMQ + Cache)   │
│                  │          │                      │
│  - Contacts      │          │  - Job queues        │
│  - Conversations │          │  - Session cache     │
│  - Messages      │          │  - Workspace cache    │
│  - Follow-ups    │          │  - Contact cache     │
│  - Templates     │          │                      │
│  - Automation    │          │                      │
│  - AI memories   │          │                      │
│  - Appointments  │          │                      │
└──────────────────┘          └──────────────────────┘
```

## Component Details

### Frontend (Vercel)

**Technology Stack:**
- Next.js 16.2.6 (App Router)
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui components
- Socket.io client
- Lucide React icons

**Deployment:**
- Platform: Vercel
- Build: Static generation (SSG) for most pages
- Environment: `NEXT_PUBLIC_BACKEND_URL`
- Features:
  - Responsive design (mobile-first)
  - Optimistic UI updates
  - Real-time Socket.io connection
  - Customer insights panel
  - AI suggestion preview
  - Template picker with keyboard navigation

**Performance:**
- Static pages: ~300ms build time
- First Contentful Paint (FCP): < 1s
- Time to Interactive (TTI): < 2s
- Bundle size: Optimized with code splitting

### Backend (Ubuntu VPS)

**Technology Stack:**
- Node.js 22.x
- Express 4
- TypeScript (compiled to JavaScript)
- Socket.io 4.8
- BullMQ 5.0
- Winston logging
- Zod validation

**Deployment:**
- Platform: Ubuntu 22.04 LTS VPS
- Process Manager: PM2
- Minimum specs: 2GB RAM, 1 vCPU
- Recommended specs: 4GB RAM, 2 vCPU
- Port: 4000 (behind Nginx)

**Features:**
- RESTful API with JWT authentication
- Real-time WebSocket communication
- BullMQ job queues (7 queues)
- Workspace isolation
- Rate limiting (API, auth, webhook)
- Error handling with AppError hierarchy
- Winston logging with structured logs

### Nginx (Reverse Proxy)

**Configuration:**
- SSL termination (Let's Encrypt)
- HTTP/2 support
- WebSocket proxy for Socket.io
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting (application-level)
- Timeouts (60s for API, 7d for WebSocket)
- Client body size limit: 10MB

**Security:**
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS (HTTP Strict Transport Security)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block

### Database (Supabase)

**Technology:**
- PostgreSQL 15+
- Supabase managed service
- Row Level Security (RLS) policies
- Point-in-time recovery (7 days free, 30 days pro)

**Tables (16):**
- users
- workspaces
- workspace_members
- contacts
- conversations
- messages
- follow_ups
- templates
- automation_rules
- ai_memories
- channels
- contact_notes
- appointments
- appointment_reminders
- crm_lead_scores
- crm_conversation_summaries

**Features:**
- Automatic backups
- Real-time subscriptions (Postgres changes)
- Full-text search (pgvector)
- Connection pooling

### Redis (BullMQ + Cache)

**Technology:**
- Redis 7.x
- ioredis client
- BullMQ 5.0

**Usage:**
- Job queues (7 queues):
  - email
  - broadcast
  - automation
  - ai
  - whatsapp-outbound
  - followup-reminder
  - appointment-reminder
- Caching:
  - Workspace data
  - User sessions
  - Contact counts
  - Template cache

**Configuration:**
- Memory limit: 512MB
- Eviction policy: allkeys-lru
- Persistence: RDB snapshots
- Slow log: 10ms threshold

## Data Flow

### Message Send Flow

```
User sends message
  ↓
Frontend (optimistic update)
  ↓
POST /api/v1/messages
  ↓
Backend validates & saves (status: queued)
  ↓
Socket.io emit (message:new)
  ↓
BullMQ queue (whatsapp-outbound)
  ↓
Worker processes job
  ↓
WhatsApp API call
  ↓
Update message status (sent/delivered/read/failed)
  ↓
Socket.io emit (message:status)
  ↓
Frontend updates UI
```

### Real-time Update Flow

```
Database change (Supabase)
  ↓
Backend detects change
  ↓
Socket.io emit (conversation:updated)
  ↓
Frontend receives event
  ↓
React state update
  ↓
UI re-renders
```

### AI Suggestion Flow

```
User clicks "Suggest Reply"
  ↓
Frontend calls GET /api/v1/ai/suggest
  ↓
Backend checks templates (keyword match)
  ↓
If no match → BullMQ queue (ai)
  ↓
Worker calls OpenAI API
  ↓
Returns suggestion
  ↓
Frontend displays preview
```

## Security Architecture

### Authentication
- JWT access tokens (15min expiry)
- JWT refresh tokens (7day expiry)
- Redis-based refresh token rotation
- Secure HTTP-only cookies

### Authorization
- Workspace-based multi-tenancy
- Role-based access (admin, agent)
- Tenant middleware on all protected routes
- Row-level security in Supabase

### API Security
- Rate limiting (100 req/15min per IP)
- Auth rate limiting (10 req/15min per IP)
- Webhook rate limiting (500 req/min)
- Zod schema validation on all inputs
- SQL injection prevention (parameterized queries)

### Network Security
- TLS 1.2/1.3 only
- Strong cipher suites
- HSTS enabled
- CORS configured for specific origins
- WebSocket authentication via JWT

### Data Security
- Environment variables for secrets
- No hardcoded credentials
- Database encryption at rest (Supabase)
- Redis optional authentication
- Secure password hashing (bcrypt)

## Performance Characteristics

### Backend Performance
- API response time: < 200ms (p95)
- Health check: < 50ms
- Socket.io latency: < 100ms
- Database query: < 100ms (p95)
- Redis operation: < 10ms (p95)

### Frontend Performance
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Resource Usage (2GB RAM VPS)
- Node.js: ~500MB
- Redis: ~512MB
- Nginx: ~50MB
- System overhead: ~500MB
- Available: ~438MB

### Scalability
- Current setup supports:
  - ~100 concurrent users
  - ~1000 messages/day
  - ~100 follow-ups/day
  - ~50 appointments/day

- Scaling options:
  - Increase VPS resources
  - PM2 cluster mode (multiple instances)
  - Separate Redis instance
  - Database read replicas

## Reliability Features

### High Availability
- PM2 auto-restart on crash
- Graceful shutdown handling
- BullMQ job retry with exponential backoff
- Redis persistence (RDB snapshots)
- Supabase automatic backups

### Error Handling
- Centralized error middleware
- AppError hierarchy for typed errors
- Winston structured logging
- Error tracking (Sentry integration ready)
- User-friendly error messages

### Monitoring
- PM2 process monitoring
- Health check endpoint
- System resource monitoring
- Application logs (Winston)
- Nginx access/error logs
- Redis slow log

### Backup Strategy
- Database: Daily backups (30-day retention)
- Redis: Every 6 hours (7-day retention)
- Application: Daily (14-day retention)
- Offsite: Daily to cloud storage
- Monthly backup verification

## Deployment Topology

```
Single VPS Architecture (Current)

┌─────────────────────────────────────┐
│         Ubuntu 22.04 LTS VPS        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Nginx (443, 80)             │   │
│  │ - SSL termination           │   │
│  │ - WebSocket proxy           │   │
│  └──────────┬──────────────────┘   │
│             │ localhost:4000       │
│  ┌──────────▼──────────────────┐   │
│  │ PM2                          │   │
│  │ - Node.js backend           │   │
│  │ - Auto-restart              │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│      ┌──────┴──────┐              │
│      │             │              │
│  ┌───▼───┐   ┌───▼────┐         │
│  │ Supa  │   │ Redis  │         │
│  │ base   │   │        │         │
│  └───────┘   └────────┘         │
└─────────────────────────────────────┘

External Services:
- Vercel (Frontend)
- Supabase (Database)
- WhatsApp API (Optional)
- OpenAI API (Optional)
```

## Cost Estimate

### Infrastructure (Monthly)
- VPS (2GB RAM, 1 vCPU): $5-10
- Vercel (Hobby tier): Free
- Supabase (Pro tier): $25
- Redis (included with VPS): $0
- Domain: $10-15/year
- SSL (Let's Encrypt): Free

**Total Monthly: ~$30-35**

### Optional Add-ons
- WhatsApp Business API: Pay per message
- OpenAI API: Pay per token
- Monitoring service (Sentry): Free tier
- Log aggregation (Logtail): Free tier

## Deployment Files Created

1. **backend/ecosystem.config.js** - PM2 configuration
2. **backend/nginx.conf** - Nginx reverse proxy config
3. **backend/.env.production.example** - Environment variables template
4. **frontend/vercel.json** - Vercel deployment config
5. **DEPLOYMENT.md** - Main deployment guide
6. **UBUNTU_SETUP.md** - Server setup guide
7. **PM2_COMMANDS.md** - PM2 command reference
8. **REDIS_SETUP.md** - Redis configuration guide
9. **BACKUP_STRATEGY.md** - Backup procedures
10. **MONITORING.md** - Monitoring strategy

## Next Steps

1. Deploy backend to VPS following DEPLOYMENT.md
2. Deploy frontend to Vercel
3. Configure WhatsApp webhook (if using)
4. Set up monitoring alerts
5. Configure automated backups
6. Test all functionality
7. Launch to production
