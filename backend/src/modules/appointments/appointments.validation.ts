import { z } from "zod";

export const CreateAppointmentSchema = z.object({
  contact_id:      z.string().uuid(),
  conversation_id: z.string().uuid().optional(),
  title:           z.string().min(1).max(255),
  description:     z.string().max(2000).optional(),
  start_at:        z.string().datetime({ message: "start_at must be ISO 8601" }),
  end_at:          z.string().datetime({ message: "end_at must be ISO 8601" }),
  timezone:        z.string().default("UTC"),
  location:        z.string().max(500).optional(),
  meeting_url:     z.string().url().optional().or(z.literal("")),
  assigned_to:     z.string().uuid().optional(),
}).refine((data) => new Date(data.end_at) > new Date(data.start_at), {
  message: "end_at must be after start_at",
  path: ["end_at"],
});

export const UpdateAppointmentSchema = z.object({
  title:           z.string().min(1).max(255).optional(),
  description:     z.string().max(2000).optional(),
  start_at:        z.string().datetime({ message: "start_at must be ISO 8601" }).optional(),
  end_at:          z.string().datetime({ message: "end_at must be ISO 8601" }).optional(),
  timezone:        z.string().optional(),
  location:        z.string().max(500).optional(),
  meeting_url:     z.string().url().optional().or(z.literal("")),
  assigned_to:     z.string().uuid().optional(),
  status:          z.enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  reminder_sent_at: z.string().datetime().optional(),
  external_cal_id:  z.string().optional(),
  external_cal_type: z.string().optional(),
  metadata:        z.record(z.unknown()).optional(),
}).refine((data) => {
  if (data.start_at && data.end_at) {
    return new Date(data.end_at) > new Date(data.start_at);
  }
  return true;
}, {
  message: "end_at must be after start_at",
  path: ["end_at"],
});

export const AppointmentFilterSchema = z.object({
  page:           z.coerce.number().int().min(1).default(1),
  limit:          z.coerce.number().int().min(1).max(100).default(25),
  sort_dir:       z.enum(["asc", "desc"]).default("asc"),
  contact_id:     z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(),
  assigned_to:    z.string().uuid().optional(),
  status:         z.enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  start_before:   z.string().datetime().optional(),
  start_after:    z.string().datetime().optional(),
  upcoming:       z.coerce.boolean().optional(),
});

// ── Reminder validation ────────────────────────────────────────

export const CreateReminderSchema = z.object({
  appointment_id: z.string().uuid(),
  reminder_type:  z.enum(["24h", "2h"]),
  scheduled_for:  z.string().datetime({ message: "scheduled_for must be ISO 8601" }),
});

export const UpdateReminderSchema = z.object({
  status:        z.enum(["scheduled", "sent", "completed", "cancelled", "failed"]).optional(),
  sent_at:       z.string().datetime().optional(),
  completed_at:  z.string().datetime().optional(),
  failed_reason: z.string().max(500).optional(),
  retry_count:   z.coerce.number().int().min(0).optional(),
  metadata:      z.record(z.unknown()).optional(),
});
