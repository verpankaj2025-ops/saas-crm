"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const ai_repository_1 = require("./ai.repository");
const queues_1 = require("../../queues");
const templates_repository_1 = require("../templates/templates.repository");
const messages_repository_1 = require("../messages/messages.repository");
const conversations_repository_1 = require("../conversations/conversations.repository");
const logger_1 = require("../../lib/logger");
// ── Tone mapping ────────────────────────────────────────────────
const TONE_PROMPTS = {
    professional: "Write in a professional, business-appropriate tone. Be concise and courteous.",
    friendly: "Write in a warm, friendly tone. Be approachable but still professional.",
    premium: "Write in an elevated, premium tone. Be sophisticated and attentive to detail.",
};
// ── Rule engine: simple keyword-based template matching ────────
function detectTemplateIntent(lastMessage) {
    const lower = lastMessage.toLowerCase();
    const rules = [
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
function isComplexQuery(message) {
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
function buildSuggestionPrompt(conversationSummary, lastMessage, tone, contactName) {
    const toneInstruction = TONE_PROMPTS[tone || "professional"] || TONE_PROMPTS.professional;
    return `You are a helpful customer service assistant. ${toneInstruction}

Context:
- Contact name: ${contactName || "Customer"}
- Conversation summary: ${conversationSummary}
- Last message from customer: "${lastMessage}"

Task: Write a concise, helpful reply (1-3 sentences max). Do not include greetings or sign-offs. Focus on addressing their specific question or concern.`;
}
exports.aiService = {
    async getMemories(ctx, entityType, entityId, limit) {
        return ai_repository_1.aiRepository.findMemories(ctx, entityType, entityId, limit);
    },
    async addMemory(ctx, dto) {
        return ai_repository_1.aiRepository.create(ctx, dto, "agent");
    },
    async deleteMemory(ctx, id) {
        await ai_repository_1.aiRepository.delete(ctx, id);
    },
    async requestContactSummary(ctx, contactId) {
        await queues_1.aiQueue.add("ai", {
            entityType: "contact",
            entityId: contactId,
            workspaceId: ctx.workspaceId,
            task: "summarize",
        });
        return { queued: true };
    },
    async requestReplySuggestion(ctx, conversationId) {
        await queues_1.aiQueue.add("ai", {
            entityType: "conversation",
            entityId: conversationId,
            workspaceId: ctx.workspaceId,
            task: "reply_suggestion",
        });
        return { queued: true };
    },
    // ── Suggestion service (template-first, AI fallback) ───────────
    async getSuggestion(ctx, req) {
        const { conversation_id, tone = "professional", force_ai = false } = req;
        // Get conversation and last message
        const conversation = await conversations_repository_1.conversationsRepository.findById(ctx, conversation_id);
        if (!conversation) {
            return { suggestion: null, requires_ai: false };
        }
        const messages = await messages_repository_1.messagesRepository.findByConversation(ctx, { conversation_id: conversation_id, limit: 10 });
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
                const templates = await templates_repository_1.templatesRepository.findAll(ctx, {
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
        await queues_1.aiQueue.add("ai", {
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
    async generateSuggestionDirect(ctx, conversationId, tone = "professional") {
        const conversation = await conversations_repository_1.conversationsRepository.findById(ctx, conversationId);
        if (!conversation)
            return null;
        const messages = await messages_repository_1.messagesRepository.findByConversation(ctx, { conversation_id: conversationId, limit: 10 });
        const lastCustomerMessage = [...messages].reverse().find((m) => m.sender_type === "contact");
        if (!lastCustomerMessage)
            return null;
        // Build conversation summary
        const conversationSummary = messages
            .slice(-5)
            .map((m) => `${m.sender_type === "contact" ? "Customer" : "Agent"}: ${m.content}`)
            .join("\n");
        const prompt = buildSuggestionPrompt(conversationSummary, lastCustomerMessage.content || "", tone, conversation.contact?.first_name);
        // TODO: Call OpenAI API here
        // For now, return a placeholder
        logger_1.logger.info("AI suggestion requested", { conversationId, tone });
        return {
            body: "[AI suggestion would be generated here]",
            confidence: 0.7,
            tone: tone === "premium" ? "formal" : tone === "friendly" ? "friendly" : "formal",
            source: "ai",
        };
    },
};
//# sourceMappingURL=ai.service.js.map