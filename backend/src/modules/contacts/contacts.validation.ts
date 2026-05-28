import { z } from "zod";

export const CreateContactSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name:  z.string().max(100).optional(),
  email:      z.string().email().optional(),
  phone:      z.string().max(30).optional(),
  company:    z.string().max(150).optional(),
  job_title:  z.string().max(150).optional(),
  source:     z.string().max(50).optional(),
  assigned_to:   z.string().uuid().optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial().extend({
  status: z.enum(["active", "inactive", "archived"]).optional(),
});

export const ContactFilterSchema = z.object({
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(100).default(25),
  sort_by:     z.string().optional(),
  sort_dir:    z.enum(["asc", "desc"]).default("desc"),
  status:      z.enum(["active", "inactive", "archived"]).optional(),
  assigned_to: z.string().uuid().optional(),
  search:      z.string().max(200).optional(),
  // Express parses ?tag_ids=a&tag_ids=b as array, ?tag_ids=a as string
  tag_ids: z.preprocess(
    (v) => (typeof v === "string" ? [v] : v),
    z.array(z.string().uuid()).optional()
  ),
});

export const CreateTagSchema = z.object({
  name:  z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const AddTagSchema = z.object({
  tag_id: z.string().uuid(),
});

export const CreateNoteSchema = z.object({
  content:   z.string().min(1).max(5000),
  is_pinned: z.boolean().optional(),
});

export const UpdateNoteSchema = z.object({
  content:   z.string().min(1).max(5000).optional(),
  is_pinned: z.boolean().optional(),
});
