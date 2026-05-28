import { followupsRepository } from "./followups.repository";
import { followupQueue } from "../../queues";
import { NotFoundError } from "../../lib/errors";
import { emitToWorkspace } from "../../sockets";
import { logger } from "../../lib/logger";
import type { WorkspaceContext, ListResult } from "../../types/common";
import type { Followup, CreateFollowupDto, UpdateFollowupDto, FollowupFilter, SnoozeFollowupDto } from "./followups.types";
import type { FollowupJobData } from "../../queues";

// ── BullMQ job helpers ────────────────────────────────────────

async function scheduleJob(
  followupId: string,
  workspaceId: string,
  conversationId: string | null,
  dueAt: string,
): Promise<void> {
  const delay = new Date(dueAt).getTime() - Date.now();
  if (delay <= 0) return; // already past due — no job needed

  const job = await followupQueue.add(
    "reminder",
    { followupId, workspaceId, conversationId } satisfies FollowupJobData,
    {
      delay,
      attempts:         1,
      removeOnComplete: { count: 200 },
      removeOnFail:     { count: 100 },
    },
  );

  if (job.id) {
    await followupsRepository.saveJobId(workspaceId, followupId, job.id);
  }

  logger.debug("followup: BullMQ job scheduled", {
    followupId, delay: Math.round(delay / 1000) + "s",
  });
}

async function removeJob(jobId: string): Promise<void> {
  try {
    const job = await followupQueue.getJob(jobId);
    if (job) await job.remove();
  } catch {
    // Job may already be processed/removed — non-fatal
  }
}

// ── Service ───────────────────────────────────────────────────

export const followupsService = {
  async list(ctx: WorkspaceContext, filter: FollowupFilter): Promise<ListResult<Followup>> {
    return followupsRepository.findAll(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<Followup> {
    const followup = await followupsRepository.findById(ctx, id);
    if (!followup) throw new NotFoundError("Followup");
    return followup;
  },

  async create(ctx: WorkspaceContext, dto: CreateFollowupDto): Promise<Followup> {
    const followup = await followupsRepository.create(ctx, dto);

    // Schedule reminder job
    await scheduleJob(
      followup.id,
      ctx.workspaceId,
      followup.conversation_id ?? null,
      followup.due_at,
    );

    emitToWorkspace(ctx.workspaceId, "followup:updated", followup);
    return followup;
  },

  async update(ctx: WorkspaceContext, id: string, dto: UpdateFollowupDto): Promise<Followup> {
    const existing = await followupsService.get(ctx, id);

    // If due_at is changing, reschedule the job
    if (dto.due_at && dto.due_at !== existing.due_at) {
      const oldJobId = existing.metadata?.job_id as string | undefined;
      if (oldJobId) await removeJob(oldJobId);
      const updated = await followupsRepository.update(ctx, id, dto);
      await scheduleJob(id, ctx.workspaceId, updated.conversation_id ?? null, updated.due_at);
      emitToWorkspace(ctx.workspaceId, "followup:updated", updated);
      return updated;
    }

    const updated = await followupsRepository.update(ctx, id, dto);
    emitToWorkspace(ctx.workspaceId, "followup:updated", updated);
    return updated;
  },

  async complete(ctx: WorkspaceContext, id: string): Promise<Followup> {
    const existing = await followupsService.get(ctx, id);

    // Remove pending job
    const jobId = existing.metadata?.job_id as string | undefined;
    if (jobId) await removeJob(jobId);

    const updated = await followupsRepository.update(ctx, id, {
      status:       "completed",
      completed_at: new Date().toISOString(),
      metadata:     { ...existing.metadata, job_id: undefined },
    });

    emitToWorkspace(ctx.workspaceId, "followup:updated", updated);
    return updated;
  },

  async snooze(ctx: WorkspaceContext, id: string, dto: SnoozeFollowupDto): Promise<Followup> {
    const existing = await followupsService.get(ctx, id);

    // Remove old job
    const oldJobId = existing.metadata?.job_id as string | undefined;
    if (oldJobId) await removeJob(oldJobId);

    const updated = await followupsRepository.update(ctx, id, {
      status:        "snoozed",
      snoozed_until: dto.snooze_until,
      due_at:        dto.snooze_until,
      metadata:      { ...existing.metadata, job_id: undefined },
    });

    // Schedule new job at snooze time
    await scheduleJob(id, ctx.workspaceId, updated.conversation_id ?? null, dto.snooze_until);

    emitToWorkspace(ctx.workspaceId, "followup:updated", updated);
    return updated;
  },

  async cancel(ctx: WorkspaceContext, id: string): Promise<Followup> {
    const existing = await followupsService.get(ctx, id);

    const jobId = existing.metadata?.job_id as string | undefined;
    if (jobId) await removeJob(jobId);

    const updated = await followupsRepository.update(ctx, id, {
      status:   "cancelled",
      metadata: { ...existing.metadata, job_id: undefined },
    });

    emitToWorkspace(ctx.workspaceId, "followup:updated", updated);
    return updated;
  },

  async delete(ctx: WorkspaceContext, id: string): Promise<void> {
    const existing = await followupsService.get(ctx, id);

    const jobId = existing.metadata?.job_id as string | undefined;
    if (jobId) await removeJob(jobId);

    await followupsRepository.softDelete(ctx, id);
  },

  // ── Worker entry point ────────────────────────────────────

  async processJob(data: FollowupJobData): Promise<void> {
    const followup = await followupsRepository.findByIdRaw(data.followupId);
    if (!followup) {
      logger.warn("followup: job fired for deleted followup", { followupId: data.followupId });
      return;
    }
    if (followup.status !== "pending" && followup.status !== "snoozed") {
      logger.debug("followup: job fired but followup already actioned", {
        followupId: data.followupId, status: followup.status,
      });
      return;
    }

    // Emit realtime alert to all workspace agents
    emitToWorkspace(data.workspaceId, "followup:due", followup);

    logger.info("followup: due notification emitted", {
      followupId: data.followupId,
      title:      followup.title,
    });
  },

  // ── Auto-cancel on inbound reply ──────────────────────────

  async cancelByConversation(
    workspaceId: string,
    conversationId: string,
  ): Promise<void> {
    const pending = await followupsRepository.findByConversationPending(workspaceId, conversationId);
    if (!pending.length) return;

    // Remove all BullMQ jobs
    await Promise.allSettled(
      pending
        .map((f) => f.metadata?.job_id as string | undefined)
        .filter(Boolean)
        .map((jobId) => removeJob(jobId!)),
    );

    const cancelled = await followupsRepository.cancelByConversation(workspaceId, conversationId);

    for (const f of cancelled) {
      emitToWorkspace(workspaceId, "followup:updated", f);
    }

    logger.info("followup: auto-cancelled on inbound reply", {
      conversationId,
      count: cancelled.length,
    });
  },
};
