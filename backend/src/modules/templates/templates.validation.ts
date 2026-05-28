import { z } from "zod";

const ButtonSchema = z.object({
  type: z.enum(["url", "phone", "quick_reply"]),
  text: z.string().max(25),
  value: z.string().optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["whatsapp", "email", "sms"]),
  category: z.enum(["greeting", "followup", "appointment", "payment", "custom"]).default("custom"),
  language: z.string().max(10).default("en"),
  subject: z.string().max(255).optional(),
  body: z.string().min(1).max(4096),
  footer: z.string().max(60).optional(),
  buttons: z.array(ButtonSchema).max(3).optional(),
  variables: z.array(z.string()).optional(),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export const TemplateFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  type: z.enum(["whatsapp", "email", "sms"]).optional(),
  category: z.enum(["greeting", "followup", "appointment", "payment", "custom"]).optional(),
  status: z.enum(["draft", "pending_approval", "approved", "rejected"]).optional(),
  search: z.string().max(200).optional(),
  recently_used: z.coerce.boolean().optional(),
});
