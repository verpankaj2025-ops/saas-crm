"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.followupsService = void 0;
const followups_repository_1 = require("./followups.repository");
const queues_1 = require("../../queues");
const errors_1 = require("../../lib/errors");
const sockets_1 = require("../../sockets");
const logger_1 = require("../../lib/logger");
// ── BullMQ job helpers ────────────────────────────────────────
async function scheduleJob(followupId, workspaceId, conversationId, dueAt) {
    const delay = new Date(dueAt).getTime() - Date.now();
    if (delay <= 0)
        return; // already past due — no job needed
    const job = await queues_1.followupQueue.add("reminder", { followupId, workspaceId, conversationId }, {
        delay,
        attempts: 1,
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
    });
    if (job.id) {
        await followups_repository_1.followupsRepository.saveJobId(workspaceId, followupId, job.id);
    }
    logger_1.logger.debug("followup: BullMQ job scheduled", {
        followupId, delay: Math.round(delay / 1000) + "s",
    });
}
async function removeJob(jobId) {
    try {
        const job = await queues_1.followupQueue.getJob(jobId);
        if (job)
            await job.remove();
    }
    catch {
        // Job may already be processed/removed — non-fatal
    }
}
// ── Service ───────────────────────────────────────────────────
exports.followupsService = {
    async list(ctx, filter) {
        return followups_repository_1.followupsRepository.findAll(ctx, filter);
    },
    async get(ctx, id) {
        const followup = await followups_repository_1.followupsRepository.findById(ctx, id);
        if (!followup)
            throw new errors_1.NotFoundError("Followup");
        return followup;
    },
    async create(ctx, dto) {
        const followup = await followups_repository_1.followupsRepository.create(ctx, dto);
        // Schedule reminder job
        await scheduleJob(followup.id, ctx.workspaceId, followup.conversation_id ?? null, followup.due_at);
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "followup:updated", followup);
        return followup;
    },
    async update(ctx, id, dto) {
        const existing = await exports.followupsService.get(ctx, id);
        // If due_at is changing, reschedule the job
        if (dto.due_at && dto.due_at !== existing.due_at) {
            const oldJobId = existing.metadata?.job_id;
            if (oldJobId)
                await removeJob(oldJobId);
            const updated = await followups_repository_1.followupsRepository.update(ctx, id, dto);
            await scheduleJob(id, ctx.workspaceId, updated.conversation_id ?? null, updated.due_at);
            (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "followup:updated", updated);
            return updated;
        }
        const updated = await followups_repository_1.followupsRepository.update(ctx, id, dto);
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "followup:updated", updated);
        return updated;
    },
    async complete(ctx, id) {
        const existing = await exports.followupsService.get(ctx, id);
        // Remove pending job
        const jobId = existing.metadata?.job_id;
        if (jobId)
            await removeJob(jobId);
        const updated = await followups_repository_1.followupsRepository.update(ctx, id, {
            status: "completed",
            completed_at: new Date().toISOString(),
            metadata: { ...existing.metadata, job_id: undefined },
        });
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "followup:updated", updated);
        return updated;
    },
    async snooze(ctx, id, dto) {
        const existing = await exports.followupsService.get(ctx, id);
        // Remove old job
        const oldJobId = existing.metadata?.job_id;
        if (oldJobId)
            await removeJob(oldJobId);
        const updated = await followups_repository_1.followupsRepository.update(ctx, id, {
            status: "snoozed",
            snoozed_until: dto.snooze_until,
            due_at: dto.snooze_until,
            metadata: { ...existing.metadata, job_id: undefined },
        });
        // Schedule new job at snooze time
        await scheduleJob(id, ctx.workspaceId, updated.conversation_id ?? null, dto.snooze_until);
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "followup:updated", updated);
        return updated;
    },
    async cancel(ctx, id) {
        const existing = await exports.followupsService.get(ctx, id);
        const jobId = existing.metadata?.job_id;
        if (jobId)
            await removeJob(jobId);
        const updated = await followups_repository_1.followupsRepository.update(ctx, id, {
            status: "cancelled",
            metadata: { ...existing.metadata, job_id: undefined },
        });
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "followup:updated", updated);
        return updated;
    },
    async delete(ctx, id) {
        const existing = await exports.followupsService.get(ctx, id);
        const jobId = existing.metadata?.job_id;
        if (jobId)
            await removeJob(jobId);
        await followups_repository_1.followupsRepository.softDelete(ctx, id);
    },
    // ── Worker entry point ────────────────────────────────────
    async processJob(data) {
        const followup = await followups_repository_1.followupsRepository.findByIdRaw(data.followupId);
        if (!followup) {
            logger_1.logger.warn("followup: job fired for deleted followup", { followupId: data.followupId });
            return;
        }
        if (followup.status !== "pending" && followup.status !== "snoozed") {
            logger_1.logger.debug("followup: job fired but followup already actioned", {
                followupId: data.followupId, status: followup.status,
            });
            return;
        }
        // Emit realtime alert to all workspace agents
        (0, sockets_1.emitToWorkspace)(data.workspaceId, "followup:due", followup);
        logger_1.logger.info("followup: due notification emitted", {
            followupId: data.followupId,
            title: followup.title,
        });
    },
    // ── Auto-cancel on inbound reply ──────────────────────────
    async cancelByConversation(workspaceId, conversationId) {
        const pending = await followups_repository_1.followupsRepository.findByConversationPending(workspaceId, conversationId);
        if (!pending.length)
            return;
        // Remove all BullMQ jobs
        await Promise.allSettled(pending
            .map((f) => f.metadata?.job_id)
            .filter(Boolean)
            .map((jobId) => removeJob(jobId)));
        const cancelled = await followups_repository_1.followupsRepository.cancelByConversation(workspaceId, conversationId);
        for (const f of cancelled) {
            (0, sockets_1.emitToWorkspace)(workspaceId, "followup:updated", f);
        }
        logger_1.logger.info("followup: auto-cancelled on inbound reply", {
            conversationId,
            count: cancelled.length,
        });
    },
};
//# sourceMappingURL=followups.service.js.map