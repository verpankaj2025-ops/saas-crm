import { db } from "../../config/supabase";
import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { Template, CreateTemplateDto, UpdateTemplateDto, TemplateFilter } from "./templates.types";

export const templatesRepository = {
  async findAll(ctx: WorkspaceContext, filter: TemplateFilter): Promise<ListResult<Template>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 25;
    const from = (page - 1) * limit;
    let query = db.from("templates").select("*", { count: "exact" })
      .eq("workspace_id", ctx.workspaceId).is("deleted_at", null)
      .range(from, from + limit - 1);
    if (filter.recently_used) {
      query = query.order("last_used_at", { ascending: false, nullsFirst: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    if (filter.type)     query = query.eq("channel_type", filter.type);
    if (filter.category) query = query.eq("category", filter.category);
    if (filter.status)   query = query.eq("is_approved", filter.status === "approved");
    if (filter.search)   query = query.ilike("name", `%${filter.search}%`);
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: (data ?? []) as Template[], total: count ?? 0, page, limit };
  },

  async findById(ctx: WorkspaceContext, id: UUID): Promise<Template | null> {
    const { data } = await db.from("templates").select("*").eq("id", id).eq("workspace_id", ctx.workspaceId).is("deleted_at", null).single();
    return (data as Template | null) ?? null;
  },

  async create(ctx: WorkspaceContext, dto: CreateTemplateDto): Promise<Template> {
    // Check for duplicate template name in workspace
    const { data: existing } = await db.from("templates")
      .select("id")
      .eq("workspace_id", ctx.workspaceId)
      .eq("name", dto.name)
      .is("deleted_at", null)
      .maybeSingle();
    
    if (existing) {
      throw new Error(`Template with name "${dto.name}" already exists in this workspace`);
    }
    
    const { data, error } = await db.from("templates").insert({
      ...dto,
      workspace_id: ctx.workspaceId,
      channel_type: dto.type,
      is_active: true,
      usage_count: 0,
    }).select("*").single();
    if (error) throw error;
    return data as Template;
  },

  async update(ctx: WorkspaceContext, id: UUID, dto: UpdateTemplateDto): Promise<Template> {
    const { data, error } = await db.from("templates").update(dto).eq("id", id).eq("workspace_id", ctx.workspaceId).select("*").single();
    if (error) throw error;
    return data as Template;
  },

  async softDelete(ctx: WorkspaceContext, id: UUID): Promise<void> {
    await db.from("templates").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", ctx.workspaceId);
  },

  async markUsed(ctx: WorkspaceContext, id: UUID): Promise<void> {
    // First get current count
    const { data: current } = await db.from("templates")
      .select("usage_count")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .single();
    
    // Then update with incremented value
    await db.from("templates")
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (current?.usage_count ?? 0) + 1,
      })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);
  },
};
