// ── Inbound media storage ─────────────────────────────────────
// Downloaded WhatsApp media is uploaded to the Supabase Storage bucket
// `whatsapp-media` and served back via its public URL. The bucket must
// exist and be public (created out-of-band — no DB migration involved).

import { supabaseAdmin } from "../../config/supabase";
import { logger } from "../../lib/logger";

export const WHATSAPP_MEDIA_BUCKET = "whatsapp-media";

// Minimal MIME → extension map for the file types WhatsApp delivers.
// The MIME may carry parameters (e.g. "audio/ogg; codecs=opus") — we split on ";".
const MIME_EXT: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
  "video/mp4":  "mp4",
  "video/3gpp": "3gp",
  "audio/aac":  "aac",
  "audio/mp4":  "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg":  "ogg",
  "audio/amr":  "amr",
  "application/pdf": "pdf",
};

export function extensionForMime(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  if (MIME_EXT[base]) return MIME_EXT[base];
  // Fallback: take the subtype if it looks like a sane extension.
  const sub = base.split("/")[1] ?? "";
  return /^[a-z0-9]{1,5}$/.test(sub) ? sub : "bin";
}

// Deterministic object path so retries of the same wamid overwrite rather
// than duplicate. Scoped by workspace + conversation for tidy organisation.
export function buildMediaPath(
  workspaceId: string,
  conversationId: string,
  wamid: string,
  mime: string,
): string {
  const safeWamid = wamid.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${workspaceId}/${conversationId}/${safeWamid}.${extensionForMime(mime)}`;
}

/**
 * Upload media bytes to the `whatsapp-media` bucket and return the public URL.
 * Uses upsert so a duplicate webhook delivery is idempotent at the storage layer.
 */
export async function uploadInboundMedia(opts: {
  path: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(WHATSAPP_MEDIA_BUCKET)
    .upload(opts.path, opts.buffer, {
      contentType: opts.contentType,
      upsert:      true,
    });

  if (error) {
    logger.error("WhatsApp: media upload to storage failed", { path: opts.path, error });
    throw error;
  }

  const { data } = supabaseAdmin.storage.from(WHATSAPP_MEDIA_BUCKET).getPublicUrl(opts.path);
  return data.publicUrl;
}
