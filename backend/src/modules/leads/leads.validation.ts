import { z } from "zod";

const LEAD_STATUSES = ["new", "contacted", "qualified", "booked", "paid", "lost"] as const;
const LEAD_SOURCES = [
  "whatsapp", "meta_ads", "website", "google_business", "manual", "referral", "other",
] as const;

// Money: non-negative, max 2 decimals, bounded by NUMERIC(12,2).
const money = z
  .number()
  .min(0, "must be >= 0")
  .max(9_999_999_999.99, "exceeds maximum")
  // Allow at most 2 decimal places (epsilon guards float imprecision, e.g. 10.12 * 100).
  .refine((n) => Number.isFinite(n) && Math.abs(n * 100 - Math.round(n * 100)) < 1e-9, "max 2 decimal places");

export const CreateLeadSchema = z.object({
  contact_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable().optional(),
  channel_id: z.string().uuid().nullable().optional(),
  source: z.enum(LEAD_SOURCES).default("manual"),
  package: z.string().max(255).nullable().optional(),
  amount: money.default(0),
  paid_amount: money.default(0),
  status: z.enum(LEAD_STATUSES).default("new"),
  assigned_agent: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

// All fields optional on update; contact_id cannot be reassigned.
export const UpdateLeadSchema = CreateLeadSchema.partial().omit({ contact_id: true });

export const LeadFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assigned_agent: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});
