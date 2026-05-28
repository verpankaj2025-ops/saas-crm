import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { Followup, CreateFollowupDto, UpdateFollowupDto, FollowupFilter } from "./followups.types";
export declare const followupsRepository: {
    findAll(ctx: WorkspaceContext, filter: FollowupFilter): Promise<ListResult<Followup>>;
    findById(ctx: WorkspaceContext, id: UUID): Promise<Followup | null>;
    create(ctx: WorkspaceContext, dto: CreateFollowupDto): Promise<Followup>;
    update(ctx: WorkspaceContext, id: UUID, dto: UpdateFollowupDto): Promise<Followup>;
    softDelete(ctx: WorkspaceContext, id: UUID): Promise<void>;
    /** Find a followup by ID without workspace context (worker use) */
    findByIdRaw(id: UUID): Promise<Followup | null>;
    /** Find all pending/snoozed followups linked to a conversation */
    findByConversationPending(workspaceId: UUID, conversationId: UUID): Promise<Followup[]>;
    /** Bulk-cancel followups for a conversation (auto-cancel on inbound reply) */
    cancelByConversation(workspaceId: UUID, conversationId: UUID): Promise<Followup[]>;
    /** Persist BullMQ job ID into metadata so we can remove it later */
    saveJobId(workspaceId: UUID, id: UUID, jobId: string): Promise<void>;
};
//# sourceMappingURL=followups.repository.d.ts.map