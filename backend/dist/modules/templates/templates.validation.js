"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateFilterSchema = exports.UpdateTemplateSchema = exports.CreateTemplateSchema = void 0;
const zod_1 = require("zod");
const ButtonSchema = zod_1.z.object({
    type: zod_1.z.enum(["url", "phone", "quick_reply"]),
    text: zod_1.z.string().max(25),
    value: zod_1.z.string().optional(),
});
exports.CreateTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    type: zod_1.z.enum(["whatsapp", "email", "sms"]),
    category: zod_1.z.enum(["greeting", "followup", "appointment", "payment", "custom"]).default("custom"),
    language: zod_1.z.string().max(10).default("en"),
    subject: zod_1.z.string().max(255).optional(),
    body: zod_1.z.string().min(1).max(4096),
    footer: zod_1.z.string().max(60).optional(),
    buttons: zod_1.z.array(ButtonSchema).max(3).optional(),
    variables: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.UpdateTemplateSchema = exports.CreateTemplateSchema.partial();
exports.TemplateFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    type: zod_1.z.enum(["whatsapp", "email", "sms"]).optional(),
    category: zod_1.z.enum(["greeting", "followup", "appointment", "payment", "custom"]).optional(),
    status: zod_1.z.enum(["draft", "pending_approval", "approved", "rejected"]).optional(),
    search: zod_1.z.string().max(200).optional(),
    recently_used: zod_1.z.coerce.boolean().optional(),
});
//# sourceMappingURL=templates.validation.js.map