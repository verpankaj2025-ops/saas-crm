import { messagesRepository } from "./messages.repository";
import { conversationsRepository } from "../conversations/conversations.repository";
import { whatsappService } from "../whatsapp/whatsapp.service";
import { NotFoundError } from "../../lib/errors";
import { emitToConversation, emitToWorkspace } from "../../sockets";
import { logger } from "../../lib/logger";
import type { WorkspaceContext } from "../../types/common";
import type { Message, SendMessageDto, MessageFilter } from "./messages.types";

export const messagesService = {
  async list(ctx: WorkspaceContext, filter: MessageFilter): Promise<Message[]> {
    return messagesRepository.findByConversation(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<Message> {
    const msg = await messagesRepository.findById(ctx, id);
    if (!msg) throw new NotFoundError("Message");
    return msg;
  },

  async send(ctx: WorkspaceContext, dto: SendMessageDto): Promise<Message> {
    // Fetch conversation for channel + contact info (needed for WhatsApp delivery)
    const conv = await conversationsRepository.findById(ctx, dto.conversation_id);
    if (!conv) throw new NotFoundError("Conversation");

    // Persist message as "queued" — UI shows it immediately
    const message = await messagesRepository.create(ctx, {
      ...dto,
      sender_id:   ctx.userId,
      sender_type: "agent",
    });

    // Realtime: push to conversation room so all agents see it instantly
    emitToConversation(dto.conversation_id, "message:new", message);

    // Realtime: bump conversation sort order in workspace list
    const freshConv = await conversationsRepository.findById(ctx, dto.conversation_id);
    if (freshConv) emitToWorkspace(ctx.workspaceId, "conversation:updated", freshConv);

    // Enqueue WhatsApp delivery when channel + contact phone are available
    if (conv.channel_id && conv.contact?.phone) {
      void whatsappService
        .scheduleOutbound({
          messageId:      message.id,
          workspaceId:    ctx.workspaceId,
          conversationId: dto.conversation_id,
          channelId:      conv.channel_id,
          contactPhone:   conv.contact.phone,
          content:        dto.content ?? "",
        })
        .catch((err: unknown) => {
          logger.error("messages: failed to schedule WhatsApp outbound", {
            messageId: message.id, err,
          });
        });
    }

    return message;
  },

  async retry(ctx: WorkspaceContext, id: string): Promise<Message> {
    const msg = await messagesRepository.findById(ctx, id);
    if (!msg) throw new NotFoundError("Message");
    if (msg.status !== "failed") return msg; // idempotent — already ok

    await messagesRepository.updateStatus(ctx.workspaceId, id, { status: "queued" });
    const queued = { ...msg, status: "queued" as const };

    emitToConversation(msg.conversation_id, "message:status", {
      messageId:      id,
      conversationId: msg.conversation_id,
      status:         "queued",
    });

    // Re-fetch conversation for WhatsApp delivery
    const conv = await conversationsRepository.findById(ctx, msg.conversation_id);
    if (conv?.channel_id && conv.contact?.phone) {
      void whatsappService
        .scheduleOutbound({
          messageId:      id,
          workspaceId:    ctx.workspaceId,
          conversationId: msg.conversation_id,
          channelId:      conv.channel_id,
          contactPhone:   conv.contact.phone,
          content:        msg.content ?? "",
        })
        .catch((err: unknown) => {
          logger.error("messages: failed to re-schedule WhatsApp outbound", {
            messageId: id, err,
          });
        });
    }

    return queued;
  },
};
