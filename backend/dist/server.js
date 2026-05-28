"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const sockets_1 = require("./sockets");
const redis_1 = require("./config/redis");
const whatsapp_worker_1 = require("./workers/whatsapp.worker");
const followup_worker_1 = require("./workers/followup.worker");
const appointment_worker_1 = require("./workers/appointment.worker");
const server = http_1.default.createServer(app_1.app);
let whatsappWorker = null;
let followupWorker = null;
let appointmentWorker = null;
(0, sockets_1.initSockets)(server);
async function start() {
    try {
        await redis_1.redis.connect();
        whatsappWorker = (0, whatsapp_worker_1.startWhatsAppWorker)();
        followupWorker = (0, followup_worker_1.startFollowupWorker)();
        appointmentWorker = (0, appointment_worker_1.startAppointmentWorker)();
        server.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 CRM Backend running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
        });
    }
    catch (err) {
        logger_1.logger.error("Failed to start server", { err });
        process.exit(1);
    }
}
// Graceful shutdown
const shutdown = async (signal) => {
    logger_1.logger.info(`${signal} received — shutting down`);
    await whatsappWorker?.close();
    await followupWorker?.close();
    await appointmentWorker?.close();
    server.close(async () => {
        await redis_1.redis.quit();
        logger_1.logger.info("Server closed");
        process.exit(0);
    });
};
process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT", () => { void shutdown("SIGINT"); });
process.on("unhandledRejection", (err) => {
    logger_1.logger.error("Unhandled rejection", { err });
    process.exit(1);
});
void start();
//# sourceMappingURL=server.js.map