import { db } from "../../config/supabase";
import { redis } from "../../config/redis";
import { logger } from "../../lib/logger";
import { emitToConversation, emitToWorkspace } from "../../sockets";
import { whatsappQueue } from "../../queues";
import { contactsRepository } from "../contacts/contacts.repository";
import { conversationsRepository } from "../conversations/conversations.repository";
import { messagesRepository } from "../messages/messages.repository";
import {
  sendWhatsAppText,
  sendWhatsAppMedia,
  sendWhatsAppTemplate,
  getMediaUrl,
  downloadMedia,
  WhatsAppApiError,
  type OutboundMediaType,
} from "./whatsapp.client";
import { buildMediaPath, uploadInboundMedia } from "./whatsapp.storage";
import { extractMedia, mediaContentType } from "./whatsapp.inbound";
import type { WhatsAppOutboundJobData } from "../../queues";
import type { Message } from "../messages/messages.types";
import type {
  WhatsAppWebhookBody,
  WhatsAppValue,
  WhatsAppMessage,
  WhatsAppChannelConfig,
  WhatsAppStatus,
} from "./whatsapp.types";

// ── Webhook idempotency lock ──────────────────────────────────
// Prevents duplicate processing when Meta delivers the same wamid
// to concurrent server instances or retries an in-flight event.
//
// Key design:  wh:lock:wa:{wamid}
//   wh:lock:   webhook lock namespace (avoids collision with BullMQ / cache keys)
//   wa:        provider namespace (future: email, sms, …)
//   {wamid}    globally unique WhatsApp message ID from Meta
//
// TTL = 30 s: long past any realistic processing time, short enough
// that genuine Meta retries (≥10 min) are never permanently blocked.
// No explicit release — the TTL is the release mechanism, which keeps
// the lock alive for the full window so DB-dedup-gap replays are also caught.

const WH_LOCK_TTL_SECONDS = 30;

async function acquireMessageLock(wamid: string): Promise<boolean> {
  try {
    const key    = `wh:lock:wa:${wamid}`;
    const result = await redis.set(key, "1", "EX", WH_LOCK_TTL_SECONDS, "NX");
    return result === "OK";
  } catch (err) {
    // Redis unavailable — degrade gracefully: allow processing and rely
    // on the DB-level external_id dedup check as the fallback guard.
    logger.warn("WhatsApp: Redis lock unavailable, falling back to DB dedup", { wamid, err });
    return true;
  }
}

// ── Channel lookup ────────────────────────────────────────────

interface ChannelRow {
  id: string;
  workspace_id: string;
  config: WhatsAppChannelConfig;
}

// ── Helpers ───────────────────────────────────────────────────

// Converts any phone string to E.164 format (+<digits>).
// Strips all non-digit characters first, then prepends "+".
// Throws if the input contains no digits — caller must validate
// upstream (bad phone in DB should surface early, not reach Meta).
//
// normalizePhone("+1 (555) 234-5678") → "+15552345678"
// normalizePhone("15552345678")       → "+15552345678"
// normalizePhone("91 98765 43210")    → "+919876543210"
// normalizePhone("++1234567890")      → "+1234567890"   (double-plus safe)
// normalizePhone("")                  → throws
// normalizePhone("abc")               → throws
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    throw new Error(`normalizePhone: no digits found in "${phone}"`);
  }
  return `+${digits}`;
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
  accessToken: string | undefined,
): Promise<void> {
  // ── Layer 1: Redis idempotency lock ───────────────────────────
  // Acquire before any DB work. If the lock is already held, another
  // process is handling this exact wamid — skip immediately.
  const locked = await acquireMessageLock(wamsg.id);
  if (!locked) {
    logger.debug("WhatsApp: wamid lock held by concurrent process, skipping", { wamid: wamsg.id });
    return;
  }

  // ── Layer 2: DB dedup ─────────────────────────────────────────
  // Catches genuine replays that arrive after the lock expires (>30 s)
  // and the case where Redis was unavailable during lock acquisition.
  const dup = await messagesRepository.findByExternalId(workspaceId, wamsg.id);
  if (dup) {
    logger.debug("WhatsApp: duplicate wamid in DB, skipping", { wamid: wamsg.id });
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

  // Atomically find or create an open conversation.
  // The DB partial unique index (idx_conversations_unique_active) ensures
  // at most one open/pending conversation per contact+channel, even under
  // concurrent webhook delivery. Conflict recovery is handled inside the
  // repository — no duplicate conversations can result.
  const convRow = await conversationsRepository.findOrCreateForInbound(workspaceId, {
    contact_id: contact.id,
    channel_id: channelId,
  });
  if (convRow.created) {
    logger.info("WhatsApp: new conversation created", { conversationId: convRow.id });
  }

  const conversationId = convRow.id;

  // ── Resolve content + any media attachment ──────────────────
  let content: string | null = wamsg.type === "text" ? (wamsg.text?.body ?? null) : null;
  let contentType: Message["content_type"] = "text";
  let attachmentUrl: string | null = null;
  let attachmentMetadata: Record<string, unknown> | null = null;

  const media = extractMedia(wamsg);
  if (media) {
    contentType = mediaContentType(media.type);
    content     = media.caption; // caption (if present) is the visible text
    attachmentMetadata = {
      wa_media_id: media.mediaId,
      wa_type:     media.type,
      mime_type:   media.mime,
      filename:    media.filename,
      caption:     media.caption,
    };

    // Download from Meta + re-host in Supabase Storage. On failure we still
    // persist the message (without a usable URL) so the inbound is not lost.
    if (accessToken) {
      try {
        const info     = await getMediaUrl(media.mediaId, accessToken);
        const download = await downloadMedia(info.url, accessToken, media.mime);
        const path     = buildMediaPath(workspaceId, conversationId, wamsg.id, info.mime_type || media.mime);
        attachmentUrl  = await uploadInboundMedia({
          path,
          buffer:      download.buffer,
          contentType: download.contentType,
        });
        attachmentMetadata.size = info.file_size ?? download.buffer.length;
      } catch (err) {
        logger.error("WhatsApp: inbound media download/store failed", {
          wamid: wamsg.id, mediaId: media.mediaId, err,
        });
        attachmentMetadata.download_error = err instanceof Error ? err.message : String(err);
      }
    } else {
      logger.warn("WhatsApp: no access token for media download", { wamid: wamsg.id, channelId });
      attachmentMetadata.download_error = "no_access_token";
    }
  }

  // Save inbound message
  const message = await messagesRepository.createInbound(workspaceId, {
    conversation_id:     conversationId,
    content,
    content_type:        contentType,
    external_id:         wamsg.id,
    attachment_url:      attachmentUrl,
    attachment_metadata: attachmentMetadata,
  });
  logger.info("WhatsApp: message saved", { wamid: wamsg.id, messageId: message.id, contentType });

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
    // Optional media/template delivery fields (text remains the default).
    content_type?:  Message["content_type"];
    attachmentUrl?: string | null;
    caption?:       string | null;
    filename?:      string | null;
    template?:      WhatsAppOutboundJobData["template"];
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

    // Only text/media/template are deliverable; anything else (e.g. interactive) → text.
    const deliverable = new Set(["image", "audio", "video", "document", "template"]);
    const jobContentType: WhatsAppOutboundJobData["content_type"] =
      opts.content_type && deliverable.has(opts.content_type)
        ? (opts.content_type as WhatsAppOutboundJobData["content_type"])
        : "text";

    // Credentials are NOT stored in the job payload — worker resolves them from DB
    const jobData: WhatsAppOutboundJobData = {
      messageId:      opts.messageId,
      conversationId: opts.conversationId,
      workspaceId:    opts.workspaceId,
      channelId:      opts.channelId,
      to:             normalizePhone(opts.contactPhone),
      content:        opts.content,
      content_type:   jobContentType,
      attachment_url: opts.attachmentUrl ?? undefined,
      caption:        opts.caption ?? undefined,
      filename:       opts.filename ?? undefined,
      template:       opts.template,
    };

    const jobName = opts.template ? "send-template"
      : jobContentType !== "text" ? "send-media"
      : "send-text";

    await whatsappQueue.add(jobName, jobData, {
      attempts:    3,
      backoff:     { type: "exponential", delay: 3_000 },
      removeOnComplete: { count: 500 },
      removeOnFail:     { count: 200 },
    });

    logger.debug("WhatsApp: outbound job enqueued", { messageId: opts.messageId, jobName });
  },

  // ── Outbound: actual send (called by BullMQ worker) ───────

  async processOutboundJob(job: WhatsAppOutboundJobData): Promise<void> {
    const { messageId, conversationId, workspaceId, channelId, to, content } = job;

    // Resolve credentials from DB at execution time — never travel through Redis
    const channel = await findChannelById(channelId, workspaceId);
    if (!channel) {
      logger.error("WhatsApp: channel not found during job processing", { channelId, messageId });
      await messagesRepository.updateStatus(workspaceId, messageId, { status: "failed" });
      emitToConversation(conversationId, "message:status", { messageId, conversationId, status: "failed" });
      return;
    }

    const config = channel.config as WhatsAppChannelConfig;
    if (!config.phone_number_id || !config.access_token) {
      logger.error("WhatsApp: channel credentials missing during job processing", { channelId, messageId });
      await messagesRepository.updateStatus(workspaceId, messageId, { status: "failed" });
      emitToConversation(conversationId, "message:status", { messageId, conversationId, status: "failed" });
      return;
    }

    const { phone_number_id: pn, access_token: token } = config;
    const mediaType: OutboundMediaType | null =
      job.content_type && ["image", "audio", "video", "document"].includes(job.content_type)
        ? (job.content_type as OutboundMediaType)
        : null;

    try {
      let result;
      if (job.template) {
        result = await sendWhatsAppTemplate(
          pn, token, to, job.template.name, job.template.language, job.template.params,
        );
      } else if (mediaType) {
        if (!job.attachment_url) {
          throw new WhatsAppApiError("media message missing attachment_url", 131051, 0);
        }
        result = await sendWhatsAppMedia(
          pn, token, to, mediaType, job.attachment_url, job.caption ?? undefined, job.filename ?? undefined,
        );
      } else {
        result = await sendWhatsAppText(pn, token, to, content);
      }

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

      logger.info("WhatsApp: outbound message sent", { messageId, wamid: result.wamid, kind: job.template ? "template" : mediaType ?? "text" });
    } catch (err) {
      const isPermanent = err instanceof WhatsAppApiError && err.isPermanent;
      const errorCode   = err instanceof WhatsAppApiError ? err.apiCode : undefined;

      await messagesRepository.updateStatus(workspaceId, messageId, { status: "failed" });

      emitToConversation(conversationId, "message:status", {
        messageId,
        conversationId,
        status: "failed",
        error:  err instanceof Error ? err.message : String(err),
        code:   errorCode,
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

      const incoming = s.status as "sent" | "delivered" | "read" | "failed";
      const msg = await messagesRepository.updateStatusByExternalId(
        workspaceId,
        s.id,
        incoming,
      );

      if (!msg) {
        // Two possible reasons the UPDATE returned no row:
        // 1. wamid not in DB yet (unknown message — log at warn)
        // 2. transition guard blocked it (out-of-order event — log at debug)
        logger.debug("WhatsApp: status event skipped (unknown wamid or out-of-order transition)", {
          wamid: s.id, incoming,
        });
        continue;
      }

      // For failed receipts, surface Meta's error code/title in the socket
      // event (and logs) — not persisted, no schema column for it.
      const failure = incoming === "failed" ? s.errors?.[0] : undefined;

      emitToConversation(msg.conversation_id, "message:status", {
        messageId:      msg.id,
        conversationId: msg.conversation_id,
        status:         msg.status,
        ...(failure ? { error: failure.title, code: failure.code } : {}),
      });

      if (failure) {
        logger.warn("WhatsApp: message delivery failed", {
          wamid: s.id, msgId: msg.id, code: failure.code, title: failure.title,
        });
      }

      logger.debug("WhatsApp: status updated", {
        wamid:   s.id,
        status:  msg.status,
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
        const accessToken = (channel.config as WhatsAppChannelConfig | null)?.access_token;

        // Process each inbound message in this change
        for (const wamsg of value.messages ?? []) {
          try {
            await processMessage(workspaceId, channelId, wamsg, value, accessToken);
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
