import { db } from "../../config/supabase";
import type { UUID, WorkspaceContext } from "../../types/common";
import type { AiMemory, CreateMemoryDto } from "./ai.types";

export const aiRepository = {
  async findMemories(
    ctx: WorkspaceContext,
    entityType: string,
    entityId: UUID,
    limit = 20
  ): Promise<AiMemory[]> {
    const { data, error } = await db
      .from("ai_memories")
      .select("id,workspace_id,entity_type,entity_id,memory_type,content,source,attributes,relevance_score,expires_at,created_at,updated_at")
      .eq("workspace_id", ctx.workspaceId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("relevance_score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AiMemory[];
  },

  async create(ctx: WorkspaceContext, dto: CreateMemoryDto, source = "agent"): Promise<AiMemory> {
    const { data, error } = await db
      .from("ai_memories")
      .insert({ ...dto, workspace_id: ctx.workspaceId, source })
      .select("*")
      .single();
    if (error) throw error;
    return data as AiMemory;
  },

  async delete(ctx: WorkspaceContext, id: UUID): Promise<void> {
    await db.from("ai_memories").delete().eq("id", id).eq("workspace_id", ctx.workspaceId);
  },
};
