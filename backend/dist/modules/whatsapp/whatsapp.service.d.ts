import type { WhatsAppOutboundJobData } from "../../queues";
import type { WhatsAppWebhookBody, WhatsAppStatus } from "./whatsapp.types";
export declare const whatsappService: {
    scheduleOutbound(opts: {
        messageId: string;
        workspaceId: string;
        conversationId: string;
        channelId: string;
        contactPhone: string;
        content: string;
    }): Promise<void>;
    processOutboundJob(job: WhatsAppOutboundJobData): Promise<void>;
    handleStatusWebhook(workspaceId: string, statuses: WhatsAppStatus[]): Promise<void>;
    processWebhook(body: WhatsAppWebhookBody): Promise<void>;
};
//# sourceMappingURL=whatsapp.service.d.ts.map