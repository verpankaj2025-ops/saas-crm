import { aiRepository } from "./ai.repository";
import { aiQueue } from "../../queues";
import { templatesRepository } from "../templates/templates.repository";
import { messagesRepository } from "../messages/messages.repository";
import { conversationsRepository } from "../conversations/conversations.repository";
import { logger } from "../../lib/logger";
import type { WorkspaceContext } from "../../types/common";
import type { AiMemory, CreateMemoryDto, SummarizeContactResult, ReplySuggestion, SuggestionRequest, SuggestionResult } from "./ai.types";
import type { Template } from "../templates/templates.types";

// ── Tone mapping ────────────────────────────────────────────────

const TONE_PROMPTS: Record<string, string> = {
  professional: "Write in a professional, business-appropriate tone. Be concise and courteous.",
  friendly: "Write in a warm, friendly tone. Be approachable but still professional.",
  premium: "Write in an elevated, premium tone. Be sophisticated and attentive to detail.",
};

// ── Rule engine: simple keyword-based template matching ────────

function detectTemplateIntent(lastMessage: string): { category?: Template["category"]; keywords: string[] } {
  const lower = lastMessage.toLowerCase();
  
  const rules: Array<{ category: Template["category"]; keywords: string[] }> = [
    { category: "greeting", keywords: ["hello", "hi", "hey", "good morning", "good afternoon"] },
    { category: "appointment", keywords: ["schedule", "book", "appointment", "meeting", "calendar"] },
    { category: "payment", keywords: ["pay", "invoice", "payment", "billing", "cost", "price"] },
    { category: "followup", keywords: ["follow up", "check in", "update", "status"] },
  ];
  
  for (const rule of rules) {
    const matched = rule.keywords.filter((kw) => lower.includes(kw));
    if (matched.length > 0) {
      return { category: rule.category, keywords: matched };
    }
  }
  
  return { keywords: [] };
}

// ── Complex query detection ──────────────────────────────────────

function isComplexQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Simple queries that don't need AI
  const simplePatterns = [
    /^(hello|hi|hey|thanks|thank you|ok|sure|yes|no)\b/i,
    /^(when|where|what time|how much)\b/i,
    /^(can you|could you|please)\s+(send|tell|give|help)\b/i,
  ];
  
  for (const pattern of simplePatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }
  
  // Complex indicators
  const complexIndicators = [
    /\b(explain|describe|detail|elaborate|analyze)\b/i,
    /\b(because|since|although|however|therefore)\b/i,
    /\b(problem|issue|trouble|difficult|confused)\b/i,
    /\.{3,}/, // Long sentences
  ];
  
  return complexIndicators.some((pattern) => pattern.test(message));
}

// ── Prompt builder ─────────────────────────────────────────────

function buildSuggestionPrompt(
  conversationSummary: string,
  lastMessage: string,
  tone: SuggestionRequest["tone"],
  contactName?: string
): string {
  const toneInstruction = TONE_PROMPTS[tone || "professional"] || TONE_PROMPTS.professional;
  
  return `You are a helpful customer service assistant. ${toneInstruction}

Context:
- Contact name: ${contactName || "Customer"}
- Conversation summary: ${conversationSummary}
- Last message from customer: "${lastMessage}"

Task: Write a concise, helpful reply (1-3 sentences max). Do not include greetings or sign-offs. Focus on addressing their specific question or concern.`;
}

export const aiService = {
  async getMemories(
    ctx: WorkspaceContext,
    entityType: string,
    entityId: string,
    limit?: number
  ): Promise<AiMemory[]> {
    return aiRepository.findMemories(ctx, entityType, entityId, limit);
  },

  async addMemory(ctx: WorkspaceContext, dto: CreateMemoryDto): Promise<AiMemory> {
    return aiRepository.create(ctx, dto, "agent");
  },

  async deleteMemory(ctx: WorkspaceContext, id: string): Promise<void> {
    await aiRepository.delete(ctx, id);
  },

  async requestContactSummary(ctx: WorkspaceContext, contactId: string): Promise<{ queued: true }> {
    await aiQueue.add("ai", {
      entityType: "contact",
      entityId: contactId,
      workspaceId: ctx.workspaceId,
      task: "summarize",
    });
    return { queued: true };
  },

  async requestReplySuggestion(ctx: WorkspaceContext, conversationId: string): Promise<{ queued: true }> {
    await aiQueue.add("ai", {
      entityType: "conversation",
      entityId: conversationId,
      workspaceId: ctx.workspaceId,
      task: "reply_suggestion",
    });
    return { queued: true };
  },

  // ── Suggestion service (template-first, AI fallback) ───────────

  async getSuggestion(ctx: WorkspaceContext, req: SuggestionRequest): Promise<SuggestionResult> {
    const { conversation_id, tone = "professional", force_ai = false } = req;
    
    // Get conversation and last message
    const conversation = await conversationsRepository.findById(ctx, conversation_id);
    if (!conversation) {
      return { suggestion: null, requires_ai: false };
    }
    
    const messages = await messagesRepository.findByConversation(ctx, { conversation_id: conversation_id, limit: 10 });
    if (messages.length === 0) {
      return { suggestion: null, requires_ai: false };
    }
    
    const lastMessage = messages[messages.length - 1];
    const lastCustomerMessage = [...messages].reverse().find((m) => m.sender_type === "contact");
    
    if (!lastCustomerMessage) {
      return { suggestion: null, requires_ai: false };
    }
    
    // Step 1: Rule check - try template matching first
    if (!force_ai) {
      const intent = detectTemplateIntent(lastCustomerMessage.content || "");
      
      if (intent.category) {
        const templates = await templatesRepository.findAll(ctx, {
          category: intent.category,
          limit: 3,
        });
        
        if (templates.data.length > 0) {
          const template = templates.data[0];
          return {
            suggestion: {
              body: template.body,
              confidence: 0.8,
              tone: tone === "premium" ? "formal" : tone === "friendly" ? "friendly" : "formal",
              source: "template",
              template_id: template.id,
            },
            templates: templates.data,
            requires_ai: false,
          };
        }
      }
    }
    
    // Step 2: Complex query detection
    const isComplex = isComplexQuery(lastCustomerMessage.content || "");
    
    if (!isComplex && !force_ai) {
      // Simple query - return null, let human handle it
      return { suggestion: null, requires_ai: false };
    }
    
    // Step 3: AI suggestion for complex queries
    // For now, return queued response (actual AI processing happens via worker)
    await aiQueue.add("ai", {
      entityType: "conversation",
      entityId: conversation_id,
      workspaceId: ctx.workspaceId,
      task: "reply_suggestion",
    });
    
    return {
      suggestion: null,
      requires_ai: true,
    };
  },

  // ── Direct AI suggestion (synchronous, for immediate response) ──

  async generateSuggestionDirect(
    ctx: WorkspaceContext,
    conversationId: string,
    tone: SuggestionRequest["tone"] = "professional"
  ): Promise<ReplySuggestion | null> {
    const conversation = await conversationsRepository.findById(ctx, conversationId);
    if (!conversation) return null;
    
    const messages = await messagesRepository.findByConversation(ctx, { conversation_id: conversationId, limit: 10 });
    const lastCustomerMessage = [...messages].reverse().find((m) => m.sender_type === "contact");
    
    if (!lastCustomerMessage) return null;
    
    // Build conversation summary
    const conversationSummary = messages
      .slice(-5)
      .map((m) => `${m.sender_type === "contact" ? "Customer" : "Agent"}: ${m.content}`)
      .join("\n");
    
    const prompt = buildSuggestionPrompt(
      conversationSummary,
      lastCustomerMessage.content || "",
      tone,
      conversation.contact?.first_name
    );
    
    // TODO: Call OpenAI API here
    // For now, return a placeholder
    logger.info("AI suggestion requested", { conversationId, tone });
    
    return {
      body: "[AI suggestion would be generated here]",
      confidence: 0.7,
      tone: tone === "premium" ? "formal" : tone === "friendly" ? "friendly" : "formal",
      source: "ai",
    };
  },
};
