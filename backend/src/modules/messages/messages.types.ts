import type { UUID } from "../../types/common";

export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export interface Message {
  id: UUID;
  workspace_id: UUID;
  conversation_id: UUID;
  sender_type: "contact" | "agent" | "bot";
  sender_id: UUID | null;
  content: string | null;
  content_type: "text" | "image" | "document" | "audio" | "video" | "template" | "interactive";
  status: MessageStatus;
  attachment_url: string | null;
  attachment_metadata: Record<string, unknown> | null;
  is_internal: boolean;
  external_id: string | null;
  // ── Status timestamps — set when each transition occurs ──────
  queued_at:    string;         // always present (set on insert)
  sent_at:      string | null;
  delivered_at: string | null;
  read_at:      string | null;
  failed_at:    string | null;
  created_at: string;
  updated_at: string;
}

export interface SendMessageDto {
  conversation_id: UUID;
  content_type?: Message["content_type"];
  content?: string;
  is_internal?: boolean;
  // Media: a public URL the provider can fetch, plus optional metadata.
  attachment_url?: string | null;
  attachment_metadata?: Record<string, unknown> | null;
  // Template send: reference an existing approved template + ordered/keyed vars.
  template_id?: UUID;
  template_variables?: Record<string, string>;
}

export interface MessageFilter {
  conversation_id: UUID;
  limit?: number;
  before_id?: UUID;
}
