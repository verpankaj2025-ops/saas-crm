import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
export declare let io: SocketServer;
export declare function initSockets(httpServer: HttpServer): void;
export declare const emitToWorkspace: (workspaceId: string, event: string, data: unknown) => void;
export declare const emitToConversation: (conversationId: string, event: string, data: unknown) => void;
export declare const emitToUser: (userId: string, event: string, data: unknown) => void;
//# sourceMappingURL=index.d.ts.map