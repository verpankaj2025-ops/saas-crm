import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { appointmentsService } from "../modules/appointments/appointments.service";
import type { AppointmentReminderJobData } from "../queues";

function createWorkerRedis(): IORedis {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck:     false,
    lazyConnect:          false,
  });
}

export function startAppointmentWorker(): Worker<AppointmentReminderJobData> {
  const connection = createWorkerRedis();

  const worker = new Worker<AppointmentReminderJobData>(
    "appointment-reminder",
    async (job) => {
      logger.info("Appointment worker: processing job", {
        jobId:         job.id,
        appointmentId: job.data.appointmentId,
        reminderType:  job.data.reminderType,
      });
      await appointmentsService.processReminderJob(job.data);
    },
    {
      connection,
      concurrency: 10,
      lockDuration: 15_000,
    },
  );

  worker.on("completed", (job) => {
    logger.info("Appointment worker: job completed", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Appointment worker: job failed", { jobId: job?.id, err });
  });

  worker.on("error", (err) => {
    logger.error("Appointment worker: worker error", { err });
  });

  logger.info("Appointment worker started");
  return worker;
}
