// ── Inbound message parsing helpers (pure — unit tested) ──────
// Kept dependency-free (no DB/Redis imports) so they can be unit tested
// in isolation and reused by the service without side effects.

import type { Message } from "../messages/messages.types";
import type { WhatsAppMessage, WhatsAppMediaType } from "./whatsapp.types";

export interface ExtractedMedia {
  type:     WhatsAppMediaType;
  mediaId:  string;
  mime:     string;
  caption:  string | null;
  filename: string | null;
}

// Pulls the media descriptor out of an inbound message, or null for non-media.
export function extractMedia(wamsg: WhatsAppMessage): ExtractedMedia | null {
  const pick = (
    type: WhatsAppMediaType,
    obj?: { id: string; mime_type: string; caption?: string; filename?: string },
  ): ExtractedMedia | null =>
    obj?.id
      ? { type, mediaId: obj.id, mime: obj.mime_type, caption: obj.caption ?? null, filename: obj.filename ?? null }
      : null;

  switch (wamsg.type) {
    case "image":    return pick("image", wamsg.image);
    case "video":    return pick("video", wamsg.video);
    case "audio":    return pick("audio", wamsg.audio);
    case "document": return pick("document", wamsg.document);
    case "sticker":  return pick("sticker", wamsg.sticker);
    default:         return null;
  }
}

// Maps a WhatsApp media type to the CRM message content_type.
// Stickers are stored as images (no dedicated content_type).
export function mediaContentType(type: WhatsAppMediaType): Message["content_type"] {
  return type === "sticker" ? "image" : type;
}
