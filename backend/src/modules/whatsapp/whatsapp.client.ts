/**
 * WhatsApp Cloud API HTTP client.
 * Uses Node.js native fetch (Node 18+). No extra dependencies.
 */

const GRAPH_BASE = "https://graph.facebook.com/v20.0";

export interface SendTextResult {
  wamid: string;  // returned message ID — store as external_id
  to: string;     // normalised wa_id
}

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
