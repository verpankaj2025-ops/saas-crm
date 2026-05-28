"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFilterSchema = exports.SendMessageSchema = void 0;
const zod_1 = require("zod");
exports.SendMessageSchema = zod_1.z.object({
    conversation_id: zod_1.z.string().uuid(),
    content_type: zod_1.z.enum(["text", "image", "document", "audio", "video", "template", "interactive"]).default("text"),
    content: zod_1.z.string().max(4096).optional(),
    is_internal: zod_1.z.boolean().optional(),
});
exports.MessageFilterSchema = zod_1.z.object({
    conversation_id: zod_1.z.string().uuid(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    before_id: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=messages.validation.js.map