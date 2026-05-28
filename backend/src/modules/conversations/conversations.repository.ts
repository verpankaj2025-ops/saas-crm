import { db } from "../../config/supabase";
import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type {
  Conversation, ConversationWithContact, ConversationContact,
  CreateConversationDto, UpdateConversationDto, ConversationFilter,
} from "./conversations.types";

const CONV_COLS =
  "id,workspace_id,contact_id,channel_id,status,subject,assigned_to," +
  "last_message_at,last_message_preview,unread_count,metadata,created_at,updated_at," +
  "contacts!contact_id(id,first_name,last_name,email,phone,avatar_url)";

type RawConv = Record<string, unknown> & { contacts: ConversationContact | null };

function flatten(raw: RawConv): ConversationWithContact {
  const { contacts, ...rest } = raw;
  return { ...(rest as unknown as Conversation), contact: contacts };
}

export const conversationsRepository = {
  async findAll(ctx: WorkspaceContext, filter: ConversationFilter): Promise<ListResult<ConversationWithContact>> {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 25;
    const from  = (page - 1) * limit;

    let query = db
      .from("conversations")
      .select(CONV_COLS, { count: "exact" })
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .range(from, from + limit - 1)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (filter.status)      query = query.eq("status", filter.status);
    if (filter.assigned_to) query = query.eq("assigned_to", filter.assigned_to);
    if (filter.contact_id)  query = query.eq("contact_id", filter.contact_id);
    if (filter.channel_id)  query = query.eq("channel_id", filter.channel_id);

    const { data, count, error } = await query;
    if (error) throw error;
    return {
      data:  (data ?? []).map((r) => flatten(r as unknown as RawConv)),
      total: count ?? 0,
      page,
      limit,
    };
  },

  async findById(ctx: WorkspaceContext, id: UUID): Promise<ConversationWithContact | null> {
    const { data } = await db
      .from("conversations")
      .select(CONV_COLS)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return null;
    return flatten(data as unknown as RawConv);
  },

  async create(ctx: WorkspaceContext, dto: CreateConversationDto): Promise<ConversationWithContact> {
    const { data, error } = await db
      .from("conversations")
      .insert({ ...dto, workspace_id: ctx.workspaceId })
      .select(CONV_COLS)
      .single();
    if (error) throw error;
    return flatten(data as unknown as RawConv);
  },

  async update(ctx: WorkspaceContext, id: UUID, dto: UpdateConversationDto): Promise<ConversationWithContact> {
    const { data, error } = await db
      .from("conversations")
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .select(CONV_COLS)
      .single();
    if (error) throw error;
    return flatten(data as unknown as RawConv);
  },

  async markRead(ctx: WorkspaceContext, id: UUID): Promise<ConversationWithContact | null> {
    const { data } = await db
      .from("conversations")
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .select(CONV_COLS)
      .maybeSingle();
    if (!data) return null;
    return flatten(data as unknown as RawConv);
  },

  async softDelete(ctx: WorkspaceContext, id: UUID): Promise<void> {
    const { error } = await db
      .from("conversations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);
    if (error) throw error;
  },

  // ── Webhook helpers (no auth context) ───────────────────────

  async findOpenByContactAndChannel(
    workspaceId: UUID,
    contactId: UUID,
    channelId: UUID,
  ): Promise<{ id: UUID } | null> {
    const { data } = await db
      .from("conversations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("contact_id", contactId)
      .eq("channel_id", channelId)
      .in("status", ["open", "pending"])
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { id: UUID } | null) ?? null;
  },

  async createInbound(
    workspaceId: UUID,
    dto: { contact_id: UUID; channel_id: UUID },
  ): Promise<{ id: UUID }> {
    const { data, error } = await db
      .from("conversations")
      .insert({ workspace_id: workspaceId, ...dto, status: "open" })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: UUID };
  },

  async incrementUnread(
    workspaceId: UUID,
    conversationId: UUID,
    preview: string,
    lastAt: string,
  ): Promise<void> {
    // Fetch current unread_count for atomic-enough increment (single worker per message)
    const { data: cur } = await db
      .from("conversations")
      .select("unread_count")
      .eq("id", conversationId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const current = (cur as { unread_count: number } | null)?.unread_count ?? 0;

    await db
      .from("conversations")
      .update({
        unread_count:         current + 1,
        last_message_at:      lastAt,
        last_message_preview: preview.slice(0, 120),
        updated_at:           new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("workspace_id", workspaceId);
  },
};
