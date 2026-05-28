import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { errorMiddleware } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import { apiRouter } from "./routes";

const app = express();

// ── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(",").map((o: string) => o.trim()),
    credentials: true,
  })
);

// ── Parsing + compression ────────────────────────────────────
app.use(express.json({
  limit: "10mb",
  verify: (req, _res, buf) => {
    (req as import("express").Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ── Logging ──────────────────────────────────────────────────
app.use(
  morgan("combined", {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
    skip: () => env.NODE_ENV === "test",
  })
);

// ── Rate limiting ────────────────────────────────────────────
app.use("/api", apiLimiter);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API routes ───────────────────────────────────────────────
app.use("/api/v1", apiRouter);

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found", code: "NOT_FOUND" });
});

// ── Centralized error handler ────────────────────────────────
app.use(errorMiddleware);

export { app };
