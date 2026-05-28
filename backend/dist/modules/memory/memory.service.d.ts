import type { WorkspaceContext } from "../../types/common";
import type { ContactPreferences, LeadScoreData, ConversationSummary, InteractionSummary, CustomerInsights, UpdatePreferencesDto } from "./memory.types";
export declare const memoryService: {
    getPreferences(ctx: WorkspaceContext, contactId: string): Promise<ContactPreferences>;
    updatePreferences(ctx: WorkspaceContext, contactId: string, dto: UpdatePreferencesDto): Promise<ContactPreferences>;
    getLeadScore(ctx: WorkspaceContext, contactId: string): Promise<LeadScoreData | null>;
    refreshLeadScore(ctx: WorkspaceContext, contactId: string): Promise<LeadScoreData>;
    generateConversationSummary(ctx: WorkspaceContext, conversationId: string): Promise<ConversationSummary>;
    generateInteractionSummary(ctx: WorkspaceContext, contactId: string): Promise<InteractionSummary>;
    getCustomerInsights(ctx: WorkspaceContext, contactId: string): Promise<CustomerInsights>;
    buildAiContext(ctx: WorkspaceContext, conversationId: string): Promise<string>;
    onConversationUpdated(ctx: WorkspaceContext, conversationId: string): Promise<void>;
};
//# sourceMappingURL=memory.service.d.ts.map