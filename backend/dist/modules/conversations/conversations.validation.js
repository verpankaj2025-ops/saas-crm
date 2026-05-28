"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationFilterSchema = exports.UpdateConversationSchema = exports.CreateConversationSchema = void 0;
const zod_1 = require("zod");
exports.CreateConversationSchema = zod_1.z.object({
    contact_id: zod_1.z.string().uuid(),
    channel_id: zod_1.z.string().uuid(),
    subject: zod_1.z.string().max(255).optional(),
    assigned_to: zod_1.z.string().uuid().optional(),
});
exports.UpdateConversationSchema = zod_1.z.object({
    status: zod_1.z.enum(["open", "pending", "resolved", "archived"]).optional(),
    assigned_to: zod_1.z.string().uuid().nullable().optional(),
    subject: zod_1.z.string().max(255).optional(),
});
exports.ConversationFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    sort_dir: zod_1.z.enum(["asc", "desc"]).default("desc"),
    status: zod_1.z.enum(["open", "pending", "resolved", "archived"]).optional(),
    assigned_to: zod_1.z.string().uuid().optional(),
    contact_id: zod_1.z.string().uuid().optional(),
    channel_id: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=conversations.validation.js.map