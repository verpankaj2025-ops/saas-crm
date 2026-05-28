/**
 * WhatsApp Cloud API webhook payload types.
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */
export interface WhatsAppWebhookBody {
    object: "whatsapp_business_account";
    entry: WhatsAppEntry[];
}
export interface WhatsAppEntry {
    id: string;
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
    profile: {
        name: string;
    };
    wa_id: string;
}
export interface WhatsAppMessage {
    from: string;
    id: string;
    timestamp: string;
    type: "text" | "image" | "audio" | "video" | "document" | "location" | "contacts" | "sticker" | "interactive" | "button" | "order" | "system" | "unknown";
    text?: {
        body: string;
    };
    image?: {
        id: string;
        mime_type: string;
        caption?: string;
    };
    audio?: {
        id: string;
        mime_type: string;
    };
    video?: {
        id: string;
        mime_type: string;
        caption?: string;
    };
    document?: {
        id: string;
        mime_type: string;
        filename?: string;
        caption?: string;
    };
}
export interface WhatsAppStatus {
    id: string;
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
export interface WhatsAppChannelConfig {
    phone_number_id: string;
    display_phone_number: string;
    access_token?: string;
    waba_id?: string;
}
//# sourceMappingURL=whatsapp.types.d.ts.map