import { db } from "../../config/supabase";
import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { Followup, CreateFollowupDto, UpdateFollowupDto, FollowupFilter } from "./followups.types";

const FOLLOWUP_SELECT = "*, contacts(id,first_name,last_name,phone)";

function shape(row: unknown): Followup {
  const r = row as Record<string, unknown>;
  const contacts = r.contacts as { id: UUID; first_name: string; last_name: string | null; phone: string | null } | null;
  const { contacts: _c, ...rest } = r;
  void _c;
  return { ...rest, contact: contacts ?? null } as unknown as Followup;
}

export const followupsRepository = {
  async findAll(ctx: WorkspaceContext, filter: FollowupFilter): Promise<ListResult<Followup>> {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 25;
    const from  = (page - 1) * limit;

    let query = db
      .from("followups")
      .select(FOLLOWUP_SELECT, { count: "exact" })
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .range(from, from + limit - 1)
      .order("due_at", { ascending: filter.sort_dir !== "desc" });

    if (filter.contact_id)      query = query.eq("contact_id", filter.contact_id);
    if (filter.conversation_id) query = query.eq("conversation_id", filter.conversation_id);
    if (filter.assigned_to)     query = query.eq("assigned_to", filter.assigned_to);
    if (filter.status)          query = query.eq("status", filter.status);
    if (filter.due_before)      query = query.lte("due_at", filter.due_before);
    if (filter.due_after)       query = query.gte("due_at", filter.due_after);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: (data ?? []).map(shape), total: count ?? 0, page, limit };
  },

  async findById(ctx: WorkspaceContext, id: UUID): Promise<Followup | null> {
    const { data } = await db
      .from("followups")
      .select(FOLLOWUP_SELECT)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? shape(data) : null;
  },

  async create(ctx: WorkspaceContext, dto: CreateFollowupDto): Promise<Followup> {
    const { data, error } = await db
      .from("followups")
      .insert({
        ...dto,
        workspace_id: ctx.workspaceId,
        created_by:   ctx.userId,
        assigned_to:  dto.assigned_to ?? ctx.userId,
        metadata:     {},
      })
      .select(FOLLOWUP_SELECT)
      .single();
    if (error) throw error;
    return shape(data);
  },

  async update(ctx: WorkspaceContext, id: UUID, dto: UpdateFollowupDto): Promise<Followup> {
    const { data, error } = await db
      .from("followups")
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .select(FOLLOWUP_SELECT)
      .single();
    if (error) throw error;
    return shape(data);
  },

  async softDelete(ctx: WorkspaceContext, id: UUID): Promise<void> {
    await db
      .from("followups")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);
  },

  // ── Webhook / worker helpers ──────────────────────────────

  /** Find a followup by ID without workspace context (worker use) */
  async findByIdRaw(id: UUID): Promise<Followup | null> {
    const { data } = await db
      .from("followups")
      .select(FOLLOWUP_SELECT)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return data ? shape(data) : null;
  },

  /** Find all pending/snoozed followups linked to a conversation */
  async findByConversationPending(
    workspaceId: UUID,
    conversationId: UUID,
  ): Promise<Followup[]> {
    const { data } = await db
      .from("followups")
      .select(FOLLOWUP_SELECT)
      .eq("workspace_id", workspaceId)
      .eq("conversation_id", conversationId)
      .in("status", ["pending", "snoozed"])
      .is("deleted_at", null);
    return (data ?? []).map(shape);
  },

  /** Bulk-cancel followups for a conversation (auto-cancel on inbound reply) */
  async cancelByConversation(
    workspaceId: UUID,
    conversationId: UUID,
  ): Promise<Followup[]> {
    const { data } = await db
      .from("followups")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("conversation_id", conversationId)
      .in("status", ["pending", "snoozed"])
      .is("deleted_at", null)
      .select(FOLLOWUP_SELECT);
    return (data ?? []).map(shape);
  },

  /** Persist BullMQ job ID into metadata so we can remove it later */
  async saveJobId(
    workspaceId: UUID,
    id: UUID,
    jobId: string,
  ): Promise<void> {
    // Read current metadata, merge job_id
    const { data } = await db
      .from("followups")
      .select("metadata")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const existing = (data as { metadata: Record<string, unknown> } | null)?.metadata ?? {};
    await db
      .from("followups")
      .update({ metadata: { ...existing, job_id: jobId }, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId);
  },
};
