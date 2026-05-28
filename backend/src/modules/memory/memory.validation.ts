import { z } from "zod";
import type { UpdatePreferencesDto, RefreshLeadScoreDto, GenerateSummaryDto } from "./memory.types";

export const UpdatePreferencesSchema = z.object({
  communication: z.enum(["email", "phone", "whatsapp", "any"]).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  preferred_hours: z.string().max(50).optional(),
  do_not_contact: z.boolean().optional(),
});

export const RefreshLeadScoreSchema = z.object({
  force: z.boolean().optional(),
});

export const GenerateSummarySchema = z.object({
  conversation_id: z.string().uuid(),
});
