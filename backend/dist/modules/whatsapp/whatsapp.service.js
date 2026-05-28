"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = void 0;
const supabase_1 = require("../../config/supabase");
const logger_1 = require("../../lib/logger");
const sockets_1 = require("../../sockets");
const queues_1 = require("../../queues");
const contacts_repository_1 = require("../contacts/contacts.repository");
const conversations_repository_1 = require("../conversations/conversations.repository");
const messages_repository_1 = require("../messages/messages.repository");
const whatsapp_client_1 = require("./whatsapp.client");
// ── Helpers ───────────────────────────────────────────────────
function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("+") ? digits : `+${digits}`;
}
async function findChannelById(id, workspaceId) {
    const { data } = await supabase_1.db
        .from("channels")
        .select("id,workspace_id,type,config,is_active")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .maybeSingle();
    return data;
}
async function findChannelByPhoneNumberId(phoneNumberId) {
    const { data, error } = await supabase_1.db
        .from("channels")
        .select("id,workspace_id,config")
        .eq("type", "whatsapp")
        .eq("is_active", true)
        .is("deleted_at", null)
        .limit(100);
    if (error) {
        logger_1.logger.error("WhatsApp: channel lookup failed", { error });
        return null;
    }
    const match = (data ?? []).find((ch) => ch.config?.phone_number_id === phoneNumberId);
    return match ? match : null;
}
// ── Single message processor ──────────────────────────────────
async function processMessage(workspaceId, channelId, wamsg, value) {
    // Idempotency: skip if already processed
    const dup = await messages_repository_1.messagesRepository.findByExternalId(workspaceId, wamsg.id);
    if (dup) {
        logger_1.logger.debug("WhatsApp: duplicate wamid, skipping", { wamid: wamsg.id });
        return;
    }
    // Resolve display name from contacts array in payload (may be absent)
    const profileName = value.contacts?.find((c) => c.wa_id === wamsg.from)?.profile.name ??
        wamsg.from;
    // Find or auto-create contact
    const contact = await contacts_repository_1.contactsRepository.findOrCreateByPhone(workspaceId, wamsg.from, profileName);
    logger_1.logger.debug("WhatsApp: contact resolved", { contactId: contact.id });
    // Find open conversation or create one
    let convRow = await conversations_repository_1.conversationsRepository.findOpenByContactAndChannel(workspaceId, contact.id, channelId);
    if (!convRow) {
        convRow = await conversations_repository_1.conversationsRepository.createInbound(workspaceId, {
            contact_id: contact.id,
            channel_id: channelId,
        });
        logger_1.logger.info("WhatsApp: new conversation created", { conversationId: convRow.id });
    }
    const conversationId = convRow.id;
    // Extract text content (only text messages for now)
    const content = wamsg.type === "text" ? (wamsg.text?.body ?? null) : null;
    // Save inbound message
    const message = await messages_repository_1.messagesRepository.createInbound(workspaceId, {
        conversation_id: conversationId,
        content,
        content_type: "text",
        external_id: wamsg.id,
    });
    logger_1.logger.info("WhatsApp: message saved", { wamid: wamsg.id, messageId: message.id });
    // Auto-cancel pending follow-ups when customer replies
    try {
        const { followupsService } = await Promise.resolve().then(() => __importStar(require("../followups/followups.service")));
        await followupsService.cancelByConversation(workspaceId, conversationId);
    }
    catch (err) {
        logger_1.logger.warn("WhatsApp: failed to auto-cancel followups", { conversationId, err });
    }
    // Update conversation: increment unread, set last preview
    await conversations_repository_1.conversationsRepository.incrementUnread(workspaceId, conversationId, content ?? "(media)", message.created_at);
    // Emit realtime events
    (0, sockets_1.emitToConversation)(conversationId, "message:new", message);
    // Re-fetch full conversation with contact join for workspace broadcast
    const updatedConv = await conversations_repository_1.conversationsRepository.findById({ workspaceId, userId: "system", role: "agent" }, conversationId);
    if (updatedConv) {
        (0, sockets_1.emitToWorkspace)(workspaceId, "conversation:updated", updatedConv);
    }
}
// ── Public entry point ────────────────────────────────────────
exports.whatsappService = {
    // ── Outbound: schedule delivery via BullMQ ────────────────
    async scheduleOutbound(opts) {
        const channel = await findChannelById(opts.channelId, opts.workspaceId);
        if (!channel || channel.type !== "whatsapp" || !channel.is_active) {
            logger_1.logger.warn("WhatsApp: channel not found or inactive for outbound", {
                channelId: opts.channelId,
            });
            return;
        }
        const config = channel.config;
        if (!config.phone_number_id || !config.access_token) {
            logger_1.logger.warn("WhatsApp: channel missing phone_number_id or access_token", {
                channelId: opts.channelId,
            });
            return;
        }
        const jobData = {
            messageId: opts.messageId,
            conversationId: opts.conversationId,
            workspaceId: opts.workspaceId,
            phoneNumberId: config.phone_number_id,
            accessToken: config.access_token,
            to: normalizePhone(opts.contactPhone),
            content: opts.content,
        };
        await queues_1.whatsappQueue.add("send-text", jobData, {
            attempts: 3,
            backoff: { type: "exponential", delay: 3_000 },
            removeOnComplete: { count: 500 },
            removeOnFail: { count: 200 },
        });
        logger_1.logger.debug("WhatsApp: outbound job enqueued", { messageId: opts.messageId });
    },
    // ── Outbound: actual send (called by BullMQ worker) ───────
    async processOutboundJob(job) {
        const { messageId, conversationId, workspaceId, phoneNumberId, accessToken, to, content } = job;
        try {
            const result = await (0, whatsapp_client_1.sendWhatsAppText)(phoneNumberId, accessToken, to, content);
            await messages_repository_1.messagesRepository.updateStatus(workspaceId, messageId, {
                status: "sent",
                external_id: result.wamid,
            });
            (0, sockets_1.emitToConversation)(conversationId, "message:status", {
                messageId,
                conversationId,
                status: "sent",
                external_id: result.wamid,
            });
            logger_1.logger.info("WhatsApp: outbound message sent", { messageId, wamid: result.wamid });
        }
        catch (err) {
            const isPermanent = err instanceof whatsapp_client_1.WhatsAppApiError && err.isPermanent;
            await messages_repository_1.messagesRepository.updateStatus(workspaceId, messageId, { status: "failed" });
            (0, sockets_1.emitToConversation)(conversationId, "message:status", {
                messageId,
                conversationId,
                status: "failed",
            });
            logger_1.logger.error("WhatsApp: outbound message failed", { messageId, err });
            // Re-throw non-permanent errors so BullMQ retries
            if (!isPermanent)
                throw err;
        }
    },
    // ── Status webhook: delivery / read receipts ─────────────
    async handleStatusWebhook(workspaceId, statuses) {
        for (const s of statuses) {
            if (!["sent", "delivered", "read", "failed"].includes(s.status))
                continue;
            const msg = await messages_repository_1.messagesRepository.updateStatusByExternalId(workspaceId, s.id, s.status);
            if (!msg) {
                logger_1.logger.debug("WhatsApp: status update for unknown wamid", { wamid: s.id });
                continue;
            }
            (0, sockets_1.emitToConversation)(msg.conversation_id, "message:status", {
                messageId: msg.id,
                conversationId: msg.conversation_id,
                status: s.status,
            });
            logger_1.logger.debug("WhatsApp: status updated", {
                wamid: s.id,
                status: s.status,
                msgId: msg.id,
            });
        }
    },
    // ── Inbound webhook (existing) ────────────────────────────
    async processWebhook(body) {
        for (const entry of body.entry ?? []) {
            for (const change of entry.changes ?? []) {
                if (change.field !== "messages")
                    continue;
                const value = change.value;
                const phoneNumberId = value.metadata.phone_number_id;
                // Look up which workspace this phone number belongs to
                const channel = await findChannelByPhoneNumberId(phoneNumberId);
                if (!channel) {
                    logger_1.logger.warn("WhatsApp: no active channel for phone_number_id", { phoneNumberId });
                    continue;
                }
                const { id: channelId, workspace_id: workspaceId } = channel;
                // Process each inbound message in this change
                for (const wamsg of value.messages ?? []) {
                    try {
                        await processMessage(workspaceId, channelId, wamsg, value);
                    }
                    catch (err) {
                        logger_1.logger.error("WhatsApp: failed to process message", { wamid: wamsg.id, err });
                        // Continue with next message rather than failing the whole batch
                    }
                }
                // Status updates (delivered/read receipts) — update DB + emit socket
                if (value.statuses?.length) {
                    try {
                        await exports.whatsappService.handleStatusWebhook(workspaceId, value.statuses);
                    }
                    catch (err) {
                        logger_1.logger.error("WhatsApp: failed to handle status updates", { err });
                    }
                }
            }
        }
    },
};
//# sourceMappingURL=whatsapp.service.js.map