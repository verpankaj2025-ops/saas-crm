"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryService = void 0;
const memory_repository_1 = require("./memory.repository");
const contacts_repository_1 = require("../contacts/contacts.repository");
const conversations_repository_1 = require("../conversations/conversations.repository");
const messages_repository_1 = require("../messages/messages.repository");
const logger_1 = require("../../lib/logger");
exports.memoryService = {
    // ── Contact Preferences ────────────────────────────────────────
    async getPreferences(ctx, contactId) {
        return memory_repository_1.memoryRepository.getPreferences(ctx, contactId);
    },
    async updatePreferences(ctx, contactId, dto) {
        return memory_repository_1.memoryRepository.updatePreferences(ctx, contactId, dto);
    },
    // ── Lead Scoring ────────────────────────────────────────────────
    async getLeadScore(ctx, contactId) {
        return memory_repository_1.memoryRepository.getLeadScore(ctx, contactId);
    },
    async refreshLeadScore(ctx, contactId) {
        logger_1.logger.info("Refreshing lead score", { contactId, workspaceId: ctx.workspaceId });
        return memory_repository_1.memoryRepository.refreshLeadScore(ctx, contactId);
    },
    // ── Conversation Summary Generation ─────────────────────────────
    async generateConversationSummary(ctx, conversationId) {
        const conversation = await conversations_repository_1.conversationsRepository.findById(ctx, conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }
        const messages = await messages_repository_1.messagesRepository.findByConversation(ctx, {
            conversation_id: conversationId,
            limit: 100,
        });
        // Simple summary generation (no AI)
        const messageCount = messages.length;
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        // Extract key topics from message content (simple keyword extraction)
        const allText = messages.map((m) => m.content || "").join(" ").toLowerCase();
        const keywords = ["price", "cost", "appointment", "meeting", "schedule", "support", "help", "issue", "problem", "payment", "invoice", "quote", "demo", "trial"];
        const keyTopics = keywords.filter((kw) => allText.includes(kw));
        // Simple sentiment detection
        const positiveWords = ["good", "great", "excellent", "happy", "thanks", "thank you", "love", "perfect"];
        const negativeWords = ["bad", "terrible", "hate", "angry", "frustrated", "disappointed", "worst", "issue", "problem"];
        const positiveCount = positiveWords.filter((w) => allText.includes(w)).length;
        const negativeCount = negativeWords.filter((w) => allText.includes(w)).length;
        const sentiment = positiveCount > negativeCount ? "positive" : negativeCount > positiveCount ? "negative" : "neutral";
        const summary = {
            conversation_id: conversationId,
            message_count: messageCount,
            first_message_at: firstMessage?.created_at || "",
            last_message_at: lastMessage?.created_at || "",
            summary: `Conversation with ${messageCount} messages. ${keyTopics.length > 0 ? `Topics: ${keyTopics.join(", ")}.` : ""} Sentiment: ${sentiment}.`,
            key_topics: keyTopics,
            sentiment,
        };
        await memory_repository_1.memoryRepository.saveConversationSummary(ctx, summary);
        logger_1.logger.info("Conversation summary generated", { conversationId, messageCount });
        return summary;
    },
    // ── Interaction Summary Generation ───────────────────────────────
    async generateInteractionSummary(ctx, contactId) {
        const contact = await contacts_repository_1.contactsRepository.findById(ctx, contactId);
        if (!contact) {
            throw new Error("Contact not found");
        }
        // Get all conversations for this contact
        const conversationsResult = await conversations_repository_1.conversationsRepository.findAll(ctx, {
            contact_id: contactId,
            limit: 100,
        });
        const conversations = conversationsResult.data;
        const totalConversations = conversations.length;
        // Get total messages
        let totalMessages = 0;
        let lastContactedAt = contact.last_contacted_at || "";
        const channelCounts = {};
        for (const conv of conversations) {
            const messages = await messages_repository_1.messagesRepository.findByConversation(ctx, {
                conversation_id: conv.id,
                limit: 1000,
            });
            totalMessages += messages.length;
            // Track channel usage
            if (conv.channel_id) {
                channelCounts[conv.channel_id] = (channelCounts[conv.channel_id] || 0) + messages.length;
            }
        }
        const preferredChannels = Object.entries(channelCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id]) => id);
        const summary = {
            contact_id: contactId,
            total_conversations: totalConversations,
            total_messages: totalMessages,
            last_contacted_at: lastContactedAt,
            preferred_channels: preferredChannels,
        };
        await memory_repository_1.memoryRepository.saveInteractionSummary(ctx, summary);
        logger_1.logger.info("Interaction summary generated", { contactId, totalConversations, totalMessages });
        return summary;
    },
    // ── Customer Insights (aggregate) ─────────────────────────────────
    async getCustomerInsights(ctx, contactId) {
        const [leadScore, preferences, interactionSummary, importantNotes] = await Promise.all([
            memory_repository_1.memoryRepository.getLeadScore(ctx, contactId),
            memory_repository_1.memoryRepository.getPreferences(ctx, contactId),
            memory_repository_1.memoryRepository.getInteractionSummary(ctx, contactId),
            memory_repository_1.memoryRepository.getImportantNotes(ctx, contactId),
        ]);
        return {
            contact_id: contactId,
            lead_score: leadScore || { score: "cold", updated_at: "", reason: "No data" },
            preferences,
            interaction_summary: interactionSummary || {
                contact_id: contactId,
                total_conversations: 0,
                total_messages: 0,
                last_contacted_at: "",
                preferred_channels: [],
            },
            important_notes: importantNotes,
        };
    },
    // ── Context Builder for AI Suggestions ─────────────────────────
    async buildAiContext(ctx, conversationId) {
        const conversation = await conversations_repository_1.conversationsRepository.findById(ctx, conversationId);
        if (!conversation)
            return "";
        const [leadScore, preferences, conversationSummary] = await Promise.all([
            memory_repository_1.memoryRepository.getLeadScore(ctx, conversation.contact_id),
            memory_repository_1.memoryRepository.getPreferences(ctx, conversation.contact_id),
            memory_repository_1.memoryRepository.getConversationSummary(ctx, conversationId),
        ]);
        const contextParts = [];
        if (leadScore) {
            contextParts.push(`Lead score: ${leadScore.score} (${leadScore.reason})`);
        }
        if (preferences.communication) {
            contextParts.push(`Preferred communication: ${preferences.communication}`);
        }
        if (preferences.timezone) {
            contextParts.push(`Timezone: ${preferences.timezone}`);
        }
        if (conversationSummary) {
            contextParts.push(`Conversation summary: ${conversationSummary.summary}`);
        }
        return contextParts.join("\n");
    },
    // ── Auto-update on conversation events ───────────────────────────
    async onConversationUpdated(ctx, conversationId) {
        try {
            // Refresh lead score for the contact
            const conversation = await conversations_repository_1.conversationsRepository.findById(ctx, conversationId);
            if (conversation) {
                await exports.memoryService.refreshLeadScore(ctx, conversation.contact_id);
            }
            // Regenerate conversation summary
            await exports.memoryService.generateConversationSummary(ctx, conversationId);
            // Regenerate interaction summary
            if (conversation) {
                await exports.memoryService.generateInteractionSummary(ctx, conversation.contact_id);
            }
        }
        catch (err) {
            logger_1.logger.error("Failed to update memory on conversation change", { conversationId, err });
        }
    },
};
//# sourceMappingURL=memory.service.js.map