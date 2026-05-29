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
import { getHealthReport } from "./lib/health";
import { whatsappRouter } from "./modules/whatsapp/whatsapp.routes";

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

// ── Webhooks (unversioned — external callers register these URLs) ───────────
// IMPORTANT: Never nest under /api/v* — changing the version forces
// re-registration with Meta / any external provider.
app.use("/webhooks/whatsapp", whatsappRouter);

// ── Health check ─────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  const report = await getHealthReport();
  const httpStatus = report.status === "unhealthy" ? 503 : 200;
  res.status(httpStatus).json(report);
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
