import type { WorkspaceContext, ListResult } from "../../types/common";
import type { Followup, CreateFollowupDto, UpdateFollowupDto, FollowupFilter, SnoozeFollowupDto } from "./followups.types";
import type { FollowupJobData } from "../../queues";
export declare const followupsService: {
    list(ctx: WorkspaceContext, filter: FollowupFilter): Promise<ListResult<Followup>>;
    get(ctx: WorkspaceContext, id: string): Promise<Followup>;
    create(ctx: WorkspaceContext, dto: CreateFollowupDto): Promise<Followup>;
    update(ctx: WorkspaceContext, id: string, dto: UpdateFollowupDto): Promise<Followup>;
    complete(ctx: WorkspaceContext, id: string): Promise<Followup>;
    snooze(ctx: WorkspaceContext, id: string, dto: SnoozeFollowupDto): Promise<Followup>;
    cancel(ctx: WorkspaceContext, id: string): Promise<Followup>;
    delete(ctx: WorkspaceContext, id: string): Promise<void>;
    processJob(data: FollowupJobData): Promise<void>;
    cancelByConversation(workspaceId: string, conversationId: string): Promise<void>;
};
//# sourceMappingURL=followups.service.d.ts.map