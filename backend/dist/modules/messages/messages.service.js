"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesService = void 0;
const messages_repository_1 = require("./messages.repository");
const conversations_repository_1 = require("../conversations/conversations.repository");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const errors_1 = require("../../lib/errors");
const sockets_1 = require("../../sockets");
const logger_1 = require("../../lib/logger");
exports.messagesService = {
    async list(ctx, filter) {
        return messages_repository_1.messagesRepository.findByConversation(ctx, filter);
    },
    async get(ctx, id) {
        const msg = await messages_repository_1.messagesRepository.findById(ctx, id);
        if (!msg)
            throw new errors_1.NotFoundError("Message");
        return msg;
    },
    async send(ctx, dto) {
        // Fetch conversation for channel + contact info (needed for WhatsApp delivery)
        const conv = await conversations_repository_1.conversationsRepository.findById(ctx, dto.conversation_id);
        if (!conv)
            throw new errors_1.NotFoundError("Conversation");
        // Persist message as "queued" — UI shows it immediately
        const message = await messages_repository_1.messagesRepository.create(ctx, {
            ...dto,
            sender_id: ctx.userId,
            sender_type: "agent",
        });
        // Realtime: push to conversation room so all agents see it instantly
        (0, sockets_1.emitToConversation)(dto.conversation_id, "message:new", message);
        // Realtime: bump conversation sort order in workspace list
        const freshConv = await conversations_repository_1.conversationsRepository.findById(ctx, dto.conversation_id);
        if (freshConv)
            (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "conversation:updated", freshConv);
        // Enqueue WhatsApp delivery when channel + contact phone are available
        if (conv.channel_id && conv.contact?.phone) {
            void whatsapp_service_1.whatsappService
                .scheduleOutbound({
                messageId: message.id,
                workspaceId: ctx.workspaceId,
                conversationId: dto.conversation_id,
                channelId: conv.channel_id,
                contactPhone: conv.contact.phone,
                content: dto.content ?? "",
            })
                .catch((err) => {
                logger_1.logger.error("messages: failed to schedule WhatsApp outbound", {
                    messageId: message.id, err,
                });
            });
        }
        return message;
    },
    async retry(ctx, id) {
        const msg = await messages_repository_1.messagesRepository.findById(ctx, id);
        if (!msg)
            throw new errors_1.NotFoundError("Message");
        if (msg.status !== "failed")
            return msg; // idempotent — already ok
        await messages_repository_1.messagesRepository.updateStatus(ctx.workspaceId, id, { status: "queued" });
        const queued = { ...msg, status: "queued" };
        (0, sockets_1.emitToConversation)(msg.conversation_id, "message:status", {
            messageId: id,
            conversationId: msg.conversation_id,
            status: "queued",
        });
        // Re-fetch conversation for WhatsApp delivery
        const conv = await conversations_repository_1.conversationsRepository.findById(ctx, msg.conversation_id);
        if (conv?.channel_id && conv.contact?.phone) {
            void whatsapp_service_1.whatsappService
                .scheduleOutbound({
                messageId: id,
                workspaceId: ctx.workspaceId,
                conversationId: msg.conversation_id,
                channelId: conv.channel_id,
                contactPhone: conv.contact.phone,
                content: msg.content ?? "",
            })
                .catch((err) => {
                logger_1.logger.error("messages: failed to re-schedule WhatsApp outbound", {
                    messageId: id, err,
                });
            });
        }
        return queued;
    },
};
//# sourceMappingURL=messages.service.js.map