import type { UUID } from "../../types/common";
import type { Template } from "../templates/templates.types";
export type AiMemoryType = "fact" | "preference" | "summary" | "intent" | "context";
export interface AiMemory {
    id: UUID;
    workspace_id: UUID;
    entity_type: "contact" | "conversation" | "workspace";
    entity_id: UUID;
    memory_type: AiMemoryType;
    content: string;
    source: "ai" | "agent" | "system";
    attributes: Record<string, unknown>;
    relevance_score: number;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface CreateMemoryDto {
    entity_type: AiMemory["entity_type"];
    entity_id: UUID;
    memory_type: AiMemoryType;
    content: string;
    attributes?: Record<string, unknown>;
    expires_at?: string;
}
export interface SummarizeContactResult {
    summary: string;
    sentiment: "positive" | "neutral" | "negative";
    topics: string[];
    next_action_suggestion: string | null;
}
export interface ReplySuggestion {
    body: string;
    confidence: number;
    tone: "formal" | "friendly" | "empathetic";
    source: "template" | "ai";
    template_id?: string;
}
export interface SuggestionRequest {
    conversation_id: string;
    tone?: "professional" | "friendly" | "premium";
    force_ai?: boolean;
}
export interface SuggestionResult {
    suggestion: ReplySuggestion | null;
    templates?: Template[];
    requires_ai: boolean;
}
//# sourceMappingURL=ai.types.d.ts.map