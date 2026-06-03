import { messagesRepository } from "./messages.repository";
import { conversationsRepository } from "../conversations/conversations.repository";
import { whatsappService } from "../whatsapp/whatsapp.service";
import { templatesRepository } from "../templates/templates.repository";
import { orderedTemplateParams, renderTemplateBody } from "../whatsapp/whatsapp.template";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { emitToConversation, emitToWorkspace } from "../../sockets";
import { logger } from "../../lib/logger";
import type { WorkspaceContext } from "../../types/common";
import type { Message, SendMessageDto, MessageFilter } from "./messages.types";

// Media content types that travel to WhatsApp as media (not text/template).
const MEDIA_TYPES = ["image", "document", "audio", "video"] as const;
type WhatsAppMediaContentType = (typeof MEDIA_TYPES)[number];
function isMediaType(t: Message["content_type"] | undefined): t is WhatsAppMediaContentType {
  return !!t && (MEDIA_TYPES as readonly string[]).includes(t);
}

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

    // ── Template messages: resolve the approved template from DB ──
    // Frontend only sends template_id (+ variable values); name/language/
    // body all come from the templates table. No raw template_name input.
    let templateDelivery: { name: string; language: string; params: string[] } | undefined;
    let createDto: SendMessageDto & { sender_id: string; sender_type: "agent" } = {
      ...dto,
      sender_id:   ctx.userId,
      sender_type: "agent",
    };

    if (dto.content_type === "template") {
      if (!dto.template_id) throw new ValidationError("template_id is required for template messages");
      const tpl = await templatesRepository.findById(ctx, dto.template_id);
      if (!tpl) throw new NotFoundError("Template");

      const values   = dto.template_variables ?? {};
      const params   = orderedTemplateParams(tpl.variables ?? [], values);
      const rendered = renderTemplateBody(tpl.body, values);
      templateDelivery = {
        name:     tpl.external_id ?? tpl.name, // approved WA template name
        language: tpl.language,
        params,
      };
      // Store a rendered body so the thread shows readable text.
      createDto = {
        ...createDto,
        content:             rendered,
        attachment_metadata: { template_id: tpl.id, language: tpl.language, variables: values },
      };
      void templatesRepository.markUsed(ctx, tpl.id).catch(() => { /* non-critical */ });
    }

    // Persist message as "queued" — UI shows it immediately
    const message = await messagesRepository.create(ctx, createDto);

    // Realtime: push to conversation room so all agents see it instantly
    emitToConversation(dto.conversation_id, "message:new", message);

    // Realtime: bump conversation sort order in workspace list
    const freshConv = await conversationsRepository.findById(ctx, dto.conversation_id);
    if (freshConv) emitToWorkspace(ctx.workspaceId, "conversation:updated", freshConv);

    // Enqueue WhatsApp delivery when channel + contact phone are available
    if (conv.channel_id && conv.contact?.phone) {
      const filename =
        typeof dto.attachment_metadata?.filename === "string"
          ? dto.attachment_metadata.filename
          : undefined;

      void whatsappService
        .scheduleOutbound({
          messageId:      message.id,
          workspaceId:    ctx.workspaceId,
          conversationId: dto.conversation_id,
          channelId:      conv.channel_id,
          contactPhone:   conv.contact.phone,
          content:        message.content ?? dto.content ?? "",
          content_type:   dto.content_type,
          attachmentUrl:  dto.attachment_url ?? null,
          caption:        isMediaType(dto.content_type) ? dto.content ?? null : null,
          filename,
          template:       templateDelivery,
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
      // Rebuild media/template delivery from the stored message so a retry
      // re-sends the same kind of message (not a plain-text fallback).
      const meta = msg.attachment_metadata ?? {};
      let templateDelivery: { name: string; language: string; params: string[] } | undefined;
      if (msg.content_type === "template" && typeof meta.template_id === "string") {
        const tpl = await templatesRepository.findById(ctx, meta.template_id);
        if (tpl) {
          const values = (meta.variables as Record<string, string> | undefined) ?? {};
          templateDelivery = {
            name:     tpl.external_id ?? tpl.name,
            language: tpl.language,
            params:   orderedTemplateParams(tpl.variables ?? [], values),
          };
        }
      }
      const filename = typeof meta.filename === "string" ? meta.filename : undefined;

      void whatsappService
        .scheduleOutbound({
          messageId:      id,
          workspaceId:    ctx.workspaceId,
          conversationId: msg.conversation_id,
          channelId:      conv.channel_id,
          contactPhone:   conv.contact.phone,
          content:        msg.content ?? "",
          content_type:   msg.content_type,
          attachmentUrl:  msg.attachment_url,
          caption:        isMediaType(msg.content_type) ? msg.content : null,
          filename,
          template:       templateDelivery,
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
