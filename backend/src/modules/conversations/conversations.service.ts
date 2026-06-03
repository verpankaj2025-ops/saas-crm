import { conversationsRepository } from "./conversations.repository";
import { NotFoundError } from "../../lib/errors";
import { emitToWorkspace } from "../../sockets";
import type { WorkspaceContext, ListResult } from "../../types/common";
import type {
  ConversationWithContact, CreateConversationDto, UpdateConversationDto, ConversationFilter,
} from "./conversations.types";

export const conversationsService = {
  async list(ctx: WorkspaceContext, filter: ConversationFilter): Promise<ListResult<ConversationWithContact>> {
    return conversationsRepository.findAll(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<ConversationWithContact> {
    const conv = await conversationsRepository.findById(ctx, id);
    if (!conv) throw new NotFoundError("Conversation");
    return conv;
  },

  async create(ctx: WorkspaceContext, dto: CreateConversationDto): Promise<ConversationWithContact> {
    const conv = await conversationsRepository.create(ctx, dto);
    emitToWorkspace(ctx.workspaceId, "conversation:created", conv);
    return conv;
  },

  async update(ctx: WorkspaceContext, id: string, dto: UpdateConversationDto): Promise<ConversationWithContact> {
    await conversationsService.get(ctx, id);
    const conv = await conversationsRepository.update(ctx, id, dto);
    emitToWorkspace(ctx.workspaceId, "conversation:updated", conv);
    return conv;
  },

  async markRead(ctx: WorkspaceContext, id: string): Promise<ConversationWithContact> {
    const conv = await conversationsRepository.markRead(ctx, id);
    if (!conv) throw new NotFoundError("Conversation");
    // Lightweight event so other tabs/clients can sync the unread badge,
    // plus the full row for views that re-render the conversation.
    emitToWorkspace(ctx.workspaceId, "conversation:read", {
      conversationId: id,
      unread_count:   0,
      readBy:         ctx.userId,
    });
    emitToWorkspace(ctx.workspaceId, "conversation:updated", conv);
    return conv;
  },

  async delete(ctx: WorkspaceContext, id: string): Promise<void> {
    await conversationsService.get(ctx, id);
    await conversationsRepository.softDelete(ctx, id);
  },
};
