import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyAccessToken } from "../lib/jwt";
import { logger } from "../lib/logger";
import { env } from "../config/env";

export let io: SocketServer;

export function initSockets(httpServer: HttpServer): void {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(",").map((o: string) => o.trim()),
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // JWT auth guard for Socket.io connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = socket.data.user.sub;
    const workspaceId: string = socket.data.user.workspaceId;

    logger.info("Socket connected", { userId, socketId: socket.id });

    // Join workspace room — broadcasts scoped to workspace
    void socket.join(`workspace:${workspaceId}`);
    // Join personal room — for direct notifications
    void socket.join(`user:${userId}`);

    socket.on("conversation:join", (conversationId: string) => {
      void socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      void socket.leave(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { userId, socketId: socket.id });
    });
  });

  logger.info("Socket.io initialized");
}

// ── Emit helpers used by services ────────────────────────────

export const emitToWorkspace = (workspaceId: string, event: string, data: unknown): void => {
  io?.to(`workspace:${workspaceId}`).emit(event, data);
};

export const emitToConversation = (conversationId: string, event: string, data: unknown): void => {
  io?.to(`conversation:${conversationId}`).emit(event, data);
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  io?.to(`user:${userId}`).emit(event, data);
};
