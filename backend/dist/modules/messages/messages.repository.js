"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRepository = void 0;
const supabase_1 = require("../../config/supabase");
const MSG_COLS = "id,workspace_id,conversation_id,sender_type,sender_id," +
    "content,content_type,status,attachment_url,attachment_metadata," +
    "is_internal,external_id,created_at,updated_at";
exports.messagesRepository = {
    async findByConversation(ctx, filter) {
        const limit = filter.limit ?? 50;
        let query = supabase_1.db
            .from("messages")
            .select(MSG_COLS)
            .eq("workspace_id", ctx.workspaceId)
            .eq("conversation_id", filter.conversation_id)
            .order("created_at", { ascending: false })
            .limit(limit);
        if (filter.before_id) {
            const { data: cursor } = await supabase_1.db
                .from("messages")
                .select("created_at")
                .eq("id", filter.before_id)
                .maybeSingle();
            if (cursor)
                query = query.lt("created_at", cursor.created_at);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return (data ?? []);
    },
    async findById(ctx, id) {
        const { data } = await supabase_1.db
            .from("messages")
            .select(MSG_COLS)
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId)
            .maybeSingle();
        return data ?? null;
    },
    async create(ctx, dto) {
        const { data: raw, error } = await supabase_1.db
            .from("messages")
            .insert({
            workspace_id: ctx.workspaceId,
            conversation_id: dto.conversation_id,
            sender_type: dto.sender_type,
            sender_id: dto.sender_id,
            content: dto.content ?? null,
            content_type: dto.content_type ?? "text",
            is_internal: dto.is_internal ?? false,
            status: "queued",
        })
            .select(MSG_COLS)
            .single();
        if (error)
            throw error;
        const message = raw;
        // Update conversation denormalized fields
        const preview = (dto.content ?? "").slice(0, 120);
        await supabase_1.db
            .from("conversations")
            .update({
            last_message_at: message.created_at,
            last_message_preview: preview,
            updated_at: new Date().toISOString(),
        })
            .eq("id", dto.conversation_id)
            .eq("workspace_id", ctx.workspaceId);
        return message;
    },
    async updateStatus(workspaceId, id, patch) {
        await supabase_1.db
            .from("messages")
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", workspaceId);
    },
    async updateStatusByExternalId(workspaceId, externalId, status) {
        const { data } = await supabase_1.db
            .from("messages")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("workspace_id", workspaceId)
            .eq("external_id", externalId)
            .select(MSG_COLS)
            .maybeSingle();
        return data ?? null;
    },
    // ── Webhook helpers ───────────────────────────────────────────
    async findByExternalId(workspaceId, externalId) {
        const { data } = await supabase_1.db
            .from("messages")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("external_id", externalId)
            .maybeSingle();
        return data ?? null;
    },
    async createInbound(workspaceId, dto) {
        const { data: raw, error } = await supabase_1.db
            .from("messages")
            .insert({
            workspace_id: workspaceId,
            conversation_id: dto.conversation_id,
            sender_type: "contact",
            sender_id: null,
            content: dto.content,
            content_type: dto.content_type,
            is_internal: false,
            status: "sent",
            external_id: dto.external_id,
        })
            .select(MSG_COLS)
            .single();
        if (error)
            throw error;
        return raw;
    },
};
//# sourceMappingURL=messages.repository.js.map