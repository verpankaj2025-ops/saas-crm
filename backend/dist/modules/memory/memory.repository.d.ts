import type { WorkspaceContext } from "../../types/common";
import type { ContactPreferences, LeadScoreData, ConversationSummary, InteractionSummary, ImportantNote, UpdatePreferencesDto } from "./memory.types";
export declare const memoryRepository: {
    getPreferences(ctx: WorkspaceContext, contactId: string): Promise<ContactPreferences>;
    updatePreferences(ctx: WorkspaceContext, contactId: string, dto: UpdatePreferencesDto): Promise<ContactPreferences>;
    getLeadScore(ctx: WorkspaceContext, contactId: string): Promise<LeadScoreData | null>;
    refreshLeadScore(ctx: WorkspaceContext, contactId: string): Promise<LeadScoreData>;
    getConversationSummary(ctx: WorkspaceContext, conversationId: string): Promise<ConversationSummary | null>;
    saveConversationSummary(ctx: WorkspaceContext, summary: ConversationSummary): Promise<void>;
    getInteractionSummary(ctx: WorkspaceContext, contactId: string): Promise<InteractionSummary | null>;
    saveInteractionSummary(ctx: WorkspaceContext, summary: InteractionSummary): Promise<void>;
    getImportantNotes(ctx: WorkspaceContext, contactId: string): Promise<ImportantNote[]>;
};
//# sourceMappingURL=memory.repository.d.ts.map