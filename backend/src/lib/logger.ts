import winston from "winston";

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isDev = process.env.NODE_ENV !== "production";

export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: "crm-backend" },
  transports: [
    new winston.transports.Console({
      format: isDev ? combine(colorize(), simple()) : json(),
    }),
  ],
});

// In production, add file transports or a log aggregator (Datadog, Logtail, etc.)
// new winston.transports.File({ filename: "logs/error.log", level: "error" })
