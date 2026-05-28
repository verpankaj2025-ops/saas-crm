import type { UUID, Timestamps } from "../../types/common";

// ── Lead Score ───────────────────────────────────────────────────

export type LeadScore = "cold" | "warm" | "hot";

export interface ContactPreferences {
  communication?: "email" | "phone" | "whatsapp" | "any";
  timezone?: string;
  language?: string;
  preferred_hours?: string; // e.g., "9am-5pm"
  do_not_contact?: boolean;
}

export interface LeadScoreData {
  score: LeadScore;
  updated_at: string;
  reason: string;
}

// ── Memory Types ───────────────────────────────────────────────────

export interface ConversationSummary {
  conversation_id: UUID;
  message_count: number;
  first_message_at: string;
  last_message_at: string;
  summary: string;
  key_topics?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

export interface InteractionSummary {
  contact_id: UUID;
  total_conversations: number;
  total_messages: number;
  last_contacted_at: string;
  avg_response_time_hours?: number;
  preferred_channels: string[];
}

export interface CustomerInsights {
  contact_id: UUID;
  lead_score: LeadScoreData;
  preferences: ContactPreferences;
  interaction_summary: InteractionSummary;
  important_notes: ImportantNote[];
}

export interface ImportantNote {
  id: UUID;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
}

// ── DTOs ─────────────────────────────────────────────────────────

export interface UpdatePreferencesDto {
  communication?: ContactPreferences["communication"];
  timezone?: ContactPreferences["timezone"];
  language?: ContactPreferences["language"];
  preferred_hours?: ContactPreferences["preferred_hours"];
  do_not_contact?: ContactPreferences["do_not_contact"];
}

export interface RefreshLeadScoreDto {
  force?: boolean;
}

export interface GenerateSummaryDto {
  conversation_id: UUID;
}
