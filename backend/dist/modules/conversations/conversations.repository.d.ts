import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { ConversationWithContact, CreateConversationDto, UpdateConversationDto, ConversationFilter } from "./conversations.types";
export declare const conversationsRepository: {
    findAll(ctx: WorkspaceContext, filter: ConversationFilter): Promise<ListResult<ConversationWithContact>>;
    findById(ctx: WorkspaceContext, id: UUID): Promise<ConversationWithContact | null>;
    create(ctx: WorkspaceContext, dto: CreateConversationDto): Promise<ConversationWithContact>;
    update(ctx: WorkspaceContext, id: UUID, dto: UpdateConversationDto): Promise<ConversationWithContact>;
    markRead(ctx: WorkspaceContext, id: UUID): Promise<ConversationWithContact | null>;
    softDelete(ctx: WorkspaceContext, id: UUID): Promise<void>;
    findOpenByContactAndChannel(workspaceId: UUID, contactId: UUID, channelId: UUID): Promise<{
        id: UUID;
    } | null>;
    createInbound(workspaceId: UUID, dto: {
        contact_id: UUID;
        channel_id: UUID;
    }): Promise<{
        id: UUID;
    }>;
    incrementUnread(workspaceId: UUID, conversationId: UUID, preview: string, lastAt: string): Promise<void>;
};
//# sourceMappingURL=conversations.repository.d.ts.map