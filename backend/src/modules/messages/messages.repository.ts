import { db } from "../../config/supabase";
import type { UUID, WorkspaceContext } from "../../types/common";
import type { Message, MessageStatus, SendMessageDto, MessageFilter } from "./messages.types";

const MSG_COLS =
  "id,workspace_id,conversation_id,sender_type,sender_id," +
  "content,content_type,status,attachment_url,attachment_metadata," +
  "is_internal,external_id," +
  "queued_at,sent_at,delivered_at,read_at,failed_at," +
  "created_at,updated_at";

// ── Status lifecycle ──────────────────────────────────────────
//
// Valid forward transitions only. Applying a status that is not
// reachable from the current state is silently ignored — the DB
// UPDATE affects 0 rows, which is the correct idempotent behavior
// for out-of-order webhook delivery (e.g. Meta sends 'read' before
// 'delivered'; a stale 'delivered' must never overwrite 'read').
//
//  queued ──→ sent ──→ delivered ──→ read
//             ↘       ↘
//              failed ←— (retry resets to queued via service layer)

const STATUS_TRANSITIONS: Readonly<Partial<Record<MessageStatus, ReadonlyArray<MessageStatus>>>> = {
  queued:    ["failed"],                       // retry: failed → queued
  sent:      ["queued"],                        // provider accepted
  delivered: ["queued", "sent"],               // device confirmed
  read:      ["queued", "sent", "delivered"],  // user opened (terminal success)
  failed:    ["queued", "sent", "delivered"],  // delivery failed
};

// Maps each status to the DB column that should be timestamped on transition.
const STATUS_TIMESTAMP: Readonly<Record<MessageStatus, keyof Message>> = {
  queued:    "queued_at",
  sent:      "sent_at",
  delivered: "delivered_at",
  read:      "read_at",
  failed:    "failed_at",
};

export const messagesRepository = {
  async findByConversation(ctx: WorkspaceContext, filter: MessageFilter): Promise<Message[]> {
    const limit = filter.limit ?? 50;
    let query = db
      .from("messages")
      .select(MSG_COLS)
      .eq("workspace_id", ctx.workspaceId)
      .eq("conversation_id", filter.conversation_id)
      // Primary sort: newest first.
      // Secondary sort: id DESC as a stable tiebreaker for messages
      // that share the same created_at (batch inserts, rapid sends).
      // UUID v4 is random but constant — order is arbitrary yet deterministic.
      .order("created_at", { ascending: false })
      .order("id",         { ascending: false })
      .limit(limit);

    if (filter.before_id) {
      // Fetch both cursor fields in one PK lookup (no extra round-trip cost).
      const { data: cursor } = await db
        .from("messages")
        .select("id,created_at")
        .eq("id", filter.before_id)
        .maybeSingle();

      if (cursor) {
        const { id: cursorId, created_at: cursorAt } = cursor as { id: string; created_at: string };
        // Keyset pagination: rows that come BEFORE the cursor in
        // (created_at DESC, id DESC) order satisfy:
        //   created_at < cursorAt
        //   OR (created_at = cursorAt AND id < cursorId)
        //
        // A plain .lt("created_at") would skip all messages that share
        // cursorAt with the cursor row, causing missing or duplicate
        // messages on page boundaries.
        query = query.or(
          `created_at.lt.${cursorAt},and(created_at.eq.${cursorAt},id.lt.${cursorId})`
        );
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Message[];
  },

  async findById(ctx: WorkspaceContext, id: UUID): Promise<Message | null> {
    const { data } = await db
      .from("messages")
      .select(MSG_COLS)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .maybeSingle();
    return (data as unknown as Message | null) ?? null;
  },

  async create(
    ctx: WorkspaceContext,
    dto: SendMessageDto & { sender_id: UUID; sender_type: "contact" | "agent" | "bot" },
  ): Promise<Message> {
    const now = new Date().toISOString();
    const { data: raw, error } = await db
      .from("messages")
      .insert({
        workspace_id:        ctx.workspaceId,
        conversation_id:     dto.conversation_id,
        sender_type:         dto.sender_type,
        sender_id:           dto.sender_id,
        content:             dto.content ?? null,
        content_type:        dto.content_type ?? "text",
        attachment_url:      dto.attachment_url ?? null,
        attachment_metadata: dto.attachment_metadata ?? null,
        is_internal:         dto.is_internal ?? false,
        status:              "queued",
        queued_at:           now,
      })
      .select(MSG_COLS)
      .single();
    if (error) throw error;
    // Conversation last_message_at + last_message_preview are updated
    // atomically by trg_messages_sync_conversation (migration 005).
    // No separate UPDATE needed here — removing it eliminates the
    // partial-failure window that existed between the two queries.
    return raw as unknown as Message;
  },

  // Transition-guarded status update for outbound messages.
  // Only applies the new status if the current DB status is a valid
  // predecessor. Returns silently if the transition is not allowed.
  async updateStatus(
    workspaceId: UUID,
    id: UUID,
    patch: { status: MessageStatus; external_id?: string },
  ): Promise<void> {
    const tsCol  = STATUS_TIMESTAMP[patch.status];
    const allowed = STATUS_TRANSITIONS[patch.status];
    const now    = new Date().toISOString();

    const query = db
      .from("messages")
      .update({ ...patch, [tsCol]: now, updated_at: now })
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (allowed?.length) {
      await query.in("status", allowed as string[]);
    } else {
      await query;
    }
  },

  // Transition-guarded status update driven by provider webhooks.
  // Silently ignores out-of-order events (returns null without error)
  // so that a late 'delivered' never downgrades a 'read' message.
  async updateStatusByExternalId(
    workspaceId: UUID,
    externalId: string,
    status: MessageStatus,
  ): Promise<Message | null> {
    const tsCol   = STATUS_TIMESTAMP[status];
    const allowed  = STATUS_TRANSITIONS[status];
    const now     = new Date().toISOString();

    let query = db
      .from("messages")
      .update({ status, [tsCol]: now, updated_at: now })
      .eq("workspace_id", workspaceId)
      .eq("external_id", externalId);

    if (allowed?.length) {
      query = query.in("status", allowed as string[]);
    }

    const { data } = await query.select(MSG_COLS).maybeSingle();
    return (data as unknown as Message | null) ?? null;
  },

  // ── Webhook helpers ───────────────────────────────────────────

  async findByExternalId(
    workspaceId: UUID,
    externalId: string,
  ): Promise<{ id: UUID } | null> {
    const { data } = await db
      .from("messages")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("external_id", externalId)
      .maybeSingle();
    return (data as { id: UUID } | null) ?? null;
  },

  async createInbound(
    workspaceId: UUID,
    dto: {
      conversation_id: UUID;
      content: string | null;
      content_type: Message["content_type"];
      external_id: string;
      attachment_url?: string | null;
      attachment_metadata?: Record<string, unknown> | null;
    },
  ): Promise<Message> {
    const now = new Date().toISOString();
    const { data: raw, error } = await db
      .from("messages")
      .insert({
        workspace_id:        workspaceId,
        conversation_id:     dto.conversation_id,
        sender_type:         "contact",
        sender_id:           null,
        content:             dto.content,
        content_type:        dto.content_type,
        attachment_url:      dto.attachment_url ?? null,
        attachment_metadata: dto.attachment_metadata ?? null,
        is_internal:         false,
        status:              "sent",
        external_id:         dto.external_id,
        queued_at:           now,  // inbound: contact sent it, no queue phase on our side
        sent_at:             now,
      })
      .select(MSG_COLS)
      .single();
    if (error) throw error;
    return raw as unknown as Message;
  },
};
