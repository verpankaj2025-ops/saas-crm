"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateSummarySchema = exports.RefreshLeadScoreSchema = exports.UpdatePreferencesSchema = void 0;
const zod_1 = require("zod");
exports.UpdatePreferencesSchema = zod_1.z.object({
    communication: zod_1.z.enum(["email", "phone", "whatsapp", "any"]).optional(),
    timezone: zod_1.z.string().max(50).optional(),
    language: zod_1.z.string().max(10).optional(),
    preferred_hours: zod_1.z.string().max(50).optional(),
    do_not_contact: zod_1.z.boolean().optional(),
});
exports.RefreshLeadScoreSchema = zod_1.z.object({
    force: zod_1.z.boolean().optional(),
});
exports.GenerateSummarySchema = zod_1.z.object({
    conversation_id: zod_1.z.string().uuid(),
});
//# sourceMappingURL=memory.validation.js.map