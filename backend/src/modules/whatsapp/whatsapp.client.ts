/**
 * WhatsApp Cloud API HTTP client.
 * Uses Node.js native fetch (Node 18+). No extra dependencies.
 */

import type { WhatsAppMediaInfo } from "./whatsapp.types";

const GRAPH_BASE = "https://graph.facebook.com/v20.0";

export interface SendTextResult {
  wamid: string;  // returned message ID — store as external_id
  to: string;     // normalised wa_id
}

// Outbound media kinds (sticker is sendable too, but the CRM only sends image/document/audio/video).
export type OutboundMediaType = "image" | "audio" | "video" | "document";

// Captions are only honoured by image/video/document — never audio.
const CAPTIONABLE: ReadonlySet<OutboundMediaType> = new Set(["image", "video", "document"]);

interface CloudApiTextPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: { body: string; preview_url: false };
}

interface CloudApiResponse {
  messaging_product: "whatsapp";
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface CloudApiError {
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

/**
 * Send a plain-text WhatsApp message via the Cloud API.
 * Throws on HTTP errors or missing wamid in response.
 */
export async function sendWhatsAppText(
  phoneNumberId: string,
  accessToken: string,
  to: string,       // E.164 with leading +
  body: string,
): Promise<SendTextResult> {
  const url = `${GRAPH_BASE}/${phoneNumberId}/messages`;

  const payload: CloudApiTextPayload = {
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to,
    type: "text",
    text: { body, preview_url: false },
  };

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body:   JSON.stringify(payload),
    signal: AbortSignal.timeout(12_000),
  });

  const json = (await res.json()) as CloudApiResponse & CloudApiError;

  if (!res.ok) {
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    const code = json.error?.code ?? res.status;
    throw new WhatsAppApiError(msg, code, res.status);
  }

  const wamid = json.messages?.[0]?.id;
  if (!wamid) throw new WhatsAppApiError("No wamid in response", 0, res.status);

  return {
    wamid,
    to: json.contacts?.[0]?.wa_id ?? to,
  };
}

export class WhatsAppApiError extends Error {
  constructor(
    message: string,
    public readonly apiCode: number,
    public readonly httpStatus: number,
  ) {
    super(`WhatsApp API [${apiCode}]: ${message}`);
    this.name = "WhatsAppApiError";
  }

  /** True for permanent errors that should NOT be retried */
  get isPermanent(): boolean {
    // 131030 = recipient phone not on WhatsApp
    // 131051 = unsupported message type
    // 100    = parameter error (bad phone)
    return [131030, 131051, 100].includes(this.apiCode);
  }
}

// ── Outbound payload builders (pure — unit tested) ────────────

interface CloudApiMediaObject { link: string; caption?: string; filename?: string }

export interface CloudApiMediaPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: OutboundMediaType;
  image?:    CloudApiMediaObject;
  audio?:    CloudApiMediaObject;
  video?:    CloudApiMediaObject;
  document?: CloudApiMediaObject;
}

export interface CloudApiTemplatePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: Array<{
      type: "body";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };
}

/** Build the Cloud API payload for a media message (sent by public link). */
export function buildMediaPayload(
  to: string,
  type: OutboundMediaType,
  link: string,
  caption?: string,
  filename?: string,
): CloudApiMediaPayload {
  const media: CloudApiMediaObject = { link };
  if (caption && CAPTIONABLE.has(type)) media.caption = caption;
  if (type === "document" && filename) media.filename = filename;

  return {
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to,
    type,
    [type]: media,
  };
}

/** Build the Cloud API payload for a pre-approved template message. */
export function buildTemplatePayload(
  to: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[],
): CloudApiTemplatePayload {
  return {
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to,
    type: "template",
    template: {
      name:     templateName,
      language: { code: languageCode },
      components: bodyParams.length
        ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text" as const, text })) }]
        : [],
    },
  };
}

// ── Shared sender for media/template (new code path; text path untouched) ──

async function postSendable(
  phoneNumberId: string,
  accessToken: string,
  payload: CloudApiMediaPayload | CloudApiTemplatePayload,
): Promise<SendTextResult> {
  const url = `${GRAPH_BASE}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body:   JSON.stringify(payload),
    signal: AbortSignal.timeout(12_000),
  });

  const json = (await res.json()) as CloudApiResponse & CloudApiError;

  if (!res.ok) {
    const msg  = json.error?.message ?? `HTTP ${res.status}`;
    const code = json.error?.code ?? res.status;
    throw new WhatsAppApiError(msg, code, res.status);
  }

  const wamid = json.messages?.[0]?.id;
  if (!wamid) throw new WhatsAppApiError("No wamid in response", 0, res.status);

  return { wamid, to: json.contacts?.[0]?.wa_id ?? payload.to };
}

/** Send a media message (image/audio/video/document) via a public link. */
export async function sendWhatsAppMedia(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  type: OutboundMediaType,
  link: string,
  caption?: string,
  filename?: string,
): Promise<SendTextResult> {
  return postSendable(phoneNumberId, accessToken, buildMediaPayload(to, type, link, caption, filename));
}

/** Send a pre-approved WhatsApp template message. */
export async function sendWhatsAppTemplate(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[],
): Promise<SendTextResult> {
  return postSendable(phoneNumberId, accessToken, buildTemplatePayload(to, templateName, languageCode, bodyParams));
}

// ── Inbound media download (2-step Graph flow) ────────────────

/**
 * Step 1: resolve a media `id` to its short-lived, auth-gated download URL.
 * The returned URL is only valid for a few minutes and must be fetched with
 * the same access token (see `downloadMedia`).
 */
export async function getMediaUrl(mediaId: string, accessToken: string): Promise<WhatsAppMediaInfo> {
  const res = await fetch(`${GRAPH_BASE}/${mediaId}`, {
    method:  "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    signal:  AbortSignal.timeout(12_000),
  });

  const json = (await res.json()) as WhatsAppMediaInfo & CloudApiError;
  if (!res.ok || !json.url) {
    const msg  = json.error?.message ?? `HTTP ${res.status}`;
    const code = json.error?.code ?? res.status;
    throw new WhatsAppApiError(`getMediaUrl: ${msg}`, code, res.status);
  }
  return json;
}

/**
 * Step 2: download the binary from the media URL using the Bearer token.
 * Returns the raw bytes plus the effective content type.
 */
export async function downloadMedia(
  mediaUrl: string,
  accessToken: string,
  fallbackMime = "application/octet-stream",
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(mediaUrl, {
    method:  "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    signal:  AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new WhatsAppApiError(`downloadMedia: HTTP ${res.status}`, res.status, res.status);
  }

  const contentType = res.headers.get("content-type") ?? fallbackMime;
  const buffer      = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}
