# CRM SaaS — Architecture Audit

> Generated: May 2026 | Scope: `/frontend` only — no backend exists yet.

---

## 1. Architecture Audit

### What exists

| Layer | Status | Detail |
|---|---|---|
| Framework | ✅ | Next.js 16.2.6, App Router, React 19, TypeScript strict |
| Styling | ✅ | Tailwind v4 (`@tailwindcss/postcss`), shadcn/ui `radix-nova`, CSS variables |
| Icons | ✅ | `lucide-react` v1.16.0 |
| UI primitives | ⚠️ Partial | Only `Button` installed from shadcn/ui |
| Layout shell | ✅ | Fixed sidebar (collapsible), `SidebarProvider` context, `SidebarInset` |
| Chat list | ✅ | Static mock data, active state, unread badge |
| Routing | ❌ | Only `/` exists — no pages for any sidebar nav item |
| Backend / API | ❌ | Does not exist |
| Auth | ❌ | None |
| Database | ❌ | None |
| State management | ⚠️ | React context only (`SidebarContext`) |
| Data fetching | ❌ | No SWR / React Query / server actions |
| Forms | ❌ | No `react-hook-form` / `zod` |
| Real-time | ❌ | No WebSockets / SSE |
| Error handling | ❌ | No error boundaries, no `error.tsx` |
| Loading states | ❌ | No `loading.tsx`, no skeletons |
| Notifications | ❌ | No toast system |
| Environment config | ❌ | No `.env.local`, no `NEXT_PUBLIC_*` vars |
| Testing | ❌ | No test runner, no tests |

### Current file tree

```
frontend/
  app/
    globals.css       ← Tailwind v4 + shadcn CSS vars
    layout.tsx        ← Root layout (Geist font, no providers)
    page.tsx          ← Single page — Sidebar + ChatList shell
  components/
    sidebar.tsx       ← Collapsible fixed sidebar
    sidebar-context.tsx ← collapsed state + SidebarInset
    chat-list.tsx     ← Static mock chat list
    ui/
      button.tsx      ← shadcn Button only
  lib/
    utils.ts          ← cn() helper
  components.json     ← shadcn config (radix-nova, cssVariables)
```

### Key observations

- `SidebarProvider` lives in `page.tsx` — it must move to `layout.tsx` when multi-page routing is added.
- `app/layout.tsx` metadata still says "Create Next App" — not updated.
- `chat-list.tsx` has hardcoded mock data — no data layer.
- No `app/` subdirectory routes exist for any of the 9 sidebar items.
- No `middleware.ts` — auth protection is entirely absent.

---

## 2. Missing Modules

### Frontend

| Module | Purpose |
|---|---|
| `app/(dashboard)/layout.tsx` | Shared layout wrapping all authenticated pages |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/register/page.tsx` | Register / onboarding |
| `app/inbox/page.tsx` | Inbox / conversations view |
| `app/contacts/page.tsx` | Contacts list + detail |
| `app/automation/page.tsx` | Workflow builder |
| `app/bookings/page.tsx` | Calendar / bookings |
| `app/broadcast/page.tsx` | Bulk messaging |
| `app/analytics/page.tsx` | Charts and KPIs |
| `app/integrations/page.tsx` | Third-party connect |
| `app/settings/page.tsx` | Workspace + user settings |
| `app/error.tsx` | Global error boundary |
| `app/loading.tsx` | Global loading UI |
| `app/not-found.tsx` | 404 page |
| `middleware.ts` | Auth guard on protected routes |
| `components/ui/*` | Card, Badge, Input, Dialog, Sheet, Table, Tabs, Avatar, Skeleton, Toast |
| `components/header.tsx` | Top header (search, bell, theme toggle) |
| `lib/fetcher.ts` | Base fetch wrapper (error handling, auth headers) |
| `hooks/use-toast.ts` | Toast notifications |
| `hooks/use-media-query.ts` | Responsive sidebar auto-collapse |

### Backend (entire layer missing)

| Module | Purpose |
|---|---|
| Auth service | JWT / session issuing, refresh tokens |
| User + workspace model | Multi-tenant isolation |
| Contacts API | CRUD, tags, custom fields |
| Conversations API | Inbox threads, assign, resolve |
| Messages API | Send / receive, attachments |
| Bookings API | Availability, calendar sync |
| Broadcast API | Campaign creation, scheduling |
| Analytics API | Aggregations, time-series |
| Automation engine | Trigger/action pipeline |
| Webhook receiver | Inbound WhatsApp / email |
| File upload | Attachments, avatars |
| Rate limiting | Per-user / per-workspace |

---

## 3. Scalability Improvements

### Routing — use route groups

```
app/
  (auth)/          ← unauthenticated pages
    login/
    register/
  (dashboard)/     ← all authenticated pages share one layout
    layout.tsx     ← SidebarProvider + Header here (not in page.tsx)
    page.tsx       ← /dashboard home
    inbox/
    contacts/
    ...
```

### State — add React Query

Replace future `useState` data-fetching patterns with `@tanstack/react-query`:
- Automatic cache, refetch, loading/error states
- Optimistic updates for chat messages

### Type safety — add Zod

Validate all API responses and form inputs at the boundary:
```ts
// lib/schemas/contact.ts
export const ContactSchema = z.object({ id: z.string(), name: z.string(), ... })
```

### Auth — recommend Clerk or NextAuth v5

- **Clerk**: fastest to integrate with Next.js App Router, handles MFA, org/workspace switching natively
- **NextAuth v5**: more control, good if self-hosting

### Real-time — plan for it early

For Inbox live updates:
- Use **Server-Sent Events** (simple, works with Next.js route handlers) for read-only streams
- Use **Pusher** or a self-hosted **Socket.IO** for bidirectional (typing indicators, delivery receipts)

### Multi-tenancy

Every database table needs a `workspace_id`. Enforce it at the ORM query level (Prisma middleware or Drizzle `where` helpers), not in individual handlers.

### Performance

- Move `SidebarProvider` to `(dashboard)/layout.tsx` so it's a single React tree, not re-mounted per page
- Add `loading.tsx` per route segment for streaming UI
- Use Next.js Server Components for all data-fetch pages; push `"use client"` down to interactive leaves only

---

## 4. Recommended Production Structure

```
crm-saas/
  frontend/                        ← Next.js App
    app/
      (auth)/
        login/page.tsx
        register/page.tsx
        layout.tsx
      (dashboard)/
        layout.tsx                 ← SidebarProvider, Header, SidebarInset
        page.tsx                   ← /  dashboard home
        inbox/page.tsx
        contacts/
          page.tsx
          [id]/page.tsx
        automation/page.tsx
        bookings/page.tsx
        broadcast/page.tsx
        analytics/page.tsx
        integrations/page.tsx
        settings/page.tsx
      api/                         ← Next.js route handlers (BFF / proxy)
        auth/[...nextauth]/route.ts
        contacts/route.ts
        conversations/route.ts
      globals.css
      layout.tsx                   ← Root: fonts, theme, metadata only
      error.tsx
      not-found.tsx
    components/
      ui/                          ← shadcn primitives
      layout/
        sidebar.tsx
        sidebar-context.tsx
        header.tsx
      inbox/
        chat-list.tsx
        chat-window.tsx
        message-bubble.tsx
      contacts/
        contacts-table.tsx
        contact-card.tsx
      shared/
        data-table.tsx
        stat-card.tsx
        empty-state.tsx
        skeleton-list.tsx
    hooks/
      use-toast.ts
      use-media-query.ts
      use-contacts.ts              ← React Query hooks per feature
      use-conversations.ts
    lib/
      utils.ts
      fetcher.ts
      schemas/                     ← Zod schemas
    middleware.ts                  ← Auth route protection
    .env.local

  backend/                         ← Node.js / Python / Go API
    src/
      auth/
      contacts/
      conversations/
      bookings/
      broadcasts/
      analytics/
      automations/
      webhooks/
      db/                          ← Prisma / Drizzle schema + migrations
    .env

  docker-compose.yml               ← Postgres, Redis, app
  README.md
```

---

## 5. Implementation Roadmap

### Phase 1 — Foundation (current sprint)

- [x] Sidebar shell with collapse
- [x] ChatList component
- [ ] Move `SidebarProvider` to `(dashboard)/layout.tsx`
- [ ] Add `Header` component (search, notifications, theme)
- [ ] Install core shadcn/ui primitives: `Card`, `Badge`, `Input`, `Avatar`, `Skeleton`, `Sonner`
- [ ] Add `error.tsx` and `not-found.tsx`
- [ ] Update `layout.tsx` metadata (title, description, favicon)

### Phase 2 — Auth

- [ ] Integrate Clerk or NextAuth v5
- [ ] Create `(auth)/login` and `(auth)/register` pages
- [ ] Add `middleware.ts` to protect `(dashboard)` routes
- [ ] Add user avatar / workspace switcher to sidebar footer

### Phase 3 — Contacts

- [ ] `/contacts` page with sortable table
- [ ] Contact detail drawer/page
- [ ] Create / edit / delete contact forms (react-hook-form + zod)
- [ ] Backend: contacts REST API + database schema

### Phase 4 — Inbox / Conversations

- [ ] Full chat window component
- [ ] Conversation assignment, status, tags
- [ ] Real-time message updates (SSE or WebSocket)
- [ ] Backend: conversations + messages API

### Phase 5 — Bookings & Broadcast

- [ ] Calendar view, availability slots
- [ ] Broadcast campaign composer, scheduling, status tracking

### Phase 6 — Analytics & Automation

- [ ] KPI cards, charts (Recharts or Chart.js)
- [ ] Workflow builder (trigger → condition → action)

### Phase 7 — Production Hardening

- [ ] Rate limiting, input sanitisation
- [ ] Multi-workspace / multi-tenant isolation
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Observability (error tracking, logging)
- [ ] E2E tests (Playwright)
