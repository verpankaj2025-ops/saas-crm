import type { WorkspaceContext } from "../../types/common";
import type { Message, SendMessageDto, MessageFilter } from "./messages.types";
export declare const messagesService: {
    list(ctx: WorkspaceContext, filter: MessageFilter): Promise<Message[]>;
    get(ctx: WorkspaceContext, id: string): Promise<Message>;
    send(ctx: WorkspaceContext, dto: SendMessageDto): Promise<Message>;
    retry(ctx: WorkspaceContext, id: string): Promise<Message>;
};
//# sourceMappingURL=messages.service.d.ts.map