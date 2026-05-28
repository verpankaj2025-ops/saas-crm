"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWhatsAppWorker = startWhatsAppWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const whatsapp_service_1 = require("../modules/whatsapp/whatsapp.service");
/**
 * Dedicated Redis connection for the BullMQ worker.
 * BullMQ workers need their own connection (blocking commands).
 */
function createWorkerRedis() {
    return new ioredis_1.default(env_1.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: false,
    });
}
function startWhatsAppWorker() {
    const connection = createWorkerRedis();
    const worker = new bullmq_1.Worker("whatsapp-outbound", async (job) => {
        logger_1.logger.info("WhatsApp worker: processing job", {
            jobId: job.id,
            messageId: job.data.messageId,
            attempt: job.attemptsMade + 1,
        });
        await whatsapp_service_1.whatsappService.processOutboundJob(job.data);
    }, {
        connection,
        concurrency: 5,
        // Stale job timeout: if worker crashes mid-job, reclaim after 30s
        lockDuration: 30_000,
    });
    worker.on("completed", (job) => {
        logger_1.logger.info("WhatsApp worker: job completed", {
            jobId: job.id,
            messageId: job.data.messageId,
        });
    });
    worker.on("failed", (job, err) => {
        logger_1.logger.error("WhatsApp worker: job failed", {
            jobId: job?.id,
            messageId: job?.data?.messageId,
            attempt: job?.attemptsMade,
            err,
        });
    });
    worker.on("error", (err) => {
        logger_1.logger.error("WhatsApp worker: worker error", { err });
    });
    logger_1.logger.info("WhatsApp worker started");
    return worker;
}
//# sourceMappingURL=whatsapp.worker.js.map