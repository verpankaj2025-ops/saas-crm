import { appointmentsRepository } from "./appointments.repository";
import { appointmentReminderQueue } from "../../queues";
import { NotFoundError } from "../../lib/errors";
import { emitToWorkspace } from "../../sockets";
import { logger } from "../../lib/logger";
import type { WorkspaceContext, ListResult } from "../../types/common";
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto, AppointmentFilter, AppointmentReminder } from "./appointments.types";
import type { AppointmentReminderJobData } from "../../queues";

// ── BullMQ job helpers ────────────────────────────────────────

async function scheduleReminders(
  appointmentId: string,
  workspaceId: string,
  contactId: string,
  startAt: string,
): Promise<{ job24hId: string; job2hId: string } | null> {
  const start = new Date(startAt).getTime();
  const now = Date.now();
  const delay24h = start - (24 * 60 * 60 * 1000);
  const delay2h = start - (2 * 60 * 60 * 1000);

  // If appointment is already past, no reminders needed
  if (start <= now) return null;

  const jobs: { type: "24h" | "2h"; delay: number }[] = [];
  if (delay24h > now) jobs.push({ type: "24h", delay: delay24h - now });
  if (delay2h > now) jobs.push({ type: "2h", delay: delay2h - now });

  if (jobs.length === 0) return null;

  const job24h = jobs.find((j) => j.type === "24h");
  const job2h = jobs.find((j) => j.type === "2h");

  const job24hId = job24h
    ? (await appointmentReminderQueue.add(
        "reminder-24h",
        { appointmentId, workspaceId, contactId, reminderType: "24h" } satisfies AppointmentReminderJobData,
        {
          delay: job24h.delay,
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 100 },
        },
      )).id
    : null;

  const job2hId = job2h
    ? (await appointmentReminderQueue.add(
        "reminder-2h",
        { appointmentId, workspaceId, contactId, reminderType: "2h" } satisfies AppointmentReminderJobData,
        {
          delay: job2h.delay,
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 100 },
        },
      )).id
    : null;

  logger.debug("appointment: BullMQ reminder jobs scheduled", {
    appointmentId,
    job24hId,
    job2hId,
  });

  return { job24hId: job24hId ?? "", job2hId: job2hId ?? "" };
}

async function removeJob(jobId: string): Promise<void> {
  try {
    const job = await appointmentReminderQueue.getJob(jobId);
    if (job) await job.remove();
  } catch {
    // Job may already be processed/removed — non-fatal
  }
}

// ── Service ───────────────────────────────────────────────────

export const appointmentsService = {
  async list(ctx: WorkspaceContext, filter: AppointmentFilter): Promise<ListResult<Appointment>> {
    return appointmentsRepository.findAll(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<Appointment> {
    const appointment = await appointmentsRepository.findById(ctx, id);
    if (!appointment) throw new NotFoundError("Appointment");
    
    // Load reminders for this appointment
    const reminders = await appointmentsRepository.findRemindersByAppointment(ctx, id);
    return { ...appointment, reminders };
  },

  async create(ctx: WorkspaceContext, dto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = await appointmentsRepository.create(ctx, dto);

    // Create reminder records in database
    const start = new Date(appointment.start_at).getTime();
    const now = Date.now();
    
    const reminder24hScheduled = new Date(start - (24 * 60 * 60 * 1000)).toISOString();
    const reminder2hScheduled = new Date(start - (2 * 60 * 60 * 1000)).toISOString();

    if (reminder24hScheduled > new Date().toISOString()) {
      await appointmentsRepository.createReminder(ctx, {
        appointment_id: appointment.id,
        reminder_type: "24h",
        scheduled_for: reminder24hScheduled,
      });
    }

    if (reminder2hScheduled > new Date().toISOString()) {
      await appointmentsRepository.createReminder(ctx, {
        appointment_id: appointment.id,
        reminder_type: "2h",
        scheduled_for: reminder2hScheduled,
      });
    }

    // Schedule BullMQ reminder jobs (24h before, 2h before)
    const jobIds = await scheduleReminders(
      appointment.id,
      ctx.workspaceId,
      appointment.contact_id,
      appointment.start_at,
    );

    if (jobIds) {
      await appointmentsRepository.saveJobIds(ctx.workspaceId, appointment.id, jobIds.job24hId, jobIds.job2hId);
    }

    emitToWorkspace(ctx.workspaceId, "appointment:created", appointment);
    return appointment;
  },

  async update(ctx: WorkspaceContext, id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const existing = await appointmentsService.get(ctx, id);

    // If start_at is changing, reschedule reminders
    if (dto.start_at && dto.start_at !== existing.start_at) {
      const oldJob24hId = existing.metadata?.job_24h as string | undefined;
      const oldJob2hId = existing.metadata?.job_2h as string | undefined;
      if (oldJob24hId) await removeJob(oldJob24hId);
      if (oldJob2hId) await removeJob(oldJob2hId);

      // Cancel existing reminders
      await appointmentsRepository.cancelRemindersForAppointment(ctx, id);

      const updated = await appointmentsRepository.update(ctx, id, dto);
      
      // Create new reminder records
      const start = new Date(updated.start_at).getTime();
      const reminder24hScheduled = new Date(start - (24 * 60 * 60 * 1000)).toISOString();
      const reminder2hScheduled = new Date(start - (2 * 60 * 60 * 1000)).toISOString();

      if (reminder24hScheduled > new Date().toISOString()) {
        await appointmentsRepository.createReminder(ctx, {
          appointment_id: updated.id,
          reminder_type: "24h",
          scheduled_for: reminder24hScheduled,
        });
      }

      if (reminder2hScheduled > new Date().toISOString()) {
        await appointmentsRepository.createReminder(ctx, {
          appointment_id: updated.id,
          reminder_type: "2h",
          scheduled_for: reminder2hScheduled,
        });
      }

      const jobIds = await scheduleReminders(id, ctx.workspaceId, updated.contact_id, updated.start_at);
      if (jobIds) {
        await appointmentsRepository.saveJobIds(ctx.workspaceId, id, jobIds.job24hId, jobIds.job2hId);
      }

      emitToWorkspace(ctx.workspaceId, "appointment:updated", updated);
      return updated;
    }

    const updated = await appointmentsRepository.update(ctx, id, dto);
    emitToWorkspace(ctx.workspaceId, "appointment:updated", updated);
    return updated;
  },

  async cancel(ctx: WorkspaceContext, id: string): Promise<Appointment> {
    const existing = await appointmentsService.get(ctx, id);

    // Remove pending reminder jobs
    const oldJob24hId = existing.metadata?.job_24h as string | undefined;
    const oldJob2hId = existing.metadata?.job_2h as string | undefined;
    if (oldJob24hId) await removeJob(oldJob24hId);
    if (oldJob2hId) await removeJob(oldJob2hId);

    // Cancel reminder records
    await appointmentsRepository.cancelRemindersForAppointment(ctx, id);

    const updated = await appointmentsRepository.update(ctx, id, {
      status: "cancelled",
      metadata: { ...existing.metadata, job_24h: undefined, job_2h: undefined },
    });

    emitToWorkspace(ctx.workspaceId, "appointment:updated", updated);
    return updated;
  },

  async complete(ctx: WorkspaceContext, id: string): Promise<Appointment> {
    const existing = await appointmentsService.get(ctx, id);

    const oldJob24hId = existing.metadata?.job_24h as string | undefined;
    const oldJob2hId = existing.metadata?.job_2h as string | undefined;
    if (oldJob24hId) await removeJob(oldJob24hId);
    if (oldJob2hId) await removeJob(oldJob2hId);

    // Cancel reminder records
    await appointmentsRepository.cancelRemindersForAppointment(ctx, id);

    const updated = await appointmentsRepository.update(ctx, id, {
      status: "completed",
      metadata: { ...existing.metadata, job_24h: undefined, job_2h: undefined },
    });

    emitToWorkspace(ctx.workspaceId, "appointment:updated", updated);
    return updated;
  },

  async delete(ctx: WorkspaceContext, id: string): Promise<void> {
    const existing = await appointmentsService.get(ctx, id);

    const oldJob24hId = existing.metadata?.job_24h as string | undefined;
    const oldJob2hId = existing.metadata?.job_2h as string | undefined;
    if (oldJob24hId) await removeJob(oldJob24hId);
    if (oldJob2hId) await removeJob(oldJob2hId);

    await appointmentsRepository.softDelete(ctx, id);
  },

  // ── Reminder management ────────────────────────────────────

  async getReminders(ctx: WorkspaceContext, appointmentId: string): Promise<AppointmentReminder[]> {
    return appointmentsRepository.findRemindersByAppointment(ctx, appointmentId);
  },

  // ── Worker entry point ────────────────────────────────────

  async processReminderJob(data: AppointmentReminderJobData): Promise<void> {
    const appointment = await appointmentsRepository.findByIdRaw(data.appointmentId);
    if (!appointment) {
      logger.warn("appointment: reminder job fired for deleted appointment", { appointmentId: data.appointmentId });
      return;
    }
    if (appointment.status !== "scheduled" && appointment.status !== "confirmed") {
      logger.debug("appointment: reminder job fired but appointment not active", {
        appointmentId: data.appointmentId,
        status: appointment.status,
      });
      return;
    }

    // Find the reminder record
    const reminder = await appointmentsRepository.findRemindersByAppointment(
      { workspaceId: data.workspaceId, userId: "", role: "agent" },
      data.appointmentId,
    ).then((reminders) => reminders.find((r) => r.reminder_type === data.reminderType));

    if (!reminder) {
      logger.warn("appointment: reminder record not found", { appointmentId: data.appointmentId, reminderType: data.reminderType });
      return;
    }

    if (reminder.status !== "scheduled") {
      logger.debug("appointment: reminder already processed", { reminderId: reminder.id, status: reminder.status });
      return;
    }

    // Update reminder status to sent
    await appointmentsRepository.updateReminder(
      { workspaceId: data.workspaceId, userId: "", role: "agent" },
      reminder.id,
      { status: "sent", sent_at: new Date().toISOString() },
    );

    // Mark reminder as sent on appointment (legacy field)
    await appointmentsRepository.markReminderSent(data.workspaceId, data.appointmentId);

    // Emit realtime alert to workspace
    emitToWorkspace(data.workspaceId, "appointment:reminder", {
      appointment,
      reminderType: data.reminderType,
    });

    // WhatsApp reminder sending (opportunistic — best effort)
    // Only if contact has phone and workspace has WhatsApp channel
    try {
      const { sendWhatsAppText } = await import("../whatsapp/whatsapp.client");
      const { db } = await import("../../config/supabase");

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
        logger.debug("appointment: no active WhatsApp channel for workspace", { workspaceId: data.workspaceId });
        return;
      }

      const config = channel.config as { phone_number_id: string; access_token: string };
      if (!config.phone_number_id || !config.access_token) return;

      if (!appointment.contact?.phone) {
        logger.debug("appointment: contact has no phone for WhatsApp reminder", { contactId: data.contactId });
        return;
      }

      const message = data.reminderType === "24h"
        ? `Reminder: You have an appointment "${appointment.title}" tomorrow at ${new Date(appointment.start_at).toLocaleTimeString()}.`
        : `Reminder: Your appointment "${appointment.title}" starts in 2 hours at ${new Date(appointment.start_at).toLocaleTimeString()}.`;

      await sendWhatsAppText(config.phone_number_id, config.access_token, appointment.contact.phone, message);

      // Update reminder status to completed
      await appointmentsRepository.updateReminder(
        { workspaceId: data.workspaceId, userId: "", role: "agent" },
        reminder.id,
        { status: "completed", completed_at: new Date().toISOString() },
      );

      logger.info("appointment: WhatsApp reminder sent", {
        appointmentId: data.appointmentId,
        reminderType: data.reminderType,
      });
    } catch (err) {
      logger.warn("appointment: failed to send WhatsApp reminder", {
        appointmentId: data.appointmentId,
        reminderType: data.reminderType,
        err,
      });
      
      // Update reminder status to failed
      await appointmentsRepository.updateReminder(
        { workspaceId: data.workspaceId, userId: "", role: "agent" },
        reminder.id,
        { 
          status: "failed", 
          failed_reason: err instanceof Error ? err.message : "Unknown error",
          retry_count: reminder.retry_count + 1,
        },
      );
    }

    logger.info("appointment: reminder processed", {
      appointmentId: data.appointmentId,
      reminderType: data.reminderType,
    });
  },
};
