import type { UUID, WorkspaceContext } from "../../types/common";
import type { Message, SendMessageDto, MessageFilter } from "./messages.types";
export declare const messagesRepository: {
    findByConversation(ctx: WorkspaceContext, filter: MessageFilter): Promise<Message[]>;
    findById(ctx: WorkspaceContext, id: UUID): Promise<Message | null>;
    create(ctx: WorkspaceContext, dto: SendMessageDto & {
        sender_id: UUID;
        sender_type: "contact" | "agent" | "bot";
    }): Promise<Message>;
    updateStatus(workspaceId: UUID, id: UUID, patch: {
        status: Message["status"];
        external_id?: string;
    }): Promise<void>;
    updateStatusByExternalId(workspaceId: UUID, externalId: string, status: Message["status"]): Promise<Message | null>;
    findByExternalId(workspaceId: UUID, externalId: string): Promise<{
        id: UUID;
    } | null>;
    createInbound(workspaceId: UUID, dto: {
        conversation_id: UUID;
        content: string | null;
        content_type: Message["content_type"];
        external_id: string;
    }): Promise<Message>;
};
//# sourceMappingURL=messages.repository.d.ts.map