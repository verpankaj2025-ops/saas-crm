import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto, AppointmentFilter, AppointmentReminder, CreateReminderDto, UpdateReminderDto } from "./appointments.types";
export declare const appointmentsRepository: {
    findAll(ctx: WorkspaceContext, filter: AppointmentFilter): Promise<ListResult<Appointment>>;
    findById(ctx: WorkspaceContext, id: UUID): Promise<Appointment | null>;
    create(ctx: WorkspaceContext, dto: CreateAppointmentDto): Promise<Appointment>;
    update(ctx: WorkspaceContext, id: UUID, dto: UpdateAppointmentDto): Promise<Appointment>;
    softDelete(ctx: WorkspaceContext, id: UUID): Promise<void>;
    findByIdRaw(id: UUID): Promise<Appointment | null>;
    saveJobIds(workspaceId: UUID, id: UUID, job24hId: string, job2hId: string): Promise<void>;
    markReminderSent(workspaceId: UUID, id: UUID): Promise<void>;
    findRemindersByAppointment(ctx: WorkspaceContext, appointmentId: UUID): Promise<AppointmentReminder[]>;
    createReminder(ctx: WorkspaceContext, dto: CreateReminderDto): Promise<AppointmentReminder>;
    updateReminder(ctx: WorkspaceContext, id: UUID, dto: UpdateReminderDto): Promise<AppointmentReminder>;
    findReminderByIdRaw(id: UUID): Promise<AppointmentReminder | null>;
    findPendingReminders(before: string): Promise<AppointmentReminder[]>;
    cancelRemindersForAppointment(ctx: WorkspaceContext, appointmentId: UUID): Promise<void>;
};
//# sourceMappingURL=appointments.repository.d.ts.map