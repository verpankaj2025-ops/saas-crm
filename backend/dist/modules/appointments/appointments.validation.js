"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateReminderSchema = exports.CreateReminderSchema = exports.AppointmentFilterSchema = exports.UpdateAppointmentSchema = exports.CreateAppointmentSchema = void 0;
const zod_1 = require("zod");
exports.CreateAppointmentSchema = zod_1.z.object({
    contact_id: zod_1.z.string().uuid(),
    conversation_id: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().max(2000).optional(),
    start_at: zod_1.z.string().datetime({ message: "start_at must be ISO 8601" }),
    end_at: zod_1.z.string().datetime({ message: "end_at must be ISO 8601" }),
    timezone: zod_1.z.string().default("UTC"),
    location: zod_1.z.string().max(500).optional(),
    meeting_url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    assigned_to: zod_1.z.string().uuid().optional(),
}).refine((data) => new Date(data.end_at) > new Date(data.start_at), {
    message: "end_at must be after start_at",
    path: ["end_at"],
});
exports.UpdateAppointmentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().max(2000).optional(),
    start_at: zod_1.z.string().datetime({ message: "start_at must be ISO 8601" }).optional(),
    end_at: zod_1.z.string().datetime({ message: "end_at must be ISO 8601" }).optional(),
    timezone: zod_1.z.string().optional(),
    location: zod_1.z.string().max(500).optional(),
    meeting_url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    assigned_to: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"]).optional(),
    reminder_sent_at: zod_1.z.string().datetime().optional(),
    external_cal_id: zod_1.z.string().optional(),
    external_cal_type: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
}).refine((data) => {
    if (data.start_at && data.end_at) {
        return new Date(data.end_at) > new Date(data.start_at);
    }
    return true;
}, {
    message: "end_at must be after start_at",
    path: ["end_at"],
});
exports.AppointmentFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    sort_dir: zod_1.z.enum(["asc", "desc"]).default("asc"),
    contact_id: zod_1.z.string().uuid().optional(),
    conversation_id: zod_1.z.string().uuid().optional(),
    assigned_to: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"]).optional(),
    start_before: zod_1.z.string().datetime().optional(),
    start_after: zod_1.z.string().datetime().optional(),
    upcoming: zod_1.z.coerce.boolean().optional(),
});
// ── Reminder validation ────────────────────────────────────────
exports.CreateReminderSchema = zod_1.z.object({
    appointment_id: zod_1.z.string().uuid(),
    reminder_type: zod_1.z.enum(["24h", "2h"]),
    scheduled_for: zod_1.z.string().datetime({ message: "scheduled_for must be ISO 8601" }),
});
exports.UpdateReminderSchema = zod_1.z.object({
    status: zod_1.z.enum(["scheduled", "sent", "completed", "cancelled", "failed"]).optional(),
    sent_at: zod_1.z.string().datetime().optional(),
    completed_at: zod_1.z.string().datetime().optional(),
    failed_reason: zod_1.z.string().max(500).optional(),
    retry_count: zod_1.z.coerce.number().int().min(0).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
//# sourceMappingURL=appointments.validation.js.map