"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUser = exports.emitToConversation = exports.emitToWorkspace = exports.io = void 0;
exports.initSockets = initSockets;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../lib/jwt");
const logger_1 = require("../lib/logger");
const env_1 = require("../config/env");
function initSockets(httpServer) {
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.CORS_ORIGINS.split(",").map((o) => o.trim()),
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });
    // JWT auth guard for Socket.io connections
    exports.io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error("Missing auth token"));
        try {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            socket.data.user = payload;
            next();
        }
        catch {
            next(new Error("Invalid auth token"));
        }
    });
    exports.io.on("connection", (socket) => {
        const userId = socket.data.user.sub;
        const workspaceId = socket.data.user.workspaceId;
        logger_1.logger.info("Socket connected", { userId, socketId: socket.id });
        // Join workspace room — broadcasts scoped to workspace
        void socket.join(`workspace:${workspaceId}`);
        // Join personal room — for direct notifications
        void socket.join(`user:${userId}`);
        socket.on("conversation:join", (conversationId) => {
            void socket.join(`conversation:${conversationId}`);
        });
        socket.on("conversation:leave", (conversationId) => {
            void socket.leave(`conversation:${conversationId}`);
        });
        socket.on("disconnect", () => {
            logger_1.logger.info("Socket disconnected", { userId, socketId: socket.id });
        });
    });
    logger_1.logger.info("Socket.io initialized");
}
// ── Emit helpers used by services ────────────────────────────
const emitToWorkspace = (workspaceId, event, data) => {
    exports.io?.to(`workspace:${workspaceId}`).emit(event, data);
};
exports.emitToWorkspace = emitToWorkspace;
const emitToConversation = (conversationId, event, data) => {
    exports.io?.to(`conversation:${conversationId}`).emit(event, data);
};
exports.emitToConversation = emitToConversation;
const emitToUser = (userId, event, data) => {
    exports.io?.to(`user:${userId}`).emit(event, data);
};
exports.emitToUser = emitToUser;
//# sourceMappingURL=index.js.map