"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentReminderQueue = exports.followupQueue = exports.whatsappQueue = exports.aiQueue = exports.automationQueue = exports.broadcastQueue = exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const logger_1 = require("../lib/logger");
const connection = redis_1.redis;
// ── Queue definitions ────────────────────────────────────────
exports.emailQueue = new bullmq_1.Queue("email", { connection });
exports.broadcastQueue = new bullmq_1.Queue("broadcast", { connection });
exports.automationQueue = new bullmq_1.Queue("automation", { connection });
exports.aiQueue = new bullmq_1.Queue("ai", { connection });
exports.whatsappQueue = new bullmq_1.Queue("whatsapp-outbound", { connection });
exports.followupQueue = new bullmq_1.Queue("followup-reminder", { connection });
exports.appointmentReminderQueue = new bullmq_1.Queue("appointment-reminder", { connection });
logger_1.logger.info("BullMQ queues initialized", {
    queues: ["email", "broadcast", "automation", "ai", "whatsapp-outbound", "followup-reminder", "appointment-reminder"],
});
//# sourceMappingURL=index.js.map