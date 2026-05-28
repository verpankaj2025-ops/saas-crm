import type { UUID } from "../../types/common";
export interface Message {
    id: UUID;
    workspace_id: UUID;
    conversation_id: UUID;
    sender_type: "contact" | "agent" | "bot";
    sender_id: UUID | null;
    content: string | null;
    content_type: "text" | "image" | "document" | "audio" | "video" | "template" | "interactive";
    status: "queued" | "sent" | "delivered" | "read" | "failed";
    attachment_url: string | null;
    attachment_metadata: Record<string, unknown> | null;
    is_internal: boolean;
    external_id: string | null;
    created_at: string;
    updated_at: string;
}
export interface SendMessageDto {
    conversation_id: UUID;
    content_type?: Message["content_type"];
    content?: string;
    is_internal?: boolean;
}
export interface MessageFilter {
    conversation_id: UUID;
    limit?: number;
    before_id?: UUID;
}
//# sourceMappingURL=messages.types.d.ts.map