"use strict";
/**
 * WhatsApp Cloud API HTTP client.
 * Uses Node.js native fetch (Node 18+). No extra dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppApiError = void 0;
exports.sendWhatsAppText = sendWhatsAppText;
const GRAPH_BASE = "https://graph.facebook.com/v20.0";
/**
 * Send a plain-text WhatsApp message via the Cloud API.
 * Throws on HTTP errors or missing wamid in response.
 */
async function sendWhatsAppText(phoneNumberId, accessToken, to, // E.164 with leading +
body) {
    const url = `${GRAPH_BASE}/${phoneNumberId}/messages`;
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body, preview_url: false },
    };
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12_000),
    });
    const json = (await res.json());
    if (!res.ok) {
        const msg = json.error?.message ?? `HTTP ${res.status}`;
        const code = json.error?.code ?? res.status;
        throw new WhatsAppApiError(msg, code, res.status);
    }
    const wamid = json.messages?.[0]?.id;
    if (!wamid)
        throw new WhatsAppApiError("No wamid in response", 0, res.status);
    return {
        wamid,
        to: json.contacts?.[0]?.wa_id ?? to,
    };
}
class WhatsAppApiError extends Error {
    apiCode;
    httpStatus;
    constructor(message, apiCode, httpStatus) {
        super(`WhatsApp API [${apiCode}]: ${message}`);
        this.apiCode = apiCode;
        this.httpStatus = httpStatus;
        this.name = "WhatsAppApiError";
    }
    /** True for permanent errors that should NOT be retried */
    get isPermanent() {
        // 131030 = recipient phone not on WhatsApp
        // 131051 = unsupported message type
        // 100    = parameter error (bad phone)
        return [131030, 131051, 100].includes(this.apiCode);
    }
}
exports.WhatsAppApiError = WhatsAppApiError;
//# sourceMappingURL=whatsapp.client.js.map