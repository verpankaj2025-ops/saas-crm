"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRepository = void 0;
const supabase_1 = require("../../config/supabase");
exports.aiRepository = {
    async findMemories(ctx, entityType, entityId, limit = 20) {
        const { data, error } = await supabase_1.db
            .from("ai_memories")
            .select("id,workspace_id,entity_type,entity_id,memory_type,content,source,attributes,relevance_score,expires_at,created_at,updated_at")
            .eq("workspace_id", ctx.workspaceId)
            .eq("entity_type", entityType)
            .eq("entity_id", entityId)
            .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
            .order("relevance_score", { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return (data ?? []);
    },
    async create(ctx, dto, source = "agent") {
        const { data, error } = await supabase_1.db
            .from("ai_memories")
            .insert({ ...dto, workspace_id: ctx.workspaceId, source })
            .select("*")
            .single();
        if (error)
            throw error;
        return data;
    },
    async delete(ctx, id) {
        await supabase_1.db.from("ai_memories").delete().eq("id", id).eq("workspace_id", ctx.workspaceId);
    },
};
//# sourceMappingURL=ai.repository.js.map