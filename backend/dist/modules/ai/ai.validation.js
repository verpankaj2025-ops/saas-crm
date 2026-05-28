"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryQuerySchema = exports.CreateMemorySchema = void 0;
const zod_1 = require("zod");
exports.CreateMemorySchema = zod_1.z.object({
    entity_type: zod_1.z.enum(["contact", "conversation", "workspace"]),
    entity_id: zod_1.z.string().uuid(),
    memory_type: zod_1.z.enum(["fact", "preference", "summary", "intent", "context"]),
    content: zod_1.z.string().min(1).max(2000),
    attributes: zod_1.z.record(zod_1.z.unknown()).optional(),
    expires_at: zod_1.z.string().datetime().optional(),
});
exports.MemoryQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
    memory_type: zod_1.z.enum(["fact", "preference", "summary", "intent", "context"]).optional(),
});
//# sourceMappingURL=ai.validation.js.map