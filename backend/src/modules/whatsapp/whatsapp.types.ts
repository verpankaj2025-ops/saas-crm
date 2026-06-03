/**
 * WhatsApp Cloud API webhook payload types.
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */

export interface WhatsAppWebhookBody {
  object: "whatsapp_business_account";
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string; // WhatsApp Business Account ID
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: "messages";
}

export interface WhatsAppValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContactProfile[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
  errors?: WhatsAppError[];
}

export interface WhatsAppContactProfile {
  profile: { name: string };
  wa_id: string; // sender phone number (digits only, no +)
}

export interface WhatsAppMessage {
  from: string;       // sender phone number (digits only, no +)
  id: string;         // unique wamid — used for idempotency
  timestamp: string;  // unix epoch string
  type:
    | "text"
    | "image"
    | "audio"
    | "video"
    | "document"
    | "location"
    | "contacts"
    | "sticker"
    | "interactive"
    | "button"
    | "order"
    | "system"
    | "unknown";
  text?: { body: string };
  // Media payloads — each carries a media `id` resolved via the Graph media endpoint.
  image?:    { id: string; mime_type: string; caption?: string; sha256?: string };
  audio?:    { id: string; mime_type: string; sha256?: string };
  video?:    { id: string; mime_type: string; caption?: string; sha256?: string };
  document?: { id: string; mime_type: string; filename?: string; caption?: string; sha256?: string };
  sticker?:  { id: string; mime_type: string; sha256?: string; animated?: boolean };
}

// Inbound media kinds we download + persist. Excludes text/location/etc.
export type WhatsAppMediaType = "image" | "audio" | "video" | "document" | "sticker";

// Response of GET /{media-id} — the temporary, auth-gated download URL plus metadata.
export interface WhatsAppMediaInfo {
  url: string;            // short-lived URL, must be fetched with the Bearer token
  mime_type: string;
  sha256?: string;
  file_size?: number;
  id: string;
  messaging_product?: "whatsapp";
}

export interface WhatsAppStatus {
  id: string;        // wamid of the message whose status changed
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: WhatsAppError[];
}

export interface WhatsAppError {
  code: number;
  title: string;
  message?: string;
}

// ── Channel config shape stored in channels.config JSONB ──────

export interface WhatsAppChannelConfig {
  phone_number_id: string;
  display_phone_number: string;
  access_token?: string; // encrypted at app layer
  waba_id?: string;      // WhatsApp Business Account ID
}
