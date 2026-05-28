"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupFilterSchema = exports.SnoozeFollowupSchema = exports.UpdateFollowupSchema = exports.CreateFollowupSchema = void 0;
const zod_1 = require("zod");
exports.CreateFollowupSchema = zod_1.z.object({
    contact_id: zod_1.z.string().uuid(),
    conversation_id: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(1).max(255),
    notes: zod_1.z.string().max(2000).optional(),
    priority: zod_1.z.enum(["low", "medium", "high"]).default("medium"),
    due_at: zod_1.z.string().datetime({ message: "due_at must be ISO 8601" }),
    assigned_to: zod_1.z.string().uuid().optional(),
});
exports.UpdateFollowupSchema = exports.CreateFollowupSchema.omit({ contact_id: true }).partial().extend({
    status: zod_1.z.enum(["pending", "completed", "cancelled", "snoozed"]).optional(),
});
exports.SnoozeFollowupSchema = zod_1.z.object({
    snooze_until: zod_1.z.string().datetime({ message: "snooze_until must be ISO 8601" }),
});
exports.FollowupFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    sort_dir: zod_1.z.enum(["asc", "desc"]).default("asc"),
    contact_id: zod_1.z.string().uuid().optional(),
    conversation_id: zod_1.z.string().uuid().optional(),
    assigned_to: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["pending", "completed", "cancelled", "snoozed"]).optional(),
    due_before: zod_1.z.string().datetime().optional(),
    due_after: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=followups.validation.js.map