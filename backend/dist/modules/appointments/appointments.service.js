"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentsService = void 0;
const appointments_repository_1 = require("./appointments.repository");
const queues_1 = require("../../queues");
const errors_1 = require("../../lib/errors");
const sockets_1 = require("../../sockets");
const logger_1 = require("../../lib/logger");
// ── BullMQ job helpers ────────────────────────────────────────
async function scheduleReminders(appointmentId, workspaceId, contactId, startAt) {
    const start = new Date(startAt).getTime();
    const now = Date.now();
    const delay24h = start - (24 * 60 * 60 * 1000);
    const delay2h = start - (2 * 60 * 60 * 1000);
    // If appointment is already past, no reminders needed
    if (start <= now)
        return null;
    const jobs = [];
    if (delay24h > now)
        jobs.push({ type: "24h", delay: delay24h - now });
    if (delay2h > now)
        jobs.push({ type: "2h", delay: delay2h - now });
    if (jobs.length === 0)
        return null;
    const job24h = jobs.find((j) => j.type === "24h");
    const job2h = jobs.find((j) => j.type === "2h");
    const job24hId = job24h
        ? (await queues_1.appointmentReminderQueue.add("reminder-24h", { appointmentId, workspaceId, contactId, reminderType: "24h" }, {
            delay: job24h.delay,
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: { count: 200 },
            removeOnFail: { count: 100 },
        })).id
        : null;
    const job2hId = job2h
        ? (await queues_1.appointmentReminderQueue.add("reminder-2h", { appointmentId, workspaceId, contactId, reminderType: "2h" }, {
            delay: job2h.delay,
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: { count: 200 },
            removeOnFail: { count: 100 },
        })).id
        : null;
    logger_1.logger.debug("appointment: BullMQ reminder jobs scheduled", {
        appointmentId,
        job24hId,
        job2hId,
    });
    return { job24hId: job24hId ?? "", job2hId: job2hId ?? "" };
}
async function removeJob(jobId) {
    try {
        const job = await queues_1.appointmentReminderQueue.getJob(jobId);
        if (job)
            await job.remove();
    }
    catch {
        // Job may already be processed/removed — non-fatal
    }
}
// ── Service ───────────────────────────────────────────────────
exports.appointmentsService = {
    async list(ctx, filter) {
        return appointments_repository_1.appointmentsRepository.findAll(ctx, filter);
    },
    async get(ctx, id) {
        const appointment = await appointments_repository_1.appointmentsRepository.findById(ctx, id);
        if (!appointment)
            throw new errors_1.NotFoundError("Appointment");
        // Load reminders for this appointment
        const reminders = await appointments_repository_1.appointmentsRepository.findRemindersByAppointment(ctx, id);
        return { ...appointment, reminders };
    },
    async create(ctx, dto) {
        const appointment = await appointments_repository_1.appointmentsRepository.create(ctx, dto);
        // Create reminder records in database
        const start = new Date(appointment.start_at).getTime();
        const now = Date.now();
        const reminder24hScheduled = new Date(start - (24 * 60 * 60 * 1000)).toISOString();
        const reminder2hScheduled = new Date(start - (2 * 60 * 60 * 1000)).toISOString();
        if (reminder24hScheduled > new Date().toISOString()) {
            await appointments_repository_1.appointmentsRepository.createReminder(ctx, {
                appointment_id: appointment.id,
                reminder_type: "24h",
                scheduled_for: reminder24hScheduled,
            });
        }
        if (reminder2hScheduled > new Date().toISOString()) {
            await appointments_repository_1.appointmentsRepository.createReminder(ctx, {
                appointment_id: appointment.id,
                reminder_type: "2h",
                scheduled_for: reminder2hScheduled,
            });
        }
        // Schedule BullMQ reminder jobs (24h before, 2h before)
        const jobIds = await scheduleReminders(appointment.id, ctx.workspaceId, appointment.contact_id, appointment.start_at);
        if (jobIds) {
            await appointments_repository_1.appointmentsRepository.saveJobIds(ctx.workspaceId, appointment.id, jobIds.job24hId, jobIds.job2hId);
        }
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "appointment:created", appointment);
        return appointment;
    },
    async update(ctx, id, dto) {
        const existing = await exports.appointmentsService.get(ctx, id);
        // If start_at is changing, reschedule reminders
        if (dto.start_at && dto.start_at !== existing.start_at) {
            const oldJob24hId = existing.metadata?.job_24h;
            const oldJob2hId = existing.metadata?.job_2h;
            if (oldJob24hId)
                await removeJob(oldJob24hId);
            if (oldJob2hId)
                await removeJob(oldJob2hId);
            // Cancel existing reminders
            await appointments_repository_1.appointmentsRepository.cancelRemindersForAppointment(ctx, id);
            const updated = await appointments_repository_1.appointmentsRepository.update(ctx, id, dto);
            // Create new reminder records
            const start = new Date(updated.start_at).getTime();
            const reminder24hScheduled = new Date(start - (24 * 60 * 60 * 1000)).toISOString();
            const reminder2hScheduled = new Date(start - (2 * 60 * 60 * 1000)).toISOString();
            if (reminder24hScheduled > new Date().toISOString()) {
                await appointments_repository_1.appointmentsRepository.createReminder(ctx, {
                    appointment_id: updated.id,
                    reminder_type: "24h",
                    scheduled_for: reminder24hScheduled,
                });
            }
            if (reminder2hScheduled > new Date().toISOString()) {
                await appointments_repository_1.appointmentsRepository.createReminder(ctx, {
                    appointment_id: updated.id,
                    reminder_type: "2h",
                    scheduled_for: reminder2hScheduled,
                });
            }
            const jobIds = await scheduleReminders(id, ctx.workspaceId, updated.contact_id, updated.start_at);
            if (jobIds) {
                await appointments_repository_1.appointmentsRepository.saveJobIds(ctx.workspaceId, id, jobIds.job24hId, jobIds.job2hId);
            }
            (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "appointment:updated", updated);
            return updated;
        }
        const updated = await appointments_repository_1.appointmentsRepository.update(ctx, id, dto);
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "appointment:updated", updated);
        return updated;
    },
    async cancel(ctx, id) {
        const existing = await exports.appointmentsService.get(ctx, id);
        // Remove pending reminder jobs
        const oldJob24hId = existing.metadata?.job_24h;
        const oldJob2hId = existing.metadata?.job_2h;
        if (oldJob24hId)
            await removeJob(oldJob24hId);
        if (oldJob2hId)
            await removeJob(oldJob2hId);
        // Cancel reminder records
        await appointments_repository_1.appointmentsRepository.cancelRemindersForAppointment(ctx, id);
        const updated = await appointments_repository_1.appointmentsRepository.update(ctx, id, {
            status: "cancelled",
            metadata: { ...existing.metadata, job_24h: undefined, job_2h: undefined },
        });
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "appointment:updated", updated);
        return updated;
    },
    async complete(ctx, id) {
        const existing = await exports.appointmentsService.get(ctx, id);
        const oldJob24hId = existing.metadata?.job_24h;
        const oldJob2hId = existing.metadata?.job_2h;
        if (oldJob24hId)
            await removeJob(oldJob24hId);
        if (oldJob2hId)
            await removeJob(oldJob2hId);
        // Cancel reminder records
        await appointments_repository_1.appointmentsRepository.cancelRemindersForAppointment(ctx, id);
        const updated = await appointments_repository_1.appointmentsRepository.update(ctx, id, {
            status: "completed",
            metadata: { ...existing.metadata, job_24h: undefined, job_2h: undefined },
        });
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "appointment:updated", updated);
        return updated;
    },
    async delete(ctx, id) {
        const existing = await exports.appointmentsService.get(ctx, id);
        const oldJob24hId = existing.metadata?.job_24h;
        const oldJob2hId = existing.metadata?.job_2h;
        if (oldJob24hId)
            await removeJob(oldJob24hId);
        if (oldJob2hId)
            await removeJob(oldJob2hId);
        await appointments_repository_1.appointmentsRepository.softDelete(ctx, id);
    },
    // ── Reminder management ────────────────────────────────────
    async getReminders(ctx, appointmentId) {
        return appointments_repository_1.appointmentsRepository.findRemindersByAppointment(ctx, appointmentId);
    },
    // ── Worker entry point ────────────────────────────────────
    async processReminderJob(data) {
        const appointment = await appointments_repository_1.appointmentsRepository.findByIdRaw(data.appointmentId);
        if (!appointment) {
            logger_1.logger.warn("appointment: reminder job fired for deleted appointment", { appointmentId: data.appointmentId });
            return;
        }
        if (appointment.status !== "scheduled" && appointment.status !== "confirmed") {
            logger_1.logger.debug("appointment: reminder job fired but appointment not active", {
                appointmentId: data.appointmentId,
                status: appointment.status,
            });
            return;
        }
        // Find the reminder record
        const reminder = await appointments_repository_1.appointmentsRepository.findRemindersByAppointment({ workspaceId: data.workspaceId, userId: "", role: "agent" }, data.appointmentId).then((reminders) => reminders.find((r) => r.reminder_type === data.reminderType));
        if (!reminder) {
            logger_1.logger.warn("appointment: reminder record not found", { appointmentId: data.appointmentId, reminderType: data.reminderType });
            return;
        }
        if (reminder.status !== "scheduled") {
            logger_1.logger.debug("appointment: reminder already processed", { reminderId: reminder.id, status: reminder.status });
            return;
        }
        // Update reminder status to sent
        await appointments_repository_1.appointmentsRepository.updateReminder({ workspaceId: data.workspaceId, userId: "", role: "agent" }, reminder.id, { status: "sent", sent_at: new Date().toISOString() });
        // Mark reminder as sent on appointment (legacy field)
        await appointments_repository_1.appointmentsRepository.markReminderSent(data.workspaceId, data.appointmentId);
        // Emit realtime alert to workspace
        (0, sockets_1.emitToWorkspace)(data.workspaceId, "appointment:reminder", {
            appointment,
            reminderType: data.reminderType,
        });
        // WhatsApp reminder sending (opportunistic — best effort)
        // Only if contact has phone and workspace has WhatsApp channel
        try {
            const { sendWhatsAppText } = await Promise.resolve().then(() => __importStar(require("../whatsapp/whatsapp.client")));
            const { db } = await Promise.resolve().then(() => __importStar(require("../../config/supabase")));
            // Find WhatsApp channel for workspace
            const { data: channel } = await db
                .from("channels")
                .select("id,config")
                .eq("workspace_id", data.workspaceId)
                .eq("type", "whatsapp")
                .eq("is_active", true)
                .is("deleted_at", null)
                .maybeSingle();
            if (!channel) {
                logger_1.logger.debug("appointment: no active WhatsApp channel for workspace", { workspaceId: data.workspaceId });
                return;
            }
            const config = channel.config;
            if (!config.phone_number_id || !config.access_token)
                return;
            if (!appointment.contact?.phone) {
                logger_1.logger.debug("appointment: contact has no phone for WhatsApp reminder", { contactId: data.contactId });
                return;
            }
            const message = data.reminderType === "24h"
                ? `Reminder: You have an appointment "${appointment.title}" tomorrow at ${new Date(appointment.start_at).toLocaleTimeString()}.`
                : `Reminder: Your appointment "${appointment.title}" starts in 2 hours at ${new Date(appointment.start_at).toLocaleTimeString()}.`;
            await sendWhatsAppText(config.phone_number_id, config.access_token, appointment.contact.phone, message);
            // Update reminder status to completed
            await appointments_repository_1.appointmentsRepository.updateReminder({ workspaceId: data.workspaceId, userId: "", role: "agent" }, reminder.id, { status: "completed", completed_at: new Date().toISOString() });
            logger_1.logger.info("appointment: WhatsApp reminder sent", {
                appointmentId: data.appointmentId,
                reminderType: data.reminderType,
            });
        }
        catch (err) {
            logger_1.logger.warn("appointment: failed to send WhatsApp reminder", {
                appointmentId: data.appointmentId,
                reminderType: data.reminderType,
                err,
            });
            // Update reminder status to failed
            await appointments_repository_1.appointmentsRepository.updateReminder({ workspaceId: data.workspaceId, userId: "", role: "agent" }, reminder.id, {
                status: "failed",
                failed_reason: err instanceof Error ? err.message : "Unknown error",
                retry_count: reminder.retry_count + 1,
            });
        }
        logger_1.logger.info("appointment: reminder processed", {
            appointmentId: data.appointmentId,
            reminderType: data.reminderType,
        });
    },
};
//# sourceMappingURL=appointments.service.js.map