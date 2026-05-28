import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { initSockets } from "./sockets";
import { redis } from "./config/redis";
import { startWhatsAppWorker } from "./workers/whatsapp.worker";
import { startFollowupWorker } from "./workers/followup.worker";
import { startAppointmentWorker } from "./workers/appointment.worker";
import type { Worker } from "bullmq";

const server = http.createServer(app);
let whatsappWorker: Worker | null = null;
let followupWorker: Worker | null = null;
let appointmentWorker: Worker | null = null;

initSockets(server);

async function start(): Promise<void> {
  try {
    await redis.connect();

    whatsappWorker   = startWhatsAppWorker();
    followupWorker    = startFollowupWorker();
    appointmentWorker = startAppointmentWorker();

    server.listen(env.PORT, () => {
      logger.info(`🚀 CRM Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error("Failed to start server", { err });
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down`);
  await whatsappWorker?.close();
  await followupWorker?.close();
  await appointmentWorker?.close();
  server.close(async () => {
    await redis.quit();
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT",  () => { void shutdown("SIGINT"); });
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection", { err });
  process.exit(1);
});

void start();
