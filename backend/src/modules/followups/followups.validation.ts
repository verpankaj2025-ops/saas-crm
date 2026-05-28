import { z } from "zod";

export const CreateFollowupSchema = z.object({
  contact_id:      z.string().uuid(),
  conversation_id: z.string().uuid().optional(),
  title:           z.string().min(1).max(255),
  notes:           z.string().max(2000).optional(),
  priority:        z.enum(["low", "medium", "high"]).default("medium"),
  due_at:          z.string().datetime({ message: "due_at must be ISO 8601" }),
  assigned_to:     z.string().uuid().optional(),
});

export const UpdateFollowupSchema = CreateFollowupSchema.omit({ contact_id: true }).partial().extend({
  status: z.enum(["pending", "completed", "cancelled", "snoozed"]).optional(),
});

export const SnoozeFollowupSchema = z.object({
  snooze_until: z.string().datetime({ message: "snooze_until must be ISO 8601" }),
});

export const FollowupFilterSchema = z.object({
  page:            z.coerce.number().int().min(1).default(1),
  limit:           z.coerce.number().int().min(1).max(100).default(25),
  sort_dir:        z.enum(["asc", "desc"]).default("asc"),
  contact_id:      z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(),
  assigned_to:     z.string().uuid().optional(),
  status:          z.enum(["pending", "completed", "cancelled", "snoozed"]).optional(),
  due_before:      z.string().datetime().optional(),
  due_after:       z.string().datetime().optional(),
});
