import { z } from "zod";

export const SendMessageSchema = z
  .object({
    conversation_id: z.string().uuid(),
    content_type:    z.enum(["text", "image", "document", "audio", "video", "template", "interactive"]).default("text"),
    content:         z.string().max(4096).optional(),
    is_internal:     z.boolean().optional(),
    // Media delivery: public URL + optional metadata.
    attachment_url:      z.string().url().optional(),
    attachment_metadata: z.record(z.unknown()).optional(),
    // Template delivery: reference an existing approved template.
    template_id:         z.string().uuid().optional(),
    template_variables:  z.record(z.string()).optional(),
  })
  // Media messages must carry a URL; template messages must carry a template_id.
  .refine(
    (d) => !["image", "document", "audio", "video"].includes(d.content_type) || !!d.attachment_url,
    { message: "attachment_url is required for media messages", path: ["attachment_url"] },
  )
  .refine(
    (d) => d.content_type !== "template" || !!d.template_id,
    { message: "template_id is required for template messages", path: ["template_id"] },
  );

export const MessageFilterSchema = z.object({
  conversation_id: z.string().uuid(),
  limit:           z.coerce.number().int().min(1).max(100).default(50),
  before_id:       z.string().uuid().optional(),
});
