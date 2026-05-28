"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAppointmentWorker = startAppointmentWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const appointments_service_1 = require("../modules/appointments/appointments.service");
function createWorkerRedis() {
    return new ioredis_1.default(env_1.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: false,
    });
}
function startAppointmentWorker() {
    const connection = createWorkerRedis();
    const worker = new bullmq_1.Worker("appointment-reminder", async (job) => {
        logger_1.logger.info("Appointment worker: processing job", {
            jobId: job.id,
            appointmentId: job.data.appointmentId,
            reminderType: job.data.reminderType,
        });
        await appointments_service_1.appointmentsService.processReminderJob(job.data);
    }, {
        connection,
        concurrency: 10,
        lockDuration: 15_000,
    });
    worker.on("completed", (job) => {
        logger_1.logger.info("Appointment worker: job completed", { jobId: job.id });
    });
    worker.on("failed", (job, err) => {
        logger_1.logger.error("Appointment worker: job failed", { jobId: job?.id, err });
    });
    worker.on("error", (err) => {
        logger_1.logger.error("Appointment worker: worker error", { err });
    });
    logger_1.logger.info("Appointment worker started");
    return worker;
}
//# sourceMappingURL=appointment.worker.js.map