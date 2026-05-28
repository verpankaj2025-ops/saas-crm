"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const error_middleware_1 = require("./middleware/error.middleware");
const rate_limit_middleware_1 = require("./middleware/rate-limit.middleware");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
// ── Security ────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGINS.split(",").map((o) => o.trim()),
    credentials: true,
}));
// ── Parsing + compression ────────────────────────────────────
app.use(express_1.default.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
// ── Logging ──────────────────────────────────────────────────
app.use((0, morgan_1.default)("combined", {
    stream: { write: (msg) => logger_1.logger.info(msg.trim()) },
    skip: () => env_1.env.NODE_ENV === "test",
}));
// ── Rate limiting ────────────────────────────────────────────
app.use("/api", rate_limit_middleware_1.apiLimiter);
// ── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ── API routes ───────────────────────────────────────────────
app.use("/api/v1", routes_1.apiRouter);
// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found", code: "NOT_FOUND" });
});
// ── Centralized error handler ────────────────────────────────
app.use(error_middleware_1.errorMiddleware);
//# sourceMappingURL=app.js.map