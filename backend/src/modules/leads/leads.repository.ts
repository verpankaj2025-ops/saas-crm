import { db } from "../../config/supabase";
import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { Lead, CreateLeadDto, UpdateLeadDto, LeadFilter } from "./leads.types";

const LEAD_COLS =
  "id,workspace_id,contact_id,conversation_id,channel_id,source,package," +
  "amount,paid_amount,balance_amount,status,assigned_agent,notes,created_by," +
  "created_at,updated_at,deleted_at";

export const leadsRepository = {
  async findAll(ctx: WorkspaceContext, filter: LeadFilter): Promise<ListResult<Lead>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 25;
    const from = (page - 1) * limit;

    let query = db
      .from("leads")
      .select(LEAD_COLS, { count: "exact" })
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (filter.status)         query = query.eq("status", filter.status);
    if (filter.source)         query = query.eq("source", filter.source);
    if (filter.assigned_agent) query = query.eq("assigned_agent", filter.assigned_agent);
    if (filter.contact_id)     query = query.eq("contact_id", filter.contact_id);
    if (filter.search)         query = query.or(`package.ilike.%${filter.search}%,notes.ilike.%${filter.search}%`);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: (data ?? []) as unknown as Lead[], total: count ?? 0, page, limit };
  },

  async findById(ctx: WorkspaceContext, id: UUID): Promise<Lead | null> {
    const { data } = await db
      .from("leads")
      .select(LEAD_COLS)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    return (data as unknown as Lead | null) ?? null;
  },

  async create(ctx: WorkspaceContext, dto: CreateLeadDto): Promise<Lead> {
    const { data, error } = await db
      .from("leads")
      .insert({
        contact_id:      dto.contact_id,
        conversation_id: dto.conversation_id ?? null,
        channel_id:      dto.channel_id ?? null,
        source:          dto.source ?? "manual",
        package:         dto.package ?? null,
        amount:          dto.amount ?? 0,
        paid_amount:     dto.paid_amount ?? 0,
        status:          dto.status ?? "new",
        assigned_agent:  dto.assigned_agent ?? null,
        notes:           dto.notes ?? null,
        workspace_id:    ctx.workspaceId,
        created_by:      ctx.userId,
      })
      .select(LEAD_COLS)
      .single();
    if (error) throw error;
    return data as unknown as Lead;
  },

  async update(ctx: WorkspaceContext, id: UUID, dto: UpdateLeadDto): Promise<Lead> {
    const { data, error } = await db
      .from("leads")
      .update(dto)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .select(LEAD_COLS)
      .single();
    if (error) throw error;
    return data as unknown as Lead;
  },

  async softDelete(ctx: WorkspaceContext, id: UUID): Promise<void> {
    await db
      .from("leads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);
  },

  // ── Ownership guards (multi-tenant integrity) ─────────────────
  // FK constraints only check the referenced row exists — not that it
  // belongs to this workspace. These confirm workspace ownership so a
  // lead can't be linked to another tenant's contact/agent/etc.

  async contactInWorkspace(ctx: WorkspaceContext, contactId: UUID): Promise<boolean> {
    const { data } = await db
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    return !!data;
  },

  async agentInWorkspace(ctx: WorkspaceContext, userId: UUID): Promise<boolean> {
    const { data } = await db
      .from("workspace_members")
      .select("user_id")
      .eq("user_id", userId)
      .eq("workspace_id", ctx.workspaceId)
      .maybeSingle();
    return !!data;
  },

  async conversationInWorkspace(ctx: WorkspaceContext, conversationId: UUID): Promise<boolean> {
    const { data } = await db
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("workspace_id", ctx.workspaceId)
      .maybeSingle();
    return !!data;
  },

  async channelInWorkspace(ctx: WorkspaceContext, channelId: UUID): Promise<boolean> {
    const { data } = await db
      .from("channels")
      .select("id")
      .eq("id", channelId)
      .eq("workspace_id", ctx.workspaceId)
      .maybeSingle();
    return !!data;
  },
};
