"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationFilterSchema = exports.UpdateAutomationSchema = exports.CreateAutomationSchema = void 0;
const zod_1 = require("zod");
const ConditionSchema = zod_1.z.object({
    field: zod_1.z.string(),
    op: zod_1.z.enum(["eq", "neq", "contains", "gt", "lt", "in"]),
    value: zod_1.z.unknown(),
});
const ActionSchema = zod_1.z.object({
    type: zod_1.z.enum(["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]),
}).passthrough();
exports.CreateAutomationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().max(1000).optional(),
    trigger_type: zod_1.z.string().min(1),
    trigger_config: zod_1.z.record(zod_1.z.unknown()).default({}),
    conditions: zod_1.z.array(ConditionSchema).default([]),
    actions: zod_1.z.array(ActionSchema).min(1),
    priority: zod_1.z.number().int().min(1).max(1000).default(100),
});
exports.UpdateAutomationSchema = exports.CreateAutomationSchema.partial().extend({
    is_active: zod_1.z.boolean().optional(),
});
exports.AutomationFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    is_active: zod_1.z.coerce.boolean().optional(),
    trigger_type: zod_1.z.string().optional(),
});
//# sourceMappingURL=automation.validation.js.map