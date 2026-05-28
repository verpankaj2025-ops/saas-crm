"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationRepository = void 0;
const supabase_1 = require("../../config/supabase");
exports.automationRepository = {
    async findAll(ctx, filter) {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 25;
        const from = (page - 1) * limit;
        let query = supabase_1.db.from("automation_rules").select("*", { count: "exact" })
            .eq("workspace_id", ctx.workspaceId).is("deleted_at", null)
            .range(from, from + limit - 1).order("priority", { ascending: true });
        if (filter.is_active !== undefined)
            query = query.eq("is_active", filter.is_active);
        if (filter.trigger_type)
            query = query.eq("trigger_type", filter.trigger_type);
        const { data, count, error } = await query;
        if (error)
            throw error;
        return { data: (data ?? []), total: count ?? 0, page, limit };
    },
    async findById(ctx, id) {
        const { data } = await supabase_1.db.from("automation_rules").select("*").eq("id", id).eq("workspace_id", ctx.workspaceId).is("deleted_at", null).single();
        return data ?? null;
    },
    async create(ctx, dto) {
        const { data, error } = await supabase_1.db.from("automation_rules").insert({ ...dto, workspace_id: ctx.workspaceId, created_by: ctx.userId }).select("*").single();
        if (error)
            throw error;
        return data;
    },
    async update(ctx, id, dto) {
        const { data, error } = await supabase_1.db.from("automation_rules").update(dto).eq("id", id).eq("workspace_id", ctx.workspaceId).select("*").single();
        if (error)
            throw error;
        return data;
    },
    async softDelete(ctx, id) {
        await supabase_1.db.from("automation_rules").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", ctx.workspaceId);
    },
};
//# sourceMappingURL=automation.repository.js.map