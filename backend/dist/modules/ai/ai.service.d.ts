import type { WorkspaceContext } from "../../types/common";
import type { AiMemory, CreateMemoryDto, ReplySuggestion, SuggestionRequest, SuggestionResult } from "./ai.types";
export declare const aiService: {
    getMemories(ctx: WorkspaceContext, entityType: string, entityId: string, limit?: number): Promise<AiMemory[]>;
    addMemory(ctx: WorkspaceContext, dto: CreateMemoryDto): Promise<AiMemory>;
    deleteMemory(ctx: WorkspaceContext, id: string): Promise<void>;
    requestContactSummary(ctx: WorkspaceContext, contactId: string): Promise<{
        queued: true;
    }>;
    requestReplySuggestion(ctx: WorkspaceContext, conversationId: string): Promise<{
        queued: true;
    }>;
    getSuggestion(ctx: WorkspaceContext, req: SuggestionRequest): Promise<SuggestionResult>;
    generateSuggestionDirect(ctx: WorkspaceContext, conversationId: string, tone?: SuggestionRequest["tone"]): Promise<ReplySuggestion | null>;
};
//# sourceMappingURL=ai.service.d.ts.map