/**
 * WhatsApp Cloud API HTTP client.
 * Uses Node.js native fetch (Node 18+). No extra dependencies.
 */
export interface SendTextResult {
    wamid: string;
    to: string;
}
/**
 * Send a plain-text WhatsApp message via the Cloud API.
 * Throws on HTTP errors or missing wamid in response.
 */
export declare function sendWhatsAppText(phoneNumberId: string, accessToken: string, to: string, // E.164 with leading +
body: string): Promise<SendTextResult>;
export declare class WhatsAppApiError extends Error {
    readonly apiCode: number;
    readonly httpStatus: number;
    constructor(message: string, apiCode: number, httpStatus: number);
    /** True for permanent errors that should NOT be retried */
    get isPermanent(): boolean;
}
//# sourceMappingURL=whatsapp.client.d.ts.map