import { db } from "../../config/supabase";
import { logger } from "../../lib/logger";
import { emitToConversation, emitToWorkspace } from "../../sockets";
import { whatsappQueue } from "../../queues";
import { contactsRepository } from "../contacts/contacts.repository";
import { conversationsRepository } from "../conversations/conversations.repository";
import { messagesRepository } from "../messages/messages.repository";
import { sendWhatsAppText, WhatsAppApiError } from "./whatsapp.client";
import type { WhatsAppOutboundJobData } from "../../queues";
import type {
  WhatsAppWebhookBody,
  WhatsAppValue,
  WhatsAppMessage,
  WhatsAppChannelConfig,
  WhatsAppStatus,
} from "./whatsapp.types";

// ── Channel lookup ────────────────────────────────────────────

interface ChannelRow {
  id: string;
  workspace_id: string;
  config: WhatsAppChannelConfig;
}

// ── Helpers ───────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

async function findChannelById(
  id: string,
  workspaceId: string,
): Promise<(ChannelRow & { type: string; is_active: boolean }) | null> {
  const { data } = await db
    .from("channels")
    .select("id,workspace_id,type,config,is_active")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as (ChannelRow & { type: string; is_active: boolean }) | null;
}

async function findChannelByPhoneNumberId(
  phoneNumberId: string,
): Promise<ChannelRow | null> {
  const { data, error } = await db
    .from("channels")
    .select("id,workspace_id,config")
    .eq("type", "whatsapp")
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(100);

  if (error) {
    logger.error("WhatsApp: channel lookup failed", { error });
    return null;
  }

  const match = (data ?? []).find(
    (ch) =>
      (ch.config as WhatsAppChannelConfig | null)?.phone_number_id === phoneNumberId,
  );

  return match ? (match as unknown as ChannelRow) : null;
}

// ── Single message processor ──────────────────────────────────

async function processMessage(
  workspaceId: string,
  channelId: string,
  wamsg: WhatsAppMessage,
  value: WhatsAppValue,
): Promise<void> {
  // Idempotency: skip if already processed
  const dup = await messagesRepository.findByExternalId(workspaceId, wamsg.id);
  if (dup) {
    logger.debug("WhatsApp: duplicate wamid, skipping", { wamid: wamsg.id });
    return;
  }

  // Resolve display name from contacts array in payload (may be absent)
  const profileName =
    value.contacts?.find((c) => c.wa_id === wamsg.from)?.profile.name ??
    wamsg.from;

  // Find or auto-create contact
  const contact = await contactsRepository.findOrCreateByPhone(
    workspaceId,
    wamsg.from,
    profileName,
  );
  logger.debug("WhatsApp: contact resolved", { contactId: contact.id });

  // Find open conversation or create one
  let convRow = await conversationsRepository.findOpenByContactAndChannel(
    workspaceId,
    contact.id,
    channelId,
  );
  if (!convRow) {
    convRow = await conversationsRepository.createInbound(workspaceId, {
      contact_id: contact.id,
      channel_id: channelId,
    });
    logger.info("WhatsApp: new conversation created", { conversationId: convRow.id });
  }

  const conversationId = convRow.id;

  // Extract text content (only text messages for now)
  const content = wamsg.type === "text" ? (wamsg.text?.body ?? null) : null;

  // Save inbound message
  const message = await messagesRepository.createInbound(workspaceId, {
    conversation_id: conversationId,
    content,
    content_type:    "text",
    external_id:     wamsg.id,
  });
  logger.info("WhatsApp: message saved", { wamid: wamsg.id, messageId: message.id });

  // Auto-cancel pending follow-ups when customer replies
  try {
    const { followupsService } = await import("../followups/followups.service");
    await followupsService.cancelByConversation(workspaceId, conversationId);
  } catch (err) {
    logger.warn("WhatsApp: failed to auto-cancel followups", { conversationId, err });
  }

  // Update conversation: increment unread, set last preview
  await conversationsRepository.incrementUnread(
    workspaceId,
    conversationId,
    content ?? "(media)",
    message.created_at,
  );

  // Emit realtime events
  emitToConversation(conversationId, "message:new", message);

  // Re-fetch full conversation with contact join for workspace broadcast
  const updatedConv = await conversationsRepository.findById(
    { workspaceId, userId: "system", role: "agent" },
    conversationId,
  );
  if (updatedConv) {
    emitToWorkspace(workspaceId, "conversation:updated", updatedConv);
  }
}

// ── Public entry point ────────────────────────────────────────

export const whatsappService = {
  // ── Outbound: schedule delivery via BullMQ ────────────────

  async scheduleOutbound(opts: {
    messageId:      string;
    workspaceId:    string;
    conversationId: string;
    channelId:      string;
    contactPhone:   string;   // raw phone from contact record
    content:        string;
  }): Promise<void> {
    const channel = await findChannelById(opts.channelId, opts.workspaceId);
    if (!channel || channel.type !== "whatsapp" || !channel.is_active) {
      logger.warn("WhatsApp: channel not found or inactive for outbound", {
        channelId: opts.channelId,
      });
      return;
    }

    const config = channel.config as WhatsAppChannelConfig;
    if (!config.phone_number_id || !config.access_token) {
      logger.warn("WhatsApp: channel missing phone_number_id or access_token", {
        channelId: opts.channelId,
      });
      return;
    }

    const jobData: WhatsAppOutboundJobData = {
      messageId:      opts.messageId,
      conversationId: opts.conversationId,
      workspaceId:    opts.workspaceId,
      phoneNumberId:  config.phone_number_id,
      accessToken:    config.access_token,
      to:             normalizePhone(opts.contactPhone),
      content:        opts.content,
    };

    await whatsappQueue.add("send-text", jobData, {
      attempts:    3,
      backoff:     { type: "exponential", delay: 3_000 },
      removeOnComplete: { count: 500 },
      removeOnFail:     { count: 200 },
    });

    logger.debug("WhatsApp: outbound job enqueued", { messageId: opts.messageId });
  },

  // ── Outbound: actual send (called by BullMQ worker) ───────

  async processOutboundJob(job: WhatsAppOutboundJobData): Promise<void> {
    const { messageId, conversationId, workspaceId, phoneNumberId, accessToken, to, content } = job;

    try {
      const result = await sendWhatsAppText(phoneNumberId, accessToken, to, content);

      await messagesRepository.updateStatus(workspaceId, messageId, {
        status:      "sent",
        external_id: result.wamid,
      });

      emitToConversation(conversationId, "message:status", {
        messageId,
        conversationId,
        status:      "sent",
        external_id: result.wamid,
      });

      logger.info("WhatsApp: outbound message sent", { messageId, wamid: result.wamid });
    } catch (err) {
      const isPermanent = err instanceof WhatsAppApiError && err.isPermanent;

      await messagesRepository.updateStatus(workspaceId, messageId, { status: "failed" });

      emitToConversation(conversationId, "message:status", {
        messageId,
        conversationId,
        status: "failed",
      });

      logger.error("WhatsApp: outbound message failed", { messageId, err });

      // Re-throw non-permanent errors so BullMQ retries
      if (!isPermanent) throw err;
    }
  },

  // ── Status webhook: delivery / read receipts ─────────────

  async handleStatusWebhook(
    workspaceId: string,
    statuses: WhatsAppStatus[],
  ): Promise<void> {
    for (const s of statuses) {
      if (!["sent", "delivered", "read", "failed"].includes(s.status)) continue;

      const msg = await messagesRepository.updateStatusByExternalId(
        workspaceId,
        s.id,
        s.status as "sent" | "delivered" | "read" | "failed",
      );

      if (!msg) {
        logger.debug("WhatsApp: status update for unknown wamid", { wamid: s.id });
        continue;
      }

      emitToConversation(msg.conversation_id, "message:status", {
        messageId:      msg.id,
        conversationId: msg.conversation_id,
        status:         s.status,
      });

      logger.debug("WhatsApp: status updated", {
        wamid:   s.id,
        status:  s.status,
        msgId:   msg.id,
      });
    }
  },

  // ── Inbound webhook (existing) ────────────────────────────

  async processWebhook(body: WhatsAppWebhookBody): Promise<void> {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        const value         = change.value;
        const phoneNumberId = value.metadata.phone_number_id;

        // Look up which workspace this phone number belongs to
        const channel = await findChannelByPhoneNumberId(phoneNumberId);
        if (!channel) {
          logger.warn("WhatsApp: no active channel for phone_number_id", { phoneNumberId });
          continue;
        }

        const { id: channelId, workspace_id: workspaceId } = channel;

        // Process each inbound message in this change
        for (const wamsg of value.messages ?? []) {
          try {
            await processMessage(workspaceId, channelId, wamsg, value);
          } catch (err) {
            logger.error("WhatsApp: failed to process message", { wamid: wamsg.id, err });
            // Continue with next message rather than failing the whole batch
          }
        }

        // Status updates (delivered/read receipts) — update DB + emit socket
        if (value.statuses?.length) {
          try {
            await whatsappService.handleStatusWebhook(workspaceId, value.statuses);
          } catch (err) {
            logger.error("WhatsApp: failed to handle status updates", { err });
          }
        }
      }
    }
  },
};
