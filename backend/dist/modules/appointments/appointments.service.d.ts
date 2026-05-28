import type { WorkspaceContext, ListResult } from "../../types/common";
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto, AppointmentFilter, AppointmentReminder } from "./appointments.types";
import type { AppointmentReminderJobData } from "../../queues";
export declare const appointmentsService: {
    list(ctx: WorkspaceContext, filter: AppointmentFilter): Promise<ListResult<Appointment>>;
    get(ctx: WorkspaceContext, id: string): Promise<Appointment>;
    create(ctx: WorkspaceContext, dto: CreateAppointmentDto): Promise<Appointment>;
    update(ctx: WorkspaceContext, id: string, dto: UpdateAppointmentDto): Promise<Appointment>;
    cancel(ctx: WorkspaceContext, id: string): Promise<Appointment>;
    complete(ctx: WorkspaceContext, id: string): Promise<Appointment>;
    delete(ctx: WorkspaceContext, id: string): Promise<void>;
    getReminders(ctx: WorkspaceContext, appointmentId: string): Promise<AppointmentReminder[]>;
    processReminderJob(data: AppointmentReminderJobData): Promise<void>;
};
//# sourceMappingURL=appointments.service.d.ts.map