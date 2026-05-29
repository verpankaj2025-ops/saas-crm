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

export const SuggestionQuerySchema = z.object({
  tone:     z.enum(["professional", "friendly", "formal", "casual"]).default("professional"),
  force_ai: z.coerce.boolean().default(false),
});

export type CreateMemoryInput      = z.infer<typeof CreateMemorySchema>;
export type MemoryQueryInput        = z.infer<typeof MemoryQuerySchema>;
export type SuggestionQueryInput    = z.infer<typeof SuggestionQuerySchema>;
