import type { UUID, PaginationQuery } from "../../types/common";
export interface Conversation {
    id: UUID;
    workspace_id: UUID;
    contact_id: UUID;
    channel_id: UUID | null;
    status: "open" | "pending" | "resolved" | "archived";
    subject: string | null;
    assigned_to: UUID | null;
    last_message_at: string | null;
    last_message_preview: string | null;
    unread_count: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface ConversationContact {
    id: UUID;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
}
export interface ConversationWithContact extends Conversation {
    contact: ConversationContact | null;
}
export interface CreateConversationDto {
    contact_id: UUID;
    channel_id?: UUID;
    subject?: string;
    assigned_to?: UUID;
}
export interface UpdateConversationDto {
    status?: Conversation["status"];
    assigned_to?: UUID | null;
    subject?: string;
}
export interface ConversationFilter extends PaginationQuery {
    status?: Conversation["status"];
    assigned_to?: UUID;
    contact_id?: UUID;
    channel_id?: UUID;
}
//# sourceMappingURL=conversations.types.d.ts.map