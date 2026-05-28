"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, errors, json, colorize, simple } = winston_1.default.format;
const isDev = process.env.NODE_ENV !== "production";
exports.logger = winston_1.default.createLogger({
    level: isDev ? "debug" : "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), json()),
    defaultMeta: { service: "crm-backend" },
    transports: [
        new winston_1.default.transports.Console({
            format: isDev ? combine(colorize(), simple()) : json(),
        }),
    ],
});
// In production, add file transports or a log aggregator (Datadog, Logtail, etc.)
// new winston.transports.File({ filename: "logs/error.log", level: "error" })
//# sourceMappingURL=logger.js.map