import { db } from "../../config/supabase";
import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { AutomationRule, CreateAutomationDto, UpdateAutomationDto, AutomationFilter } from "./automation.types";

export const automationRepository = {
  async findAll(ctx: WorkspaceContext, filter: AutomationFilter): Promise<ListResult<AutomationRule>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 25;
    const from = (page - 1) * limit;
    let query = db.from("automation_rules").select("*", { count: "exact" })
      .eq("workspace_id", ctx.workspaceId).is("deleted_at", null)
      .range(from, from + limit - 1).order("priority", { ascending: true });
    if (filter.is_active !== undefined) query = query.eq("is_active", filter.is_active);
    if (filter.trigger_type) query = query.eq("trigger_type", filter.trigger_type);
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: (data ?? []) as AutomationRule[], total: count ?? 0, page, limit };
  },

  async findById(ctx: WorkspaceContext, id: UUID): Promise<AutomationRule | null> {
    const { data } = await db.from("automation_rules").select("*").eq("id", id).eq("workspace_id", ctx.workspaceId).is("deleted_at", null).single();
    return (data as AutomationRule | null) ?? null;
  },

  async create(ctx: WorkspaceContext, dto: CreateAutomationDto): Promise<AutomationRule> {
    const { data, error } = await db.from("automation_rules").insert({ ...dto, workspace_id: ctx.workspaceId, created_by: ctx.userId }).select("*").single();
    if (error) throw error;
    return data as AutomationRule;
  },

  async update(ctx: WorkspaceContext, id: UUID, dto: UpdateAutomationDto): Promise<AutomationRule> {
    const { data, error } = await db.from("automation_rules").update(dto).eq("id", id).eq("workspace_id", ctx.workspaceId).select("*").single();
    if (error) throw error;
    return data as AutomationRule;
  },

  async softDelete(ctx: WorkspaceContext, id: UUID): Promise<void> {
    await db.from("automation_rules").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", ctx.workspaceId);
  },
};
