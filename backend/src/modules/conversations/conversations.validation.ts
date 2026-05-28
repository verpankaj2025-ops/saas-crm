import { z } from "zod";

export const CreateConversationSchema = z.object({
  contact_id: z.string().uuid(),
  channel_id: z.string().uuid(),
  subject: z.string().max(255).optional(),
  assigned_to: z.string().uuid().optional(),
});

export const UpdateConversationSchema = z.object({
  status: z.enum(["open", "pending", "resolved", "archived"]).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  subject: z.string().max(255).optional(),
});

export const ConversationFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort_dir: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["open", "pending", "resolved", "archived"]).optional(),
  assigned_to: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  channel_id: z.string().uuid().optional(),
});
