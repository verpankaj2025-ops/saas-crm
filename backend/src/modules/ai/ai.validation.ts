import { z } from "zod";

export const CreateMemorySchema = z.object({
  entity_type: z.enum(["contact", "conversation", "workspace"]),
  entity_id: z.string().uuid(),
  memory_type: z.enum(["fact", "preference", "summary", "intent", "context"]),
  content: z.string().min(1).max(2000),
  attributes: z.record(z.unknown()).optional(),
  expires_at: z.string().datetime().optional(),
});

export const MemoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  memory_type: z.enum(["fact", "preference", "summary", "intent", "context"]).optional(),
});
