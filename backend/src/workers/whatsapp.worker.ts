import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { whatsappService } from "../modules/whatsapp/whatsapp.service";
import type { WhatsAppOutboundJobData } from "../queues";

/**
 * Dedicated Redis connection for the BullMQ worker.
 * BullMQ workers need their own connection (blocking commands).
 */
function createWorkerRedis(): IORedis {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck:     false,
    lazyConnect:          false,
  });
}

export function startWhatsAppWorker(): Worker<WhatsAppOutboundJobData> {
  const connection = createWorkerRedis();

  const worker = new Worker<WhatsAppOutboundJobData>(
    "whatsapp-outbound",
    async (job) => {
      logger.info("WhatsApp worker: processing job", {
        jobId: job.id,
        messageId: job.data.messageId,
        attempt: job.attemptsMade + 1,
      });
      await whatsappService.processOutboundJob(job.data);
    },
    {
      connection,
      concurrency: 5,
      // Stale job timeout: if worker crashes mid-job, reclaim after 30s
      lockDuration: 30_000,
    },
  );

  worker.on("completed", (job) => {
    logger.info("WhatsApp worker: job completed", {
      jobId: job.id,
      messageId: job.data.messageId,
    });
  });

  worker.on("failed", (job, err) => {
    logger.error("WhatsApp worker: job failed", {
      jobId:     job?.id,
      messageId: job?.data?.messageId,
      attempt:   job?.attemptsMade,
      err,
    });
  });

  worker.on("error", (err) => {
    logger.error("WhatsApp worker: worker error", { err });
  });

  logger.info("WhatsApp worker started");
  return worker;
}
