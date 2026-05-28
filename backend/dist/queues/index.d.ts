import { Queue } from "bullmq";
export declare const emailQueue: Queue<any, any, string, any, any, string>;
export declare const broadcastQueue: Queue<any, any, string, any, any, string>;
export declare const automationQueue: Queue<any, any, string, any, any, string>;
export declare const aiQueue: Queue<any, any, string, any, any, string>;
export declare const whatsappQueue: Queue<any, any, string, any, any, string>;
export declare const followupQueue: Queue<any, any, string, any, any, string>;
export declare const appointmentReminderQueue: Queue<any, any, string, any, any, string>;
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
    phoneNumberId: string;
    accessToken: string;
    to: string;
    content: string;
};
export type FollowupJobData = {
    followupId: string;
    workspaceId: string;
    conversationId: string | null;
};
export type AppointmentReminderJobData = {
    appointmentId: string;
    workspaceId: string;
    contactId: string;
    reminderType: "24h" | "2h";
};
//# sourceMappingURL=index.d.ts.map