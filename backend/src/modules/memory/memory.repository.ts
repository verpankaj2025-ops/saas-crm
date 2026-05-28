import { db } from "../../config/supabase";
import type { WorkspaceContext } from "../../types/common";
import type { 
  ContactPreferences, 
  LeadScoreData, 
  ConversationSummary, 
  InteractionSummary,
  ImportantNote,
  UpdatePreferencesDto 
} from "./memory.types";

export const memoryRepository = {
  // ── Contact Preferences (stored in contacts.custom_fields) ──────

  async getPreferences(
    ctx: WorkspaceContext,
    contactId: string
  ): Promise<ContactPreferences> {
    const { data } = await db
      .from("contacts")
      .select("custom_fields")
      .eq("id", contactId)
      .eq("workspace_id", ctx.workspaceId)
      .single();
    
    if (!data) return {};
    
    return (data.custom_fields?.preferences as ContactPreferences) || {};
  },

  async updatePreferences(
    ctx: WorkspaceContext,
    contactId: string,
    dto: UpdatePreferencesDto
  ): Promise<ContactPreferences> {
    const current = await memoryRepository.getPreferences(ctx, contactId);
    const updated = { ...current, ...dto };
    
    const { data } = await db
      .from("contacts")
      .update({ custom_fields: { preferences: updated } })
      .eq("id", contactId)
      .eq("workspace_id", ctx.workspaceId)
      .select("custom_fields")
      .single();
    
    return (data?.custom_fields?.preferences as ContactPreferences) || {};
  },

  // ── Lead Score (stored in contacts.custom_fields) ────────────────

  async getLeadScore(
    ctx: WorkspaceContext,
    contactId: string
  ): Promise<LeadScoreData | null> {
    const { data } = await db
      .from("contacts")
      .select("custom_fields")
      .eq("id", contactId)
      .eq("workspace_id", ctx.workspaceId)
      .single();
    
    if (!data?.custom_fields?.lead_score) return null;
    
    return {
      score: data.custom_fields.lead_score as "cold" | "warm" | "hot",
      updated_at: data.custom_fields.score_updated_at as string,
      reason: data.custom_fields.score_reason as string,
    };
  },

  async refreshLeadScore(
    ctx: WorkspaceContext,
    contactId: string
  ): Promise<LeadScoreData> {
    // Call the database function to update lead score
    await db.rpc("update_lead_score", {
      p_contact_id: contactId,
      p_workspace_id: ctx.workspaceId,
    });
    
    return memoryRepository.getLeadScore(ctx, contactId) as Promise<LeadScoreData>;
  },

  // ── Conversation Summary (stored in ai_memories) ────────────────

  async getConversationSummary(
    ctx: WorkspaceContext,
    conversationId: string
  ): Promise<ConversationSummary | null> {
    const { data } = await db
      .from("ai_memories")
      .select("*")
      .eq("workspace_id", ctx.workspaceId)
      .eq("entity_type", "conversation")
      .eq("entity_id", conversationId)
      .eq("memory_type", "conversation_summary")
      .single();
    
    if (!data) return null;
    
    return {
      conversation_id: data.entity_id,
      message_count: data.attributes?.message_count || 0,
      first_message_at: data.attributes?.first_message_at || "",
      last_message_at: data.attributes?.last_message_at || "",
      summary: data.content,
      key_topics: data.attributes?.key_topics || [],
      sentiment: data.attributes?.sentiment,
    };
  },

  async saveConversationSummary(
    ctx: WorkspaceContext,
    summary: ConversationSummary
  ): Promise<void> {
    // Check if summary already exists
    const { data: existing } = await db
      .from("ai_memories")
      .select("id")
      .eq("workspace_id", ctx.workspaceId)
      .eq("entity_type", "conversation")
      .eq("entity_id", summary.conversation_id)
      .eq("memory_type", "conversation_summary")
      .maybeSingle();
    
    const attributes = {
      message_count: summary.message_count,
      first_message_at: summary.first_message_at,
      last_message_at: summary.last_message_at,
      key_topics: summary.key_topics || [],
      sentiment: summary.sentiment,
    };
    
    if (existing) {
      await db
        .from("ai_memories")
        .update({ 
          content: summary.summary,
          attributes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await db
        .from("ai_memories")
        .insert({
          workspace_id: ctx.workspaceId,
          entity_type: "conversation",
          entity_id: summary.conversation_id,
          memory_type: "conversation_summary",
          content: summary.summary,
          attributes,
          source: "system",
          relevance_score: 1.0,
        });
    }
  },

  // ── Interaction Summary (stored in ai_memories) ─────────────────

  async getInteractionSummary(
    ctx: WorkspaceContext,
    contactId: string
  ): Promise<InteractionSummary | null> {
    const { data } = await db
      .from("ai_memories")
      .select("*")
      .eq("workspace_id", ctx.workspaceId)
      .eq("entity_type", "contact")
      .eq("entity_id", contactId)
      .eq("memory_type", "interaction_summary")
      .single();
    
    if (!data) return null;
    
    return {
      contact_id: data.entity_id,
      total_conversations: data.attributes?.total_conversations || 0,
      total_messages: data.attributes?.total_messages || 0,
      last_contacted_at: data.attributes?.last_contacted_at || "",
      avg_response_time_hours: data.attributes?.avg_response_time_hours,
      preferred_channels: data.attributes?.preferred_channels || [],
    };
  },

  async saveInteractionSummary(
    ctx: WorkspaceContext,
    summary: InteractionSummary
  ): Promise<void> {
    const { data: existing } = await db
      .from("ai_memories")
      .select("id")
      .eq("workspace_id", ctx.workspaceId)
      .eq("entity_type", "contact")
      .eq("entity_id", summary.contact_id)
      .eq("memory_type", "interaction_summary")
      .maybeSingle();
    
    const attributes = {
      total_conversations: summary.total_conversations,
      total_messages: summary.total_messages,
      last_contacted_at: summary.last_contacted_at,
      avg_response_time_hours: summary.avg_response_time_hours,
      preferred_channels: summary.preferred_channels,
    };
    
    if (existing) {
      await db
        .from("ai_memories")
        .update({ 
          content: `Interaction summary: ${summary.total_conversations} conversations, ${summary.total_messages} messages`,
          attributes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await db
        .from("ai_memories")
        .insert({
          workspace_id: ctx.workspaceId,
          entity_type: "contact",
          entity_id: summary.contact_id,
          memory_type: "interaction_summary",
          content: `Interaction summary: ${summary.total_conversations} conversations, ${summary.total_messages} messages`,
          attributes,
          source: "system",
          relevance_score: 1.0,
        });
    }
  },

  // ── Important Notes (from contact_notes) ────────────────────────

  async getImportantNotes(
    ctx: WorkspaceContext,
    contactId: string
  ): Promise<ImportantNote[]> {
    const { data } = await db
      .from("contact_notes")
      .select(`
        id,
        content,
        is_pinned,
        created_at,
        author_id
      `)
      .eq("contact_id", contactId)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);
    
    return (data || []).map((note) => ({
      id: note.id,
      content: note.content,
      is_pinned: note.is_pinned,
      created_at: note.created_at,
    }));
  },
};
