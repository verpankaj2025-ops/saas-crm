"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactsRepository = void 0;
const supabase_1 = require("../../config/supabase");
// ── Select strings ────────────────────────────────────────────
const CONTACT_COLS = "id,workspace_id,first_name,last_name,email,phone,company,job_title,avatar_url," +
    "status,source,assigned_to,custom_fields,ai_summary,last_contacted_at,created_at,updated_at";
const CONTACT_WITH_TAGS = `${CONTACT_COLS},contact_tags(tag_id,tags(id,name,color,workspace_id,created_at))`;
const TAG_COLS = "id,workspace_id,name,color,created_at";
const NOTE_COLS = "id,workspace_id,contact_id,author_id,content,is_pinned,source,created_at,updated_at";
function flattenTags(raw) {
    const { contact_tags, ...rest } = raw;
    return {
        ...rest,
        tags: (contact_tags ?? []).map((ct) => ct.tags).filter((t) => t !== null),
    };
}
// ── Repository ────────────────────────────────────────────────
exports.contactsRepository = {
    // ── Contacts ────────────────────────────────────────────────
    async findAll(ctx, filter) {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 25;
        const from = (page - 1) * limit;
        // Pre-filter by tag_ids via junction table
        let allowedIds = null;
        if (filter.tag_ids?.length) {
            const { data: ct } = await supabase_1.db
                .from("contact_tags")
                .select("contact_id")
                .in("tag_id", filter.tag_ids);
            allowedIds = [...new Set((ct ?? []).map((r) => r.contact_id))];
            if (allowedIds.length === 0)
                return { data: [], total: 0, page, limit };
        }
        let query = supabase_1.db
            .from("contacts")
            .select(CONTACT_WITH_TAGS, { count: "exact" })
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .range(from, from + limit - 1)
            .order(filter.sort_by ?? "created_at", { ascending: filter.sort_dir === "asc" });
        if (filter.status)
            query = query.eq("status", filter.status);
        if (filter.assigned_to)
            query = query.eq("assigned_to", filter.assigned_to);
        if (allowedIds)
            query = query.in("id", allowedIds);
        if (filter.search) {
            const s = filter.search.replace(/[%_]/g, "\\$&");
            query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,company.ilike.%${s}%`);
        }
        const { data, count, error } = await query;
        if (error)
            throw error;
        return {
            data: (data ?? []).map((r) => flattenTags(r)),
            total: count ?? 0,
            page,
            limit,
        };
    },
    async findById(ctx, id) {
        const { data } = await supabase_1.db
            .from("contacts")
            .select(CONTACT_WITH_TAGS)
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .maybeSingle();
        if (!data)
            return null;
        return flattenTags(data);
    },
    async create(ctx, dto) {
        const { data, error } = await supabase_1.db
            .from("contacts")
            .insert({ ...dto, workspace_id: ctx.workspaceId, created_by: ctx.userId })
            .select(CONTACT_WITH_TAGS)
            .single();
        if (error)
            throw error;
        return flattenTags(data);
    },
    async update(ctx, id, dto) {
        const { data, error } = await supabase_1.db
            .from("contacts")
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .select(CONTACT_WITH_TAGS)
            .single();
        if (error)
            throw error;
        return flattenTags(data);
    },
    async softDelete(ctx, id) {
        const { error } = await supabase_1.db
            .from("contacts")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId);
        if (error)
            throw error;
    },
    // ── Workspace tags ───────────────────────────────────────────
    async listTags(ctx) {
        const { data, error } = await supabase_1.db
            .from("tags")
            .select(TAG_COLS)
            .eq("workspace_id", ctx.workspaceId)
            .order("name", { ascending: true });
        if (error)
            throw error;
        return (data ?? []);
    },
    async findTagById(ctx, tagId) {
        const { data } = await supabase_1.db
            .from("tags")
            .select(TAG_COLS)
            .eq("id", tagId)
            .eq("workspace_id", ctx.workspaceId)
            .maybeSingle();
        return data ?? null;
    },
    async createTag(ctx, dto) {
        const name = dto.name.trim();
        // Return existing tag if name matches (case-insensitive)
        const { data: existing } = await supabase_1.db
            .from("tags")
            .select(TAG_COLS)
            .eq("workspace_id", ctx.workspaceId)
            .ilike("name", name)
            .maybeSingle();
        if (existing)
            return existing;
        const { data, error } = await supabase_1.db
            .from("tags")
            .insert({ workspace_id: ctx.workspaceId, name, color: dto.color ?? "#6366f1" })
            .select(TAG_COLS)
            .single();
        if (error)
            throw error;
        return data;
    },
    // ── Contact ↔ tag junction ────────────────────────────────────
    async addContactTag(ctx, contactId, tagId) {
        const tag = await exports.contactsRepository.findTagById(ctx, tagId);
        if (!tag)
            throw new Error("Tag not found in workspace");
        await supabase_1.db
            .from("contact_tags")
            .upsert({ contact_id: contactId, tag_id: tagId, tagged_by: ctx.userId }, { onConflict: "contact_id,tag_id" });
    },
    async removeContactTag(_ctx, contactId, tagId) {
        await supabase_1.db
            .from("contact_tags")
            .delete()
            .eq("contact_id", contactId)
            .eq("tag_id", tagId);
    },
    // ── Notes ─────────────────────────────────────────────────────
    async listNotes(ctx, contactId) {
        const { data, error } = await supabase_1.db
            .from("contact_notes")
            .select(NOTE_COLS)
            .eq("contact_id", contactId)
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return (data ?? []);
    },
    async findNoteById(ctx, noteId) {
        const { data } = await supabase_1.db
            .from("contact_notes")
            .select(NOTE_COLS)
            .eq("id", noteId)
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .maybeSingle();
        return data ?? null;
    },
    async createNote(ctx, contactId, dto) {
        const { data, error } = await supabase_1.db
            .from("contact_notes")
            .insert({
            workspace_id: ctx.workspaceId,
            contact_id: contactId,
            author_id: ctx.userId,
            content: dto.content,
            is_pinned: dto.is_pinned ?? false,
            source: "manual",
        })
            .select(NOTE_COLS)
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateNote(ctx, noteId, dto) {
        const { data, error } = await supabase_1.db
            .from("contact_notes")
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq("id", noteId)
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .select(NOTE_COLS)
            .single();
        if (error)
            throw error;
        return data;
    },
    async deleteNote(ctx, noteId) {
        const { error } = await supabase_1.db
            .from("contact_notes")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", noteId)
            .eq("workspace_id", ctx.workspaceId);
        if (error)
            throw error;
    },
    // ── Webhook helpers (no auth context) ───────────────────────
    async findOrCreateByPhone(workspaceId, phone, profileName) {
        const numericPhone = phone.replace(/\D/g, "");
        // Match stored phone regardless of leading + (e.g. "+1555" or "1555")
        const { data: existing } = await supabase_1.db
            .from("contacts")
            .select("id,first_name,last_name")
            .eq("workspace_id", workspaceId)
            .is("deleted_at", null)
            .ilike("phone", `%${numericPhone}`)
            .limit(1)
            .maybeSingle();
        if (existing)
            return existing;
        // Create new contact from WhatsApp profile
        const parts = profileName.trim().split(/\s+/);
        const firstName = parts[0] ?? "Unknown";
        const lastName = parts.slice(1).join(" ") || null;
        const { data, error } = await supabase_1.db
            .from("contacts")
            .insert({
            workspace_id: workspaceId,
            first_name: firstName,
            last_name: lastName,
            phone: `+${numericPhone}`,
            source: "whatsapp",
            status: "lead",
        })
            .select("id,first_name,last_name")
            .single();
        if (error)
            throw error;
        return data;
    },
};
//# sourceMappingURL=contacts.repository.js.map