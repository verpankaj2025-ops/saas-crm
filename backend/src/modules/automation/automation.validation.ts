import { z } from "zod";

const ConditionSchema = z.object({
  field: z.string(),
  op: z.enum(["eq", "neq", "contains", "gt", "lt", "in"]),
  value: z.unknown(),
});

const ActionSchema = z.object({
  type: z.enum(["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]),
}).passthrough();

export const CreateAutomationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  trigger_type: z.string().min(1),
  trigger_config: z.record(z.unknown()).default({}),
  conditions: z.array(ConditionSchema).default([]),
  actions: z.array(ActionSchema).min(1),
  priority: z.number().int().min(1).max(1000).default(100),
});

export const UpdateAutomationSchema = CreateAutomationSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const AutomationFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  is_active: z.coerce.boolean().optional(),
  trigger_type: z.string().optional(),
});
