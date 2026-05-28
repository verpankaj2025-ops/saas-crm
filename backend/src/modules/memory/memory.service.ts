import { memoryRepository } from "./memory.repository";
import { contactsRepository } from "../contacts/contacts.repository";
import { conversationsRepository } from "../conversations/conversations.repository";
import { messagesRepository } from "../messages/messages.repository";
import { logger } from "../../lib/logger";
import type { WorkspaceContext } from "../../types/common";
import type { 
  ContactPreferences, 
  LeadScoreData, 
  ConversationSummary, 
  InteractionSummary,
  CustomerInsights,
  UpdatePreferencesDto 
} from "./memory.types";

export const memoryService = {
  // ── Contact Preferences ────────────────────────────────────────

  async getPreferences(ctx: WorkspaceContext, contactId: string): Promise<ContactPreferences> {
    return memoryRepository.getPreferences(ctx, contactId);
  },

  async updatePreferences(
    ctx: WorkspaceContext,
    contactId: string,
    dto: UpdatePreferencesDto
  ): Promise<ContactPreferences> {
    return memoryRepository.updatePreferences(ctx, contactId, dto);
  },

  // ── Lead Scoring ────────────────────────────────────────────────

  async getLeadScore(ctx: WorkspaceContext, contactId: string): Promise<LeadScoreData | null> {
    return memoryRepository.getLeadScore(ctx, contactId);
  },

  async refreshLeadScore(ctx: WorkspaceContext, contactId: string): Promise<LeadScoreData> {
    logger.info("Refreshing lead score", { contactId, workspaceId: ctx.workspaceId });
    return memoryRepository.refreshLeadScore(ctx, contactId);
  },

  // ── Conversation Summary Generation ─────────────────────────────

  async generateConversationSummary(
    ctx: WorkspaceContext,
    conversationId: string
  ): Promise<ConversationSummary> {
    const conversation = await conversationsRepository.findById(ctx, conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messages = await messagesRepository.findByConversation(ctx, {
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

    const summary: ConversationSummary = {
      conversation_id: conversationId,
      message_count: messageCount,
      first_message_at: firstMessage?.created_at || "",
      last_message_at: lastMessage?.created_at || "",
      summary: `Conversation with ${messageCount} messages. ${keyTopics.length > 0 ? `Topics: ${keyTopics.join(", ")}.` : ""} Sentiment: ${sentiment}.`,
      key_topics: keyTopics,
      sentiment,
    };

    await memoryRepository.saveConversationSummary(ctx, summary);
    logger.info("Conversation summary generated", { conversationId, messageCount });

    return summary;
  },

  // ── Interaction Summary Generation ───────────────────────────────

  async generateInteractionSummary(
    ctx: WorkspaceContext,
    contactId: string
  ): Promise<InteractionSummary> {
    const contact = await contactsRepository.findById(ctx, contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Get all conversations for this contact
    const conversationsResult = await conversationsRepository.findAll(ctx, {
      contact_id: contactId,
      limit: 100,
    });
    const conversations = conversationsResult.data;
    const totalConversations = conversations.length;

    // Get total messages
    let totalMessages = 0;
    let lastContactedAt = contact.last_contacted_at || "";
    const channelCounts: Record<string, number> = {};

    for (const conv of conversations) {
      const messages = await messagesRepository.findByConversation(ctx, {
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

    const summary: InteractionSummary = {
      contact_id: contactId,
      total_conversations: totalConversations,
      total_messages: totalMessages,
      last_contacted_at: lastContactedAt,
      preferred_channels: preferredChannels,
    };

    await memoryRepository.saveInteractionSummary(ctx, summary);
    logger.info("Interaction summary generated", { contactId, totalConversations, totalMessages });

    return summary;
  },

  // ── Customer Insights (aggregate) ─────────────────────────────────

  async getCustomerInsights(ctx: WorkspaceContext, contactId: string): Promise<CustomerInsights> {
    const [leadScore, preferences, interactionSummary, importantNotes] = await Promise.all([
      memoryRepository.getLeadScore(ctx, contactId),
      memoryRepository.getPreferences(ctx, contactId),
      memoryRepository.getInteractionSummary(ctx, contactId),
      memoryRepository.getImportantNotes(ctx, contactId),
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

  async buildAiContext(
    ctx: WorkspaceContext,
    conversationId: string
  ): Promise<string> {
    const conversation = await conversationsRepository.findById(ctx, conversationId);
    if (!conversation) return "";

    const [leadScore, preferences, conversationSummary] = await Promise.all([
      memoryRepository.getLeadScore(ctx, conversation.contact_id),
      memoryRepository.getPreferences(ctx, conversation.contact_id),
      memoryRepository.getConversationSummary(ctx, conversationId),
    ]);

    const contextParts: string[] = [];

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

  async onConversationUpdated(ctx: WorkspaceContext, conversationId: string): Promise<void> {
    try {
      // Refresh lead score for the contact
      const conversation = await conversationsRepository.findById(ctx, conversationId);
      if (conversation) {
        await memoryService.refreshLeadScore(ctx, conversation.contact_id);
      }

      // Regenerate conversation summary
      await memoryService.generateConversationSummary(ctx, conversationId);

      // Regenerate interaction summary
      if (conversation) {
        await memoryService.generateInteractionSummary(ctx, conversation.contact_id);
      }
    } catch (err) {
      logger.error("Failed to update memory on conversation change", { conversationId, err });
    }
  },
};
