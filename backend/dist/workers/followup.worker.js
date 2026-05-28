"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFollowupWorker = startFollowupWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const followups_service_1 = require("../modules/followups/followups.service");
function createWorkerRedis() {
    return new ioredis_1.default(env_1.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: false,
    });
}
function startFollowupWorker() {
    const connection = createWorkerRedis();
    const worker = new bullmq_1.Worker("followup-reminder", async (job) => {
        logger_1.logger.info("Followup worker: processing job", {
            jobId: job.id,
            followupId: job.data.followupId,
        });
        await followups_service_1.followupsService.processJob(job.data);
    }, {
        connection,
        concurrency: 10,
        lockDuration: 15_000,
    });
    worker.on("completed", (job) => {
        logger_1.logger.info("Followup worker: job completed", { jobId: job.id });
    });
    worker.on("failed", (job, err) => {
        logger_1.logger.error("Followup worker: job failed", { jobId: job?.id, err });
    });
    worker.on("error", (err) => {
        logger_1.logger.error("Followup worker: worker error", { err });
    });
    logger_1.logger.info("Followup worker started");
    return worker;
}
//# sourceMappingURL=followup.worker.js.map