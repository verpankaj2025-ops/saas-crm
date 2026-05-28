import { z } from "zod";

export const SendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content_type:    z.enum(["text", "image", "document", "audio", "video", "template", "interactive"]).default("text"),
  content:         z.string().max(4096).optional(),
  is_internal:     z.boolean().optional(),
});

export const MessageFilterSchema = z.object({
  conversation_id: z.string().uuid(),
  limit:           z.coerce.number().int().min(1).max(100).default(50),
  before_id:       z.string().uuid().optional(),
});
