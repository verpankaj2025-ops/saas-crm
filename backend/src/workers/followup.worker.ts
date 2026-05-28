import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { followupsService } from "../modules/followups/followups.service";
import type { FollowupJobData } from "../queues";

function createWorkerRedis(): IORedis {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck:     false,
    lazyConnect:          false,
  });
}

export function startFollowupWorker(): Worker<FollowupJobData> {
  const connection = createWorkerRedis();

  const worker = new Worker<FollowupJobData>(
    "followup-reminder",
    async (job) => {
      logger.info("Followup worker: processing job", {
        jobId:      job.id,
        followupId: job.data.followupId,
      });
      await followupsService.processJob(job.data);
    },
    {
      connection,
      concurrency: 10,
      lockDuration: 15_000,
    },
  );

  worker.on("completed", (job) => {
    logger.info("Followup worker: job completed", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Followup worker: job failed", { jobId: job?.id, err });
  });

  worker.on("error", (err) => {
    logger.error("Followup worker: worker error", { err });
  });

  logger.info("Followup worker started");
  return worker;
}
