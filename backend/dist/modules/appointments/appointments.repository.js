"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentsRepository = void 0;
const supabase_1 = require("../../config/supabase");
const APPOINTMENT_SELECT = "*, contacts(id,first_name,last_name,phone)";
const REMINDER_SELECT = "*";
function shape(row) {
    const r = row;
    const contacts = r.contacts;
    const { contacts: _c, ...rest } = r;
    void _c;
    return { ...rest, contact: contacts ?? null };
}
function shapeReminder(row) {
    return row;
}
exports.appointmentsRepository = {
    async findAll(ctx, filter) {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 25;
        const from = (page - 1) * limit;
        let query = supabase_1.db
            .from("appointments")
            .select(APPOINTMENT_SELECT, { count: "exact" })
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .range(from, from + limit - 1)
            .order("start_at", { ascending: filter.sort_dir !== "desc" });
        if (filter.contact_id)
            query = query.eq("contact_id", filter.contact_id);
        if (filter.conversation_id)
            query = query.eq("conversation_id", filter.conversation_id);
        if (filter.assigned_to)
            query = query.eq("assigned_to", filter.assigned_to);
        if (filter.status)
            query = query.eq("status", filter.status);
        if (filter.start_before)
            query = query.lte("start_at", filter.start_before);
        if (filter.start_after)
            query = query.gte("start_at", filter.start_after);
        if (filter.upcoming)
            query = query.gt("start_at", new Date().toISOString());
        const { data, count, error } = await query;
        if (error)
            throw error;
        return { data: (data ?? []).map(shape), total: count ?? 0, page, limit };
    },
    async findById(ctx, id) {
        const { data } = await supabase_1.db
            .from("appointments")
            .select(APPOINTMENT_SELECT)
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId)
            .is("deleted_at", null)
            .maybeSingle();
        return data ? shape(data) : null;
    },
    async create(ctx, dto) {
        const { data, error } = await supabase_1.db
            .from("appointments")
            .insert({
            ...dto,
            workspace_id: ctx.workspaceId,
            created_by: ctx.userId,
            assigned_to: dto.assigned_to ?? ctx.userId,
            metadata: {},
        })
            .select(APPOINTMENT_SELECT)
            .single();
        if (error)
            throw error;
        return shape(data);
    },
    async update(ctx, id, dto) {
        const { data, error } = await supabase_1.db
            .from("appointments")
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId)
            .select(APPOINTMENT_SELECT)
            .single();
        if (error)
            throw error;
        return shape(data);
    },
    async softDelete(ctx, id) {
        await supabase_1.db
            .from("appointments")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId);
    },
    // ── Worker helpers ──────────────────────────────────────
    async findByIdRaw(id) {
        const { data } = await supabase_1.db
            .from("appointments")
            .select(APPOINTMENT_SELECT)
            .eq("id", id)
            .is("deleted_at", null)
            .maybeSingle();
        return data ? shape(data) : null;
    },
    async saveJobIds(workspaceId, id, job24hId, job2hId) {
        const { data } = await supabase_1.db
            .from("appointments")
            .select("metadata")
            .eq("id", id)
            .eq("workspace_id", workspaceId)
            .maybeSingle();
        const existing = data?.metadata ?? {};
        await supabase_1.db
            .from("appointments")
            .update({ metadata: { ...existing, job_24h: job24hId, job_2h: job2hId }, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", workspaceId);
    },
    async markReminderSent(workspaceId, id) {
        await supabase_1.db
            .from("appointments")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", workspaceId);
    },
    // ── Reminder CRUD ───────────────────────────────────────
    async findRemindersByAppointment(ctx, appointmentId) {
        const { data, error } = await supabase_1.db
            .from("appointment_reminders")
            .select(REMINDER_SELECT)
            .eq("appointment_id", appointmentId)
            .eq("workspace_id", ctx.workspaceId)
            .order("scheduled_for", { ascending: true });
        if (error)
            throw error;
        return (data ?? []).map(shapeReminder);
    },
    async createReminder(ctx, dto) {
        const { data, error } = await supabase_1.db
            .from("appointment_reminders")
            .insert({
            ...dto,
            workspace_id: ctx.workspaceId,
            status: "scheduled",
            retry_count: 0,
            metadata: {},
        })
            .select(REMINDER_SELECT)
            .single();
        if (error)
            throw error;
        return shapeReminder(data);
    },
    async updateReminder(ctx, id, dto) {
        const { data, error } = await supabase_1.db
            .from("appointment_reminders")
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("workspace_id", ctx.workspaceId)
            .select(REMINDER_SELECT)
            .single();
        if (error)
            throw error;
        return shapeReminder(data);
    },
    async findReminderByIdRaw(id) {
        const { data } = await supabase_1.db
            .from("appointment_reminders")
            .select(REMINDER_SELECT)
            .eq("id", id)
            .maybeSingle();
        return data ? shapeReminder(data) : null;
    },
    async findPendingReminders(before) {
        const { data, error } = await supabase_1.db
            .from("appointment_reminders")
            .select(REMINDER_SELECT)
            .eq("status", "scheduled")
            .lte("scheduled_for", before)
            .order("scheduled_for", { ascending: true });
        if (error)
            throw error;
        return (data ?? []).map(shapeReminder);
    },
    async cancelRemindersForAppointment(ctx, appointmentId) {
        await supabase_1.db
            .from("appointment_reminders")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("appointment_id", appointmentId)
            .eq("workspace_id", ctx.workspaceId)
            .eq("status", "scheduled");
    },
};
//# sourceMappingURL=appointments.repository.js.map