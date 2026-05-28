import { Queue } from "bullmq";
import { redis } from "../config/redis";
import { logger } from "../lib/logger";

const connection = redis;

// ── Queue definitions ────────────────────────────────────────

export const emailQueue = new Queue("email", { connection });
export const broadcastQueue = new Queue("broadcast", { connection });
export const automationQueue = new Queue("automation", { connection });
export const aiQueue = new Queue("ai", { connection });
export const whatsappQueue  = new Queue("whatsapp-outbound",       { connection });
export const followupQueue  = new Queue("followup-reminder",       { connection });
export const appointmentReminderQueue = new Queue("appointment-reminder", { connection });

// ── Job type exports (used by workers and services) ──────────

export type EmailJobData = {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string>;
};

export type BroadcastJobData = {
  broadcastId: string;
  workspaceId: string;
  batchSize?: number;
};

export type AutomationJobData = {
  ruleId: string;
  workspaceId: string;
  triggerEntityType: string;
  triggerEntityId: string;
};

export type AiJobData = {
  entityType: "contact" | "conversation";
  entityId: string;
  workspaceId: string;
  task: "summarize" | "embed" | "reply_suggestion";
};

export type WhatsAppOutboundJobData = {
  messageId: string;
  conversationId: string;
  workspaceId: string;
  phoneNumberId: string;   // from channel.config
  accessToken: string;     // from channel.config (plain or decrypted)
  to: string;              // E.164 recipient phone with leading +
  content: string;         // text body
};

export type FollowupJobData = {
  followupId:     string;
  workspaceId:    string;
  conversationId: string | null;
};

export type AppointmentReminderJobData = {
  appointmentId: string;
  workspaceId:   string;
  contactId:     string;
  reminderType:  "24h" | "2h";
};

logger.info("BullMQ queues initialized", {
  queues: ["email", "broadcast", "automation", "ai", "whatsapp-outbound", "followup-reminder", "appointment-reminder"],
});
