import { Server as SocketServer, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyAccessToken } from "../lib/jwt";
import { logger } from "../lib/logger";
import { env } from "../config/env";

// ── Security / tuning constants ───────────────────────────────

const MAX_CONVERSATION_ROOMS = 10;      // max rooms per socket
const RATE_WINDOW_MS         = 10_000; // sliding window: 10 s
const RATE_MAX_EVENTS        = 20;     // max join/leave events per window
const MAX_FRAME_BYTES        = 10_240; // 10 KB frame limit

// Production-tuned ping settings. Defaults (25 s / 20 s) are
// usually fine; these are explicit for visibility.
const PING_INTERVAL_MS  = 25_000;
const PING_TIMEOUT_MS   = 20_000;
const CONNECT_TIMEOUT_MS = 10_000;

// ── UUID v4 guard ─────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(val: unknown): val is string {
  return typeof val === "string" && UUID_RE.test(val);
}

// ── Per-socket sliding-window rate limiter ────────────────────

interface RateEntry { count: number; resetAt: number }

const rateLimiterStore = new Map<string, RateEntry>();

function checkRateLimit(socketId: string): boolean {
  const now   = Date.now();
  const entry = rateLimiterStore.get(socketId);

  if (!entry || now >= entry.resetAt) {
    rateLimiterStore.set(socketId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_MAX_EVENTS) return false;
  entry.count++;
  return true;
}

// ── Per-socket conversation room tracker ──────────────────────
// Own Set instead of relying on socket.rooms so we can enforce
// the cap and do idempotent joins cheaply.

const socketConvRooms = new Map<string, Set<string>>();

function getConvRooms(socketId: string): Set<string> {
  let rooms = socketConvRooms.get(socketId);
  if (!rooms) { rooms = new Set(); socketConvRooms.set(socketId, rooms); }
  return rooms;
}

// ── Multi-tab session tracker ─────────────────────────────────
// userId → Set<socketId>
// Lets us log concurrent sessions and detect ghost connections.

const userSessions = new Map<string, Set<string>>();

function registerSession(userId: string, socketId: string): void {
  let sessions = userSessions.get(userId);
  if (!sessions) { sessions = new Set(); userSessions.set(userId, sessions); }
  sessions.add(socketId);
}

function unregisterSession(userId: string, socketId: string): void {
  const sessions = userSessions.get(userId);
  if (!sessions) return;
  sessions.delete(socketId);
  if (sessions.size === 0) userSessions.delete(userId);
}

function sessionCount(userId: string): number {
  return userSessions.get(userId)?.size ?? 0;
}

// ── Full socket cleanup ───────────────────────────────────────

function cleanupSocket(userId: string, socketId: string): void {
  rateLimiterStore.delete(socketId);
  socketConvRooms.delete(socketId);
  unregisterSession(userId, socketId);
}

// ── Per-socket connection handler ─────────────────────────────

function handleConnection(socket: Socket): void {
  const userId: string      = socket.data.user.sub;
  const workspaceId: string = socket.data.user.workspaceId;

  registerSession(userId, socket.id);

  logger.info("Socket connected", {
    userId,
    socketId:    socket.id,
    sessions:    sessionCount(userId),
    transport:   socket.conn.transport.name,
  });

  // Workspace + personal rooms are auto-joined on connect.
  // These are stable for the lifetime of the socket — no client action needed.
  void socket.join(`workspace:${workspaceId}`);
  void socket.join(`user:${userId}`);

  // Ack the client so it knows it can start emitting join events.
  socket.emit("connected", { socketId: socket.id });

  // ── conversation:join ───────────────────────────────────
  socket.on("conversation:join", (conversationId: unknown) => {
    if (!checkRateLimit(socket.id)) {
      logger.warn("Socket rate limited", { userId, event: "conversation:join" });
      socket.emit("error", { code: "RATE_LIMITED", message: "Too many requests — slow down" });
      return;
    }

    if (!isUUID(conversationId)) {
      logger.warn("Socket: invalid conversationId payload", { userId, conversationId });
      socket.emit("error", { code: "INVALID_PAYLOAD", message: "conversationId must be a valid UUID" });
      return;
    }

    const rooms = getConvRooms(socket.id);

    // Idempotent: already joined — skip to avoid redundant socket.join calls
    if (rooms.has(conversationId)) {
      logger.debug("Socket: already in conversation room", { userId, conversationId });
      return;
    }

    if (rooms.size >= MAX_CONVERSATION_ROOMS) {
      logger.warn("Socket: room join cap reached", { userId, roomCount: rooms.size });
      socket.emit("error", { code: "ROOM_LIMIT", message: "Maximum conversation rooms reached" });
      return;
    }

    rooms.add(conversationId);
    void socket.join(`conversation:${conversationId}`);
    logger.debug("Socket: joined conversation room", { userId, conversationId, roomCount: rooms.size });
  });

  // ── conversation:leave ──────────────────────────────────
  socket.on("conversation:leave", (conversationId: unknown) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit("error", { code: "RATE_LIMITED", message: "Too many requests — slow down" });
      return;
    }

    if (!isUUID(conversationId)) {
      socket.emit("error", { code: "INVALID_PAYLOAD", message: "conversationId must be a valid UUID" });
      return;
    }

    getConvRooms(socket.id).delete(conversationId);
    void socket.leave(`conversation:${conversationId}`);
    logger.debug("Socket: left conversation room", { userId, conversationId });
  });

  // ── socket-level error ──────────────────────────────────
  socket.on("error", (err: Error) => {
    logger.error("Socket error", { userId, socketId: socket.id, message: err.message });
  });

  // ── disconnect ──────────────────────────────────────────
  // Fires after Socket.io has already removed the socket from all rooms.
  // `reason` disambiguates: "transport close" (network), "server namespace disconnect"
  // (server-initiated), "client namespace disconnect" (clean client close), etc.
  socket.on("disconnect", (reason: string) => {
    const roomsHeld = getConvRooms(socket.id).size;
    cleanupSocket(userId, socket.id);

    logger.info("Socket disconnected", {
      userId,
      socketId:          socket.id,
      reason,
      roomsHeld,
      remainingSessions: sessionCount(userId),
    });
  });
}

// ── Socket.io server ──────────────────────────────────────────

export let io: SocketServer;

export function initSockets(httpServer: HttpServer): void {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(",").map((o: string) => o.trim()),
      credentials: true,
    },
    transports:        ["websocket", "polling"],
    maxHttpBufferSize: MAX_FRAME_BYTES,
    pingInterval:      PING_INTERVAL_MS,
    pingTimeout:       PING_TIMEOUT_MS,
    connectTimeout:    CONNECT_TIMEOUT_MS,
  });

  // ── Engine-level error (pre-auth transport errors) ────────
  io.engine.on("connection_error", (err: { code: number; message: string; context: unknown }) => {
    logger.warn("Socket engine connection error", { code: err.code, message: err.message });
  });

  // ── Auth middleware ───────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired auth token"));
    }
  });

  // ── Connection handler ────────────────────────────────────
  io.on("connection", (socket) => {
    try {
      handleConnection(socket);
    } catch (err) {
      logger.error("Socket: unhandled error in connection setup", {
        socketId: socket.id,
        err,
      });
      socket.disconnect(true);
    }
  });

  logger.info("Socket.io initialized", {
    pingInterval: PING_INTERVAL_MS,
    pingTimeout:  PING_TIMEOUT_MS,
    maxFrameKB:   MAX_FRAME_BYTES / 1024,
  });
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
