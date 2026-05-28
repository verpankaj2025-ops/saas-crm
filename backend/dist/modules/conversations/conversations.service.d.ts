import type { WorkspaceContext, ListResult } from "../../types/common";
import type { ConversationWithContact, CreateConversationDto, UpdateConversationDto, ConversationFilter } from "./conversations.types";
export declare const conversationsService: {
    list(ctx: WorkspaceContext, filter: ConversationFilter): Promise<ListResult<ConversationWithContact>>;
    get(ctx: WorkspaceContext, id: string): Promise<ConversationWithContact>;
    create(ctx: WorkspaceContext, dto: CreateConversationDto): Promise<ConversationWithContact>;
    update(ctx: WorkspaceContext, id: string, dto: UpdateConversationDto): Promise<ConversationWithContact>;
    markRead(ctx: WorkspaceContext, id: string): Promise<ConversationWithContact>;
    delete(ctx: WorkspaceContext, id: string): Promise<void>;
};
//# sourceMappingURL=conversations.service.d.ts.map